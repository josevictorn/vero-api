-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED', 'LOST');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "lead_status" "LeadStatus" NOT NULL DEFAULT 'NEW';
