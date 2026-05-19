-- Objectifs commission / CantinePulse (optionnels par établissement)
-- Doit s’appliquer après 20260512180000_multi_establishment (création de Establishment).

ALTER TABLE "Establishment" ADD COLUMN "ecoRestesServisTargetPct" DOUBLE PRECISION,
ADD COLUMN "ecoReductionTargetPct" DOUBLE PRECISION;

-- Valeurs d’exemple pour l’établissement démo (slug demo)
UPDATE "Establishment"
SET "ecoRestesServisTargetPct" = 8,
    "ecoReductionTargetPct" = 10
WHERE "slug" = 'demo';
