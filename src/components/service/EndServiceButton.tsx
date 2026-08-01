"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { rememberActiveServiceId } from "@/lib/activeService";

type Props = {
  className?: string;
  compact?: boolean;
};

export function EndServiceButton({ className, compact = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        className={cn(
          "rounded-xl border border-red-700 bg-red-600 font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800",
          compact && "gap-2",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className={cn(compact && "truncate text-xs sm:text-sm")}>Fin de service</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer le service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous retournerez à l&apos;écran Service cantine pour choisir une autre date ou un
              autre repas. Les compteurs et le menu déjà saisis restent enregistrés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                rememberActiveServiceId(null);
                router.push("/service");
              }}
            >
              Terminer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
