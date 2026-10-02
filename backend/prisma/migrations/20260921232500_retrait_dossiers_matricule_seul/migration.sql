-- Ajouter les nouvelles colonnes, d'abord nullable pour pouvoir les
-- peupler depuis les données existantes.
ALTER TABLE "paiements" ADD COLUMN "matricule" TEXT;
ALTER TABLE "paiements" ADD COLUMN "nom" TEXT;
ALTER TABLE "paiements" ADD COLUMN "inn" TEXT;

-- Peupler depuis la relation existante, avant qu'elle ne disparaisse.
UPDATE "paiements" p
SET "matricule" = e."matricule", "nom" = e."nom", "inn" = e."inn"
FROM "etudiants_administratifs" e
WHERE p."etudiant_id" = e."id";

-- Rendre les nouvelles colonnes obligatoires, maintenant qu'elles sont
-- peuplées pour chaque paiement existant.
ALTER TABLE "paiements" ALTER COLUMN "matricule" SET NOT NULL;
ALTER TABLE "paiements" ALTER COLUMN "nom" SET NOT NULL;

-- Retirer l'ancienne relation et la table devenue inutile — ce logiciel
-- ne crée plus jamais d'étudiant lui-même.
ALTER TABLE "paiements" DROP CONSTRAINT "paiements_etudiant_id_fkey";
ALTER TABLE "paiements" DROP COLUMN "etudiant_id";
DROP TABLE "etudiants_administratifs";

-- Index sur le matricule, pour les recherches d'historique par étudiant.
CREATE INDEX "paiements_matricule_idx" ON "paiements"("matricule");
