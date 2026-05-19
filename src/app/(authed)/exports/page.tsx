"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function todayYyyyMmDd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ExportsPage() {
  const [from, setFrom] = useState(todayYyyyMmDd());
  const [to, setTo] = useState(todayYyyyMmDd());

  const qs = useMemo(
    () => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    [from, to],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exports</h1>
        <p className="mt-1 text-muted-foreground">
          Téléchargement CSV (services + menus) pour Excel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Période</CardTitle>
            <CardDescription>Choisissez la plage de dates.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">Du</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Au</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Télécharger</CardTitle>
            <CardDescription>Fichiers prêts pour Excel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <a href={`/api/exports/services?${qs}`}>
                CSV Services (métriques)
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/exports/menus?${qs}`}>CSV Menus (allergènes)</a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Astuce&nbsp;: sur tablette, le téléchargement dépend du navigateur.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

