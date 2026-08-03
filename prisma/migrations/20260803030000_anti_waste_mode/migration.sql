-- AlterTable
ALTER TABLE "Establishment" ADD COLUMN "antiWasteModeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Establishment" ADD COLUMN "antiWasteTargetGPer100" DOUBLE PRECISION;
