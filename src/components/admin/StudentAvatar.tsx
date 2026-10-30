import { genderFromFirstName } from "@/lib/firstNameGender";
import { cn } from "@/lib/utils";

export function StudentAvatar({
  firstName,
  className,
  size = 56,
}: {
  firstName: string;
  className?: string;
  size?: number;
}) {
  const girl = genderFromFirstName(firstName) === "girl";
  const label = girl ? "Avatar fille" : "Avatar garçon";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        girl ? "bg-rose-100" : "bg-sky-100",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        aria-hidden
      >
        <circle cx="32" cy="32" r="32" fill={girl ? "#fce7f3" : "#dbeafe"} />
        {girl ? (
          <>
            <ellipse cx="32" cy="38" rx="16" ry="18" fill="#f4c7a5" />
            <path
              d="M14 34c2-16 10-24 18-24s16 8 18 24c-4-8-10-12-18-12S18 26 14 34Z"
              fill="#4a2c1a"
            />
            <path
              d="M12 40c4 14 12 20 20 20s16-6 20-20c-5 6-12 9-20 9s-15-3-20-9Z"
              fill="#4a2c1a"
            />
            <circle cx="25" cy="38" r="2.2" fill="#2b2118" />
            <circle cx="39" cy="38" r="2.2" fill="#2b2118" />
            <path
              d="M28 46c2.2 2.4 5.8 2.4 8 0"
              fill="none"
              stroke="#c45c6a"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path d="M18 50h28c-2 8-8 12-14 12s-12-4-14-12Z" fill="#fb7185" />
          </>
        ) : (
          <>
            <ellipse cx="32" cy="38" rx="16" ry="18" fill="#e0b089" />
            <path
              d="M16 30c3-14 10-20 16-20s13 6 16 20c-3-6-8-9-16-9s-13 3-16 9Z"
              fill="#6b3f24"
            />
            <circle cx="25" cy="38" r="2.2" fill="#2b2118" />
            <circle cx="39" cy="38" r="2.2" fill="#2b2118" />
            <path
              d="M28 46c2.2 2.2 5.8 2.2 8 0"
              fill="none"
              stroke="#b56b4a"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path d="M18 50h28c-2 8-8 12-14 12s-12-4-14-12Z" fill="#38bdf8" />
          </>
        )}
      </svg>
    </span>
  );
}
