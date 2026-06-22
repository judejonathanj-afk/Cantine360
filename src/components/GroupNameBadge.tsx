export function GroupNameBadge({
  name,
  schoolName,
  variant = "onColor",
}: {
  name: string;
  schoolName?: string | null;
  variant?: "onColor" | "plain";
}) {
  const textClass =
    variant === "onColor" ? "text-black" : "text-zinc-900";

  return (
    <div className="min-w-0">
      {schoolName ? (
        <span
          className={[
            "block truncate text-xs font-semibold uppercase tracking-wide",
            variant === "onColor" ? "text-black/75" : "text-zinc-500",
          ].join(" ")}
        >
          {schoolName}
        </span>
      ) : null}
      <span
        className={[
          "inline-block text-xl font-extrabold uppercase tracking-wide md:text-2xl",
          textClass,
        ].join(" ")}
      >
        {name}
      </span>
    </div>
  );
}
