import prisma from '../../shared/database/prismaClient';
import type { Terme, Cycle } from '@prisma/client';

export async function listerTarifs() {
  return prisma.tarifTerme.findMany({
    orderBy: [{ cycle: 'asc' }, { terme: 'asc' }, { nombreMatieres: 'asc' }],
  });
}

/**
 * Cherche une règle EXACTE pour (Cycle, Terme, nombre de matières). Ne
 * devine jamais, n'interpole jamais entre deux règles voisines —
 * (LICENCE, AUTOMNE, 3) et (MASTER, AUTOMNE, 3) restent deux montants
 * indépendants, configurés séparément, même à Terme et nombre de
 * matières identiques.
 */
export async function trouverTarif(cycle: string, terme: string, nombreMatieres: number) {
  return prisma.tarifTerme.findUnique({
    where: {
      cycle_terme_nombreMatieres: { cycle: cycle as Cycle, terme: terme as Terme, nombreMatieres },
    },
  });
}

/**
 * Quand aucune règle n'existe pour ce cas précis, la comptable saisit
 * le montant manuellement — et cette saisie EST la nouvelle règle,
 * sauvegardée ici pour que la même combinaison s'applique seule, sans
 * ressaisie, la prochaine fois qu'elle se présente (confirmé
 * explicitement : "le système le sauvegarde et travaille sur cette
 * base-là").
 */
export async function creerOuMettreAJourTarif(cycle: string, terme: string, nombreMatieres: number, montant: number) {
  return prisma.tarifTerme.upsert({
    where: {
      cycle_terme_nombreMatieres: { cycle: cycle as Cycle, terme: terme as Terme, nombreMatieres },
    },
    update: { montant },
    create: { cycle: cycle as Cycle, terme: terme as Terme, nombreMatieres, montant },
  });
}
