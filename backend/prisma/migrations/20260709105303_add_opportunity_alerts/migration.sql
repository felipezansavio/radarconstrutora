-- AlterEnum
ALTER TYPE "notification_type" ADD VALUE 'OPPORTUNITY_NEARBY';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "monitoring_latitude" DOUBLE PRECISION,
ADD COLUMN     "monitoring_longitude" DOUBLE PRECISION,
ADD COLUMN     "monitoring_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 15,
ADD COLUMN     "whatsapp_number" TEXT;
