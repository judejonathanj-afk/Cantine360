"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sparkles,
  Calendar,
  Sun,
  Moon,
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
import { cn } from "@/lib/utils";
function todayYyyyMmDd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ServiceHomeClient() {
  const [date, setDate] = useState(todayYyyyMmDd());
  const [busy, setBusy] = useState<"LUNCH" | "DINNER" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<"LUNCH" | "DINNER" | null>(
    null,
  );

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
    if (!selectedMeal) return;
    setBusy(selectedMeal);
    setError(null);
    try {
      const res = await fetch("/api/services/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, mealType: selectedMeal }),
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
      setBusy(null);
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] space-y-8 pb-12">
      <CantineHero />

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Date du service
              </CardTitle>
              <CardDescription>
                Sélectionnez la date pour ce créneau
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
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Type de repas
              </CardTitle>
              <CardDescription>
                Choisissez <strong className="font-semibold text-foreground">déjeuner ou dîner</strong>{" "}
                pour cette date — obligatoire avant de lancer le service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: "LUNCH" as const,
                    label: "Déjeuner",
                    icon: Sun,
                    time: "midi",
                  },
                  {
                    id: "DINNER" as const,
                    label: "Dîner",
                    icon: Moon,
                    time: "soir",
                  },
                ].map((meal) => (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => setSelectedMeal(meal.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 transition-all",
                      selectedMeal === meal.id
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "border-border bg-background hover:border-primary/50 hover:bg-secondary/50",
                    )}
                  >
                    <meal.icon className="h-8 w-8" />
                    <span className="text-lg font-semibold">{meal.label}</span>
                    <span
                      className={cn(
                        "text-xs",
                        selectedMeal === meal.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {meal.time}
                    </span>
                    {selectedMeal === meal.id ? (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          disabled={!selectedMeal || busy !== null}
          className="h-auto rounded-2xl px-8 py-4 text-lg shadow-xl shadow-primary/25"
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
