"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, ChefHat } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const MAX_BYTES = 1_500_000; // ~1.5 Mo (data URL)

function storageKey(establishmentId: string) {
  return `c360_dashboard_profile_${establishmentId}`;
}

export function DashboardProfileAvatar({
  establishmentId,
  className,
}: {
  establishmentId: string;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(establishmentId));
      setSrc(stored && stored.startsWith("data:image/") ? stored : null);
    } catch {
      setSrc(null);
    }
  }, [establishmentId]);

  const persist = useCallback(
    (next: string | null) => {
      setSrc(next);
      try {
        if (next) {
          window.localStorage.setItem(storageKey(establishmentId), next);
        } else {
          window.localStorage.removeItem(storageKey(establishmentId));
        }
      } catch {
        // Quota / private mode — on garde quand même l’aperçu en mémoire.
      }
    },
    [establishmentId],
  );

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > MAX_BYTES) {
        window.alert("Image trop lourde (max. environ 1,5 Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") persist(result);
      };
      reader.readAsDataURL(file);
    },
    [persist],
  );

  return (
    <div className={cn("relative shrink-0", className)}>
      <label
        htmlFor={inputId}
        className="group relative block cursor-pointer rounded-full outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2"
        title={src ? "Changer la photo de profil" : "Ajouter une photo de profil"}
      >
        <span className="sr-only">
          {src ? "Changer la photo de profil" : "Ajouter une photo de profil"}
        </span>
        <Avatar className="size-12 border-2 border-emerald-600/80 bg-emerald-50 shadow-sm sm:size-14">
          {src ? <AvatarImage src={src} alt="" /> : null}
          <AvatarFallback className="bg-emerald-50 text-emerald-800">
            <ChefHat className="size-6 sm:size-7" aria-hidden />
          </AvatarFallback>
        </Avatar>
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-zinc-900/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden
        >
          <Camera className="size-5 text-white sm:size-6" />
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {src ? (
        <button
          type="button"
          onClick={() => persist(null)}
          className="absolute -bottom-1 -right-1 rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-zinc-600 shadow-sm hover:bg-zinc-50"
        >
          Retirer
        </button>
      ) : null}
    </div>
  );
}
