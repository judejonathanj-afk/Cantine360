-- CreateEnum
CREATE TYPE "SchoolLevel" AS ENUM ('MATERNELLE', 'PRIMAIRE');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN "level" "SchoolLevel" NOT NULL DEFAULT 'PRIMAIRE';
