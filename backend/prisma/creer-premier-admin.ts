/**
 * Crée le tout premier compte administrateur — nécessaire une seule
 * fois, puisqu'aucun écran ne peut créer de compte sans qu'un compte
 * n'existe déjà pour s'y connecter. Une fois ce premier compte créé,
 * la gestion des autres comptes (caissiers) pourra passer par un écran
 * normal, protégé par une connexion administrateur.
 *
 * Usage :
 *   npx tsx prisma/creer-premier-admin.ts <identifiant> <motDePasse> <nom>
 *
 * Exemple :
 *   npx tsx prisma/creer-premier-admin.ts admin motdepasse123 "Administrateur Principal"
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [identifiant, motDePasse, nom] = process.argv.slice(2);

  if (!identifiant || !motDePasse || !nom) {
    console.error('Usage : npx tsx prisma/creer-premier-admin.ts <identifiant> <motDePasse> <nom>');
    process.exit(1);
  }

  const existant = await prisma.utilisateur.findUnique({ where: { identifiant } });
  if (existant) {
    console.error(`Un utilisateur avec l'identifiant "${identifiant}" existe déjà.`);
    process.exit(1);
  }

  const motDePasseHash = await bcrypt.hash(motDePasse, 12);

  const utilisateur = await prisma.utilisateur.create({
    data: {
      identifiant,
      motDePasseHash,
      nom,
      role: 'ADMINISTRATEUR',
    },
  });

  console.log(`Compte administrateur créé : ${utilisateur.identifiant} (${utilisateur.nom})`);
}

main()
  .catch((erreur) => {
    console.error('Erreur lors de la création du compte :', erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
