-- Période de référence pour les objectifs restes (dashboard / export)

CREATE TYPE "EcoObjectivePeriod" AS ENUM ('CALENDAR_YEAR', 'ISO_WEEK', 'CALENDAR_QUARTER', 'SCHOOL_YEAR');

ALTER TABLE "Establishment"
ADD COLUMN "ecoPeriodKind" "EcoObjectivePeriod" NOT NULL DEFAULT 'CALENDAR_YEAR',
ADD COLUMN "ecoSchoolYearStartMonth" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN "ecoSchoolYearStartDay" INTEGER NOT NULL DEFAULT 1;
