/*
  Warnings:

  - Added the required column `name` to the `lawyers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oab` to the `lawyers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oab_state` to the `lawyers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pix_advogado` to the `lawyers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lawyers" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "oab" TEXT NOT NULL,
ADD COLUMN     "oab_state" TEXT NOT NULL,
ADD COLUMN     "pix_advogado" TEXT NOT NULL;
