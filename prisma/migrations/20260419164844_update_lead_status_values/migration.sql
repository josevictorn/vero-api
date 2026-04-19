-- CreateEnum
CREATE TYPE "LeadStatus_new" AS ENUM ('NEW_LEAD', 'INTERVIEWING', 'FORWARDED', 'COMPLETED');

-- Migrate existing data: map old values to new default
ALTER TABLE "leads" ALTER COLUMN "lead_status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "lead_status" TYPE "LeadStatus_new" USING ('NEW_LEAD'::"LeadStatus_new");
ALTER TABLE "leads" ALTER COLUMN "lead_status" SET DEFAULT 'NEW_LEAD'::"LeadStatus_new";

-- Drop old enum and rename new one
DROP TYPE "LeadStatus";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
