import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Vide TOUS les paiements — pour repartir d'une base totalement vierge
 * et retester depuis zéro. Ne touche JAMAIS à :
 * - Les règles de tarif (Cycle, Terme, nombre de matières → montant) —
 *   ce qui ne change jamais indépendamment des tests
 * - Les utilisateurs et rôles (les comptes caissier/administrateur
 *   restent utilisables)
 *
 * Ce logiciel ne stocke plus d'étudiant lui-même depuis la bascule vers
 * l'académique comme seule source de vérité — chaque paiement porte
 * directement son matricule, jamais de table d'étudiants ici à vider
 * séparément.
 */
async function viderPaiements() {
  console.log('Vidage complet des paiements...\n');

  const compteurs: Record<string, number> = {};

  compteurs.paiements = (await prisma.paiement.deleteMany()).count;

  console.log('Terminé. Lignes supprimées :');
  for (const [table, nombre] of Object.entries(compteurs)) {
    console.log(`  ${table} : ${nombre}`);
  }

  console.log('\nConservés intacts : règles de tarif, utilisateurs et rôles.');
}

viderPaiements()
  .catch((erreur) => {
    console.error('Erreur pendant le vidage :', erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
