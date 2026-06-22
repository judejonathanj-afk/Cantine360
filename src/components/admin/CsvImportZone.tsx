"use client";

import { useId, useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type CsvImportZoneProps = {
  title: string;
  description: React.ReactNode;
  exampleHref: string;
  exampleLabel?: string;
  busy?: boolean;
  resultMessage?: string | null;
  errorMessage?: string | null;
  onImport: (file: File) => Promise<boolean>;
  embedded?: boolean;
  onColor?: boolean;
  className?: string;
  footer?: React.ReactNode;
};

export function CsvImportZone({
  title,
  description,
  exampleHref,
  exampleLabel = "Télécharger un exemple",
  busy = false,
  resultMessage,
  errorMessage,
  onImport,
  embedded = false,
  onColor = false,
  className,
  footer,
}: CsvImportZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    const ok = await onImport(file);
    if (ok) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={[
        embedded
          ? "flex h-full flex-col"
          : onColor
            ? "rounded-2xl border border-white/10 bg-zinc-950 p-4"
            : "rounded-2xl border border-zinc-200 bg-white p-4",
        className ?? "",
      ].join(" ")}
    >
      {!embedded ? (
        <div
          className={[
            "flex items-center gap-2.5 text-lg font-semibold sm:text-xl",
            onColor ? "text-amber-300" : "text-amber-600",
          ].join(" ")}
        >
          <Upload
            className={["h-5 w-5 shrink-0", onColor ? "text-amber-300" : "text-amber-600"].join(
              " ",
            )}
            aria-hidden
          />
          {title}
        </div>
      ) : null}
      <div
        className={
          embedded
            ? onColor
              ? "text-base text-white/90"
              : "text-base text-black"
            : onColor
              ? "mt-2 text-sm text-white/75"
              : "mt-2 text-sm text-zinc-600"
        }
      >
        {description}
      </div>

      {!embedded ? (
        <ol
          className={[
            "mt-3 list-decimal space-y-1 pl-5 text-sm",
            onColor ? "text-white/80" : "text-zinc-700",
          ].join(" ")}
        >
          <li>
            Cliquez sur{" "}
            <strong className={onColor ? "font-semibold text-white" : "font-semibold text-zinc-900"}>
              Choisir un fichier
            </strong>{" "}
            (depuis votre appareil : Bureau ou Téléchargements).
          </li>
          <li>
            Vérifiez que le nom du fichier apparaît ci-dessous — le bouton{" "}
            <strong className={onColor ? "font-semibold text-white" : "font-semibold text-zinc-900"}>
              Importer
            </strong>{" "}
            s’active ensuite.
          </li>
          <li>
            Cliquez sur{" "}
            <strong className={onColor ? "font-semibold text-white" : "font-semibold text-zinc-900"}>
              Importer
            </strong>
            .
          </li>
        </ol>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label
          htmlFor={inputId}
          className={[
            "flex min-h-[3.25rem] flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors",
            onColor
              ? file
                ? "border-white/60 bg-white/25"
                : "border-white/35 bg-white/10 hover:border-white/50 hover:bg-white/15"
              : file
                ? "border-emerald-400 bg-emerald-50/80"
                : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100/80",
          ].join(" ")}
        >
          <FileSpreadsheet
            className={[
              "h-5 w-5 shrink-0",
              onColor ? "text-white" : file ? "text-emerald-700" : "text-zinc-500",
            ].join(" ")}
            aria-hidden
          />
          <span
            className={[
              "min-w-0 text-base",
              onColor ? "text-white" : "text-black",
            ].join(" ")}
          >
            {file ? (
              <>
                <span className="font-semibold">Fichier prêt :</span>{" "}
                <span>{file.name}</span>
              </>
            ) : (
              <span>
                <span className="font-semibold">Choisir un fichier</span> — aucun fichier
                sélectionné
              </span>
            )}
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <Button
          type="submit"
          disabled={busy || !file}
          className={[
            "h-auto min-h-[3.25rem] shrink-0 px-6 sm:min-w-[9rem]",
            onColor && file ? "bg-white text-zinc-900 hover:bg-white/90" : "",
            onColor && !file ? "bg-white/20 text-white/70" : "",
          ].join(" ")}
          variant={onColor ? "secondary" : file ? "default" : "secondary"}
        >
          {busy ? "Import…" : file ? "Importer" : "Importer"}
        </Button>
      </div>

      {!file ? (
        <p
          className={
            embedded
              ? onColor
                ? "mt-2 text-sm text-white/80"
                : "mt-2 text-sm text-black"
              : onColor
                ? "mt-2 text-xs text-amber-200/90"
                : "mt-2 text-xs text-amber-800"
          }
        >
          Le bouton reste grisé tant qu’aucun fichier n’est choisi — c’est normal.
        </p>
      ) : null}

      <div className="mt-3">
        <a
          href={exampleHref}
          download
          className={
            embedded
              ? onColor
                ? "text-base font-medium text-white underline-offset-2 hover:underline"
                : "text-base font-medium text-black underline-offset-2 hover:underline"
              : onColor
                ? "text-sm font-medium text-white underline-offset-2 hover:underline"
                : "text-sm font-medium text-zinc-700 underline-offset-2 hover:underline"
          }
        >
          {exampleLabel}
        </a>
      </div>

      {footer ? (
        <div
          className={[
            "mt-4 pt-4",
            onColor ? "border-t border-white/20" : "border-t border-zinc-200",
          ].join(" ")}
        >
          {footer}
        </div>
      ) : null}

      {errorMessage ? (
        <p
          className={[
            "mt-3 rounded-xl px-3 py-2 text-sm",
            onColor ? "bg-red-500/25 text-white" : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {errorMessage}
        </p>
      ) : null}

      {resultMessage ? (
        <p
          className={[
            "mt-3 rounded-xl px-3 py-2 text-sm",
            onColor ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800",
          ].join(" ")}
        >
          {resultMessage}
        </p>
      ) : null}
    </form>
  );
}
