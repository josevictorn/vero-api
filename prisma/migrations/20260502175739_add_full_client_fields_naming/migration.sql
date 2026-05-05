/*
  Warnings:

  - Added the required column `city` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpf` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuing_agency` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marital_status` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profession` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rg` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "cpf" TEXT NOT NULL,
ADD COLUMN     "issuing_agency" TEXT NOT NULL,
ADD COLUMN     "marital_status" TEXT NOT NULL,
ADD COLUMN     "neighborhood" TEXT NOT NULL,
ADD COLUMN     "profession" TEXT NOT NULL,
ADD COLUMN     "rg" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "zip_code" TEXT NOT NULL;
