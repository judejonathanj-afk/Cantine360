export function GroupNameBadge({
  name,
  schoolName,
  variant = "onColor",
  align = "left",
}: {
  name: string;
  schoolName?: string | null;
  variant?: "onColor" | "plain";
  align?: "left" | "center";
}) {
  const textClass =
    variant === "onColor" ? "text-black" : "text-zinc-900";
  const centered = align === "center";

  return (
    <div className={["min-w-0", centered ? "text-center" : ""].join(" ")}>
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
