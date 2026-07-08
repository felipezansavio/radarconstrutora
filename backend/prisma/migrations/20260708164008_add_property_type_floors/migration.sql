-- CreateEnum
CREATE TYPE "property_type" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE');

-- AlterTable
ALTER TABLE "developments" ADD COLUMN     "floors_count" INTEGER,
ADD COLUMN     "property_type" "property_type" NOT NULL DEFAULT 'RESIDENTIAL';
