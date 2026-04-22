-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW_LEAD', 'INTERVIEWING', 'FORWARDED', 'COMPLETED');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN "lead_status" "LeadStatus" NOT NULL DEFAULT 'NEW_LEAD';
