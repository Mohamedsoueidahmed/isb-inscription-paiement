-- Créer l'enum Cycle.
CREATE TYPE "Cycle" AS ENUM ('LICENCE', 'MASTER');

-- Ajouter cycle aux deux tables, d'abord nullable pour pouvoir peupler
-- les lignes déjà existantes.
ALTER TABLE "paiements" ADD COLUMN "cycle" "Cycle";
ALTER TABLE "tarifs_termes" ADD COLUMN "cycle" "Cycle";

-- Déduire le cycle des paiements déjà enregistrés depuis le nom de leur
-- formation (figée sur chaque paiement) — une formation de Master
-- contient toujours "Master" dans son nom, sinon c'est une Licence.
UPDATE "paiements" SET "cycle" = CASE
  WHEN "formation" ILIKE '%master%' THEN 'MASTER'::"Cycle"
  ELSE 'LICENCE'::"Cycle"
END;

-- Les règles de tarif déjà créées avant cette évolution ne portent
-- aucune trace de formation — la seule créée jusqu'ici l'a été pendant
-- un test avec un étudiant de Master ; classée ainsi pour ne pas la
-- perdre. Vérifiez-la après coup dans l'écran Tarifs si besoin.
UPDATE "tarifs_termes" SET "cycle" = 'MASTER'::"Cycle" WHERE "cycle" IS NULL;

-- Rendre les deux colonnes obligatoires, maintenant qu'elles sont
-- peuplées pour chaque ligne existante.
ALTER TABLE "paiements" ALTER COLUMN "cycle" SET NOT NULL;
ALTER TABLE "tarifs_termes" ALTER COLUMN "cycle" SET NOT NULL;

-- Remplacer l'ancienne contrainte unique par la nouvelle, incluant le
-- cycle.
DROP INDEX IF EXISTS "tarifs_termes_terme_nombre_matieres_key";
CREATE UNIQUE INDEX "tarifs_termes_cycle_terme_nombre_matieres_key" ON "tarifs_termes"("cycle", "terme", "nombre_matieres");
