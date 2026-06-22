-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "establishmentId" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_establishmentId_name_key" ON "School"("establishmentId", "name");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default school per establishment (for existing groups)
INSERT INTO "School" ("id", "name", "active", "createdAt", "updatedAt", "establishmentId")
SELECT
    'school_default_' || e."id",
    e."name",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    e."id"
FROM "Establishment" e;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN "schoolId" TEXT;

UPDATE "Group" g
SET "schoolId" = 'school_default_' || g."establishmentId"
WHERE "schoolId" IS NULL;

ALTER TABLE "Group" ALTER COLUMN "schoolId" SET NOT NULL;

-- DropIndex
DROP INDEX "Group_establishmentId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Group_schoolId_name_key" ON "Group"("schoolId", "name");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
