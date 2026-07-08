-- CreateEnum
CREATE TYPE "ai_interaction_type" AS ENUM ('DEVELOPMENT_SCORE', 'COMPANY_ANALYSIS', 'LEAD_CLASSIFICATION', 'APPROACH_WHATSAPP', 'APPROACH_EMAIL', 'APPROACH_CALL', 'CHAT');

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL,
    "type" "ai_interaction_type" NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "company_id" TEXT,
    "development_id" TEXT,
    "lead_id" TEXT,
    "prompt" TEXT,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_interactions_tenant_id_idx" ON "ai_interactions"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_interactions_tenant_id_type_idx" ON "ai_interactions"("tenant_id", "type");

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_development_id_fkey" FOREIGN KEY ("development_id") REFERENCES "developments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
