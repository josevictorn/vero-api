/*
  Warnings:

  - The `status` column on the `ai_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "vero"."ai_sessions" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'IDENTIFYING';

-- DropEnum
DROP TYPE "vero"."AiSessionStatus";

-- CreateTable
CREATE TABLE "vero"."screening_reports" (
    "id" TEXT NOT NULL,
    "ai_session_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screening_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vero"."screening_reports" ADD CONSTRAINT "screening_reports_ai_session_id_fkey" FOREIGN KEY ("ai_session_id") REFERENCES "vero"."ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."screening_reports" ADD CONSTRAINT "screening_reports_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "vero"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
