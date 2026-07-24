import { studentAffectedByMenu } from "@/lib/allergenMatch";
import { wasteWeightForLevel, type ServiceWasteWeights } from "@/lib/serviceWasteByLevel";
import { formatServiceDateKey } from "@/lib/serviceDate";
import type { SchoolLevel } from "@/lib/schoolLevel";

const MENU_CATEGORY_FR: Record<string, string> = {
  STARTER: "Entrée",
  MAIN: "Plat",
  DESSERT: "Dessert",
  OTHER: "Autre",
};

export type DashboardDayDetailRow = {
  date: string;
  mealLabel: string;
  present: number;
  served: number;
  rab: number;
  refused: number;
  wasteWeightG: number;
  wasteWeightMaternelleG: number;
  wasteWeightPrimaireG: number;
  wasteGramsPer100: number | null;
  rabRatePct: number | null;
  refusalRatePct: number | null;
  schools: string;
  classCount: number;
  menuSummary: string;
  concernedStudents: number;
  weighLabel: string;
  servedDelta: number | null;
  wasteDelta: number | null;
};

type MetricIn = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
  group?: {
    id?: string;
    name?: string | null;
    level?: string | null;
    school?: { name?: string | null } | null;
  } | null;
};

type MenuItemIn = {
  category: string;
  label: string;
  allergens: string[];
};

type ServiceIn = ServiceWasteWeights & {
  date: Date;
  metrics: MetricIn[];
  menu?: { items: MenuItemIn[] } | null;
};

type StudentIn = {
  id: string;
  allergens: string[];
  groupId: string;
};

function resolveMetricLevel(level?: string | null): SchoolLevel {
  return level === "MATERNELLE" ? "MATERNELLE" : "PRIMAIRE";
}

function formatMenuSummary(items: MenuItemIn[]): string {
  const filled = items.filter((i) => i.label.trim().length > 0);
  if (filled.length === 0) return "—";

  const byCat = new Map<string, string>();
  for (const item of filled) {
    const key = MENU_CATEGORY_FR[item.category] ?? item.category;
    if (!byCat.has(key)) byCat.set(key, item.label.trim());
  }

  const order = ["Entrée", "Plat", "Dessert", "Autre"];
  const parts: string[] = [];
  for (const cat of order) {
    const label = byCat.get(cat);
    if (label) parts.push(`${cat} : ${label}`);
  }
  for (const [cat, label] of byCat) {
    if (!order.includes(cat)) parts.push(`${cat} : ${label}`);
  }
  return parts.join(" · ");
}

function weighLabelFor(
  matG: number,
  primG: number,
  levelFilter: "all" | SchoolLevel,
): string {
  if (levelFilter === "MATERNELLE") {
    return matG > 0 ? "Pesée faite" : "Pesée manquante";
  }
  if (levelFilter === "PRIMAIRE") {
    return primG > 0 ? "Pesée faite" : "Pesée manquante";
  }
  if (matG > 0 && primG > 0) return "Les deux";
  if (matG > 0) return "Mat. seule";
  if (primG > 0) return "Prim. seule";
  return "Manquante";
}

function ratePct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

export function buildDashboardDayDetailRows(
  services: ServiceIn[],
  opts: {
    levelFilter: "all" | SchoolLevel;
    students: StudentIn[];
  },
): DashboardDayDetailRow[] {
  const { levelFilter, students } = opts;

  type Bucket = {
    present: number;
    served: number;
    rab: number;
    refused: number;
    wasteWeightG: number;
    wasteWeightMaternelleG: number;
    wasteWeightPrimaireG: number;
    schools: Set<string>;
    groupIds: Set<string>;
    menuItems: MenuItemIn[];
  };

  const perDay = new Map<string, Bucket>();

  for (const s of services) {
    const key = formatServiceDateKey(s.date);
    const bucket = perDay.get(key) ?? {
      present: 0,
      served: 0,
      rab: 0,
      refused: 0,
      wasteWeightG: 0,
      wasteWeightMaternelleG: 0,
      wasteWeightPrimaireG: 0,
      schools: new Set<string>(),
      groupIds: new Set<string>(),
      menuItems: [],
    };

    const metrics =
      levelFilter === "all"
        ? s.metrics
        : s.metrics.filter(
            (m) => resolveMetricLevel(m.group?.level) === levelFilter,
          );

    for (const m of metrics) {
      bucket.present += m.presentCount;
      bucket.served += m.servedCount;
      bucket.rab += m.rabCount;
      bucket.refused += m.refusedCount;
      const schoolName = m.group?.school?.name?.trim();
      if (schoolName) bucket.schools.add(schoolName);
      if (m.group?.id) bucket.groupIds.add(m.group.id);
    }

    const servedShare: Record<SchoolLevel, number> = {
      MATERNELLE: 0,
      PRIMAIRE: 0,
    };
    for (const m of s.metrics) {
      servedShare[resolveMetricLevel(m.group?.level)] += m.servedCount;
    }
    const matG = wasteWeightForLevel(s, "MATERNELLE", servedShare);
    const primG = wasteWeightForLevel(s, "PRIMAIRE", servedShare);
    bucket.wasteWeightMaternelleG += matG;
    bucket.wasteWeightPrimaireG += primG;
    if (levelFilter === "MATERNELLE") {
      bucket.wasteWeightG += matG;
    } else if (levelFilter === "PRIMAIRE") {
      bucket.wasteWeightG += primG;
    } else if (s.wasteWeightG != null && s.wasteWeightG > 0) {
      bucket.wasteWeightG += s.wasteWeightG;
    }

    if (bucket.menuItems.length === 0 && s.menu?.items?.length) {
      bucket.menuItems = s.menu.items;
    }

    perDay.set(key, bucket);
  }

  const studentsByGroup = new Map<string, StudentIn[]>();
  for (const st of students) {
    if (!st.allergens.length) continue;
    const list = studentsByGroup.get(st.groupId) ?? [];
    list.push(st);
    studentsByGroup.set(st.groupId, list);
  }

  const sorted = Array.from(perDay.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const rows: DashboardDayDetailRow[] = sorted.map(([date, v]) => {
    const menuAllergenSets = v.menuItems.map((i) => i.allergens);
    const concernedIds = new Set<string>();
    for (const groupId of v.groupIds) {
      for (const st of studentsByGroup.get(groupId) ?? []) {
        if (studentAffectedByMenu(st.allergens, menuAllergenSets)) {
          concernedIds.add(st.id);
        }
      }
    }

    return {
      date,
      mealLabel: "Déjeuner",
      present: v.present,
      served: v.served,
      rab: v.rab,
      refused: v.refused,
      wasteWeightG: v.wasteWeightG,
      wasteWeightMaternelleG: v.wasteWeightMaternelleG,
      wasteWeightPrimaireG: v.wasteWeightPrimaireG,
      wasteGramsPer100:
        v.served > 0 && v.wasteWeightG > 0
          ? Math.round((v.wasteWeightG / v.served) * 100 * 10) / 10
          : null,
      rabRatePct: ratePct(v.rab, v.served),
      refusalRatePct: ratePct(v.refused, v.served),
      schools:
        v.schools.size > 0
          ? Array.from(v.schools).sort((a, b) => a.localeCompare(b, "fr")).join(", ")
          : "—",
      classCount: v.groupIds.size,
      menuSummary: formatMenuSummary(v.menuItems),
      concernedStudents: concernedIds.size,
      weighLabel: weighLabelFor(
        v.wasteWeightMaternelleG,
        v.wasteWeightPrimaireG,
        levelFilter,
      ),
      servedDelta: null,
      wasteDelta: null,
    };
  });

  for (let i = 0; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i]!;
    if (!prev) continue;
    curr.servedDelta = curr.served - prev.served;
    if (curr.wasteWeightG > 0 || prev.wasteWeightG > 0) {
      curr.wasteDelta = curr.wasteWeightG - prev.wasteWeightG;
    }
  }

  return rows;
}
