-- AlterTable
ALTER TABLE "developments" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
