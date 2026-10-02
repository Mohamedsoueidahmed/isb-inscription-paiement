-- Fusionner prénom et nom en un seul champ (prénom d'abord, puis nom),
-- AVANT de supprimer la colonne prenom — pour ne perdre aucune donnée
-- existante. Même convention que côté académique.
UPDATE "etudiants_administratifs" SET "nom" = "prenom" || ' ' || "nom";

-- AlterTable
ALTER TABLE "etudiants_administratifs" DROP COLUMN "prenom";
