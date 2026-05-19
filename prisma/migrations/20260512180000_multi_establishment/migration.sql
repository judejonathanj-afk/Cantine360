-- Multi-établissements : un enregistrement Establishment, données isolées par établissement.

CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adminPin" TEXT NOT NULL,
    "kitchenPin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Establishment_slug_key" ON "Establishment"("slug");

INSERT INTO "Establishment" ("id", "name", "slug", "adminPin", "kitchenPin", "createdAt", "updatedAt")
VALUES (
    'establishment_default_pilot',
    'Établissement principal',
    'demo',
    '1234',
    '0000',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "Group" ADD COLUMN "establishmentId" TEXT;
UPDATE "Group" SET "establishmentId" = 'establishment_default_pilot';
ALTER TABLE "Group" ALTER COLUMN "establishmentId" SET NOT NULL;

ALTER TABLE "Service" ADD COLUMN "establishmentId" TEXT;
UPDATE "Service" SET "establishmentId" = 'establishment_default_pilot';
ALTER TABLE "Service" ALTER COLUMN "establishmentId" SET NOT NULL;

ALTER TABLE "AttendanceImport" ADD COLUMN "establishmentId" TEXT;
UPDATE "AttendanceImport" SET "establishmentId" = 'establishment_default_pilot' WHERE "establishmentId" IS NULL;
ALTER TABLE "AttendanceImport" ALTER COLUMN "establishmentId" SET NOT NULL;

DROP INDEX IF EXISTS "Group_name_key";
CREATE UNIQUE INDEX "Group_establishmentId_name_key" ON "Group"("establishmentId", "name");

DROP INDEX IF EXISTS "Service_date_mealType_key";
CREATE UNIQUE INDEX "Service_establishmentId_date_mealType_key" ON "Service"("establishmentId", "date", "mealType");

ALTER TABLE "Group" ADD CONSTRAINT "Group_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceImport" ADD CONSTRAINT "AttendanceImport_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
