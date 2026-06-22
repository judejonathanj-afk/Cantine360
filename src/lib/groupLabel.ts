export type GroupWithSchool = {
  name: string;
  school: { name: string };
};

/** Libellé complet : « École Anne Frank — CE1 B » */
export function formatGroupLabel(schoolName: string, className: string): string {
  const school = schoolName.trim();
  const cls = className.trim();
  if (!school) return cls;
  if (!cls) return school;
  return `${school} — ${cls}`;
}

export function formatGroupFromParts(group: GroupWithSchool): string {
  return formatGroupLabel(group.school.name, group.name);
}
