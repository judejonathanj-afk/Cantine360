"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { History, Upload } from "lucide-react";
import { CsvImportZone } from "@/components/admin/CsvImportZone";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const t = SERVICE_INSIGHT_TONES.slate;

function formatFrenchDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

export function ServiceAttendanceImport({
  serviceId,
  presentTotal = 0,
  kitchenMode = false,
  className,
}: {
  serviceId: string;
  presentTotal?: number;
  kitchenMode?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onImport(file: File): Promise<boolean> {
    setBusy(true);
    setResultMessage(null);
    setErrorMessage(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/services/${serviceId}/attendance/import`, {
      method: "POST",
      body: form,
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      groupsUpdated?: number;
      groupsSkipped?: number;
      errors?: string[];
      parseErrors?: string[];
    } | null;

    setBusy(false);

    if (!res.ok) {
      const parts = [data?.error ?? "Import impossible."];
      if (data?.parseErrors?.length) parts.push(...data.parseErrors.slice(0, 3));
      setErrorMessage(parts.join(" "));
      return false;
    }

    const updated = data?.groupsUpdated ?? 0;
    const skipped = data?.groupsSkipped ?? 0;
    setResultMessage(
      `${updated} classe${updated > 1 ? "s" : ""} mise${updated > 1 ? "s" : ""} à jour (présents).` +
        (skipped > 0 ? ` ${skipped} ligne${skipped > 1 ? "s" : ""} ignorée${skipped > 1 ? "s" : ""}.` : ""),
    );
    if (data?.errors?.length) {
      setErrorMessage(data.errors.slice(0, 2).join(" "));
    }

    router.refresh();
    return true;
  }

  async function copyPrevious() {
    if (presentTotal > 0) {
      const ok = window.confirm(
        "Des présents sont déjà saisis. Les remplacer par ceux du dernier service ?",
      );
      if (!ok) return;
    }

    setBusy(true);
    setResultMessage(null);
    setErrorMessage(null);

    const res = await fetch(`/api/services/${serviceId}/attendance/copy-previous`, {
      method: "POST",
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      groupsUpdated?: number;
      previousDate?: string;
    } | null;

    setBusy(false);

    if (!res.ok) {
      setErrorMessage(data?.error ?? "Impossible de reprendre les présents.");
      return;
    }

    const updated = data?.groupsUpdated ?? 0;
    const previousDate = data?.previousDate
      ? formatFrenchDate(data.previousDate)
      : "le service précédent";
    setResultMessage(
      `${updated} classe${updated > 1 ? "s" : ""} reprise${updated > 1 ? "s" : ""} depuis ${previousDate}. Ajustez les absences ou sorties si besoin.`,
    );
    router.refresh();
  }

  if (kitchenMode) {
    return (
      <div className={cn("w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", className)}>
        <Button
          type="button"
          variant="default"
          disabled={busy}
          className="h-auto min-h-[3.25rem] w-full justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold sm:text-lg"
          onClick={() => void copyPrevious()}
        >
          <History className="h-5 w-5 shrink-0" aria-hidden />
          {busy ? "Chargement…" : "Reprendre les présents de la veille"}
        </Button>
        <p className="mt-2 text-sm text-zinc-600">
          Copie les effectifs du dernier déjeuner enregistré. Ajustez ensuite les classes avec
          absents ou sorties.
        </p>
        {errorMessage ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        ) : null}
        {resultMessage ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {resultMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-4 shadow-md", t.shell, className)}>
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.icon,
          )}
        >
          <Upload className="h-5 w-5" aria-hidden />
        </span>
        <div className={cn("min-w-0 flex-1", t.text)}>
          <h2 className="text-lg font-semibold text-amber-300 sm:text-xl">
            Importer les présents (CSV)
          </h2>
          <p className={cn("mt-1 text-sm", t.muted)}>
            Pronote ou tableur — colonnes école, classe, présents.
          </p>
        </div>
      </div>

      <CsvImportZone
        embedded
        onColor
        title="Importer les présents (CSV)"
        description={
          <>
            Pré-remplit le compteur <strong className="font-semibold">Présents</strong> des classes
            concernées pour ce service, ou reprenez ceux du dernier service et ajustez seulement
            les absences ou sorties.
          </>
        }
        exampleHref="/test-import-presents.csv"
        exampleLabel="Télécharger un exemple"
        busy={busy}
        resultMessage={resultMessage}
        errorMessage={errorMessage}
        onImport={onImport}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              className="h-auto min-h-[3.25rem] w-full justify-center gap-2 bg-white px-4 py-3 text-base font-semibold text-zinc-900 shadow-sm hover:bg-white/90"
              onClick={() => void copyPrevious()}
            >
              <History className="h-5 w-5 shrink-0" aria-hidden />
              {busy ? "Chargement…" : "Reprendre les présents de la veille"}
            </Button>
            <p className={cn("mt-2 text-sm", t.muted)}>
              Copie les effectifs du dernier déjeuner enregistré. Ajustez ensuite les classes avec
              absents ou sorties.
            </p>
          </>
        }
      />
    </div>
  );
}
