-- CreateEnum
CREATE TYPE "Terme" AS ENUM ('AUTOMNE', 'PRINTEMPS', 'ETE');

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('ADMINISTRATEUR', 'CAISSIER');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'CAISSIER',
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudiants_administratifs" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3) NOT NULL,
    "type_bac" TEXT NOT NULL,
    "numero_bac" TEXT NOT NULL,
    "formation_souhaitee" TEXT NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etudiants_administratifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifs_termes" (
    "id" TEXT NOT NULL,
    "terme" "Terme" NOT NULL,
    "nombre_matieres" INTEGER NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarifs_termes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "annee_universitaire" TEXT NOT NULL,
    "terme" "Terme" NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "mode_paiement" TEXT NOT NULL,
    "caissier_id" TEXT NOT NULL,
    "numero_recu" TEXT NOT NULL,
    "date_heure" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_identifiant_key" ON "utilisateurs"("identifiant");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_administratifs_matricule_key" ON "etudiants_administratifs"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "tarifs_termes_terme_nombre_matieres_key" ON "tarifs_termes"("terme", "nombre_matieres");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_numero_recu_key" ON "paiements"("numero_recu");

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiants_administratifs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_caissier_id_fkey" FOREIGN KEY ("caissier_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
