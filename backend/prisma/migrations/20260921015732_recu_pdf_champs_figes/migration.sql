/*
  Warnings:

  - Added the required column `formation` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montant_terme` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `niveau` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_matieres` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reste_apres` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_paye_apres` to the `paiements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "formation" TEXT NOT NULL,
ADD COLUMN     "montant_terme" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "niveau" TEXT NOT NULL,
ADD COLUMN     "nombre_matieres" INTEGER NOT NULL,
ADD COLUMN     "reste_apres" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "total_paye_apres" DECIMAL(10,2) NOT NULL;
