/*
  Warnings:

  - The `status` column on the `ai_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AiSessionStatus" AS ENUM ('IDENTIFYING', 'INTERVIEWING', 'FORWARDED', 'BOOKING', 'BOOKED');

-- AlterTable
ALTER TABLE "ai_sessions" DROP COLUMN "status",
ADD COLUMN     "status" "AiSessionStatus" NOT NULL DEFAULT 'IDENTIFYING';
