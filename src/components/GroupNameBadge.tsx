export function GroupNameBadge({
  name,
  variant = "onColor",
}: {
  name: string;
  variant?: "onColor" | "plain";
}) {
  return (
    <span
      className={[
        "inline-block text-xl font-extrabold uppercase tracking-wide md:text-2xl",
        variant === "onColor" ? "text-black" : "text-zinc-900",
      ].join(" ")}
    >
      {name}
    </span>
  );
}
