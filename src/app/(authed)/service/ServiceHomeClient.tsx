"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sparkles,
  Calendar,
  Utensils,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CantineHero } from "@/components/service/CantineHero";
import { ChildDrawnSun } from "@/components/service/ChildDrawnSun";
import { SCHOOL_MEAL_TYPE } from "@/lib/mealType";

function todayYyyyMmDd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ServiceHomeClient() {
  const [date, setDate] = useState(todayYyyyMmDd());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedDateObj = useMemo(
    () => new Date(date + "T12:00:00"),
    [date],
  );

  const prettyDate = useMemo(() => {
    try {
      return format(selectedDateObj, "EEEE d MMMM yyyy", { locale: fr });
    } catch {
      return date;
    }
  }, [selectedDateObj, date]);

  async function startService() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, mealType: SCHOOL_MEAL_TYPE }),
      });
      if (!res.ok) {
        setError("Impossible de créer/ouvrir le service (base ou réseau).");
        return;
      }
      const data = (await res.json()) as { serviceId: string };
      setSuccess(true);
      window.setTimeout(() => {
        window.location.assign(`/service/${data.serviceId}`);
      }, 600);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] space-y-8 pb-12">
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <CantineHero />
      </div>

      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="grid gap-6 sm:grid-cols-2 sm:items-stretch">
        <motion.div
          className="h-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="h-full border-zinc-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Date du service
              </CardTitle>
              <CardDescription>
                Sélectionnez la date du déjeuner à suivre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              />
              <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/20 via-primary/12 to-primary/6 p-4">
                <p className="text-sm text-muted-foreground">Date sélectionnée</p>
                <p className="mt-1 text-lg font-semibold capitalize text-foreground">
                  {prettyDate}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="h-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="h-full border-zinc-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Repas
              </CardTitle>
              <CardDescription>
                Maternelle et primaire : suivi du <strong className="font-semibold text-foreground">déjeuner</strong> (midi) uniquement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
                  <ChildDrawnSun className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Déjeuner</p>
                  <p className="text-sm text-muted-foreground">Service de midi — seul créneau suivi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          disabled={busy}
          className="h-auto rounded-2xl border-2 border-amber-400 px-8 py-4 text-lg shadow-xl shadow-primary/25"
          onClick={() => void startService()}
        >
          <Sparkles className="h-5 w-5" />
          {busy ? "Ouverture…" : "Démarrer le service"}
          <ArrowRight className="h-5 w-5" />
        </Button>
        {error ? (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {success ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mx-4 max-w-md rounded-3xl bg-card p-8 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Service ouvert
              </h3>
              <p className="mt-2 text-muted-foreground">
                Redirection vers les groupes…
              </p>
              <Badge variant="secondary" className="mt-4">
                {prettyDate}
              </Badge>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
