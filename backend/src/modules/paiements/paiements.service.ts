import prisma from '../../shared/database/prismaClient';
import { ErreurDonneesInvalides, ErreurNonTrouve } from '../../shared/erreurs/ErreurMetier';
import { obtenirInfosTerme, trouverEtudiantAcademique, listerEtudiantsParTerme } from '../../shared/integration/clientAcademique';
import { trouverTarif, creerOuMettreAJourTarif } from '../tarifs/tarifs.service';
import type { Terme } from '@prisma/client';

/**
 * Numéro de reçu séquentiel, format REC-ANNÉE-NUMÉRO (voir l'exemple du
 * cahier des charges : REC-2026-000125). Le numéro repart de 1 chaque
 * année civile — compté sur les reçus déjà émis CETTE année civile
 * précisément, jamais sur le total depuis toujours.
 */
async function genererNumeroRecu(): Promise<string> {
  const anneeCivile = new Date().getFullYear();
  const compte = await prisma.paiement.count({
    where: { numeroRecu: { startsWith: `REC-${anneeCivile}-` } },
  });
  const numero = String(compte + 1).padStart(6, '0');
  return `REC-${anneeCivile}-${numero}`;
}

/**
 * Confirme qu'un étudiant existe côté académique avant toute opération —
 * ce logiciel ne crée plus jamais d'étudiant lui-même. Renvoie l'étudiant
 * trouvé, ou lève une erreur claire s'il n'existe nulle part.
 */
async function confirmerEtudiantAcademique(matricule: string) {
  const etudiant = await trouverEtudiantAcademique(matricule);
  if (!etudiant) {
    throw new ErreurNonTrouve(`Étudiant avec le matricule "${matricule}" côté académique`);
  }
  return etudiant;
}

/**
 * La situation financière d'un étudiant, pour une année et un Terme
 * précis — jamais stockée, toujours recalculée : le nombre de matières
 * vient de l'appel académique (donc peut changer si l'administrateur
 * académique modifie l'affectation), le tarif de la règle configurée
 * (ou signalée manquante — cherchée par Cycle ET Terme ET nombre de
 * matières, jamais l'un sans les autres, Licence et Master ne
 * partageant jamais la même règle), et le total payé de la somme réelle
 * des paiements déjà enregistrés ici.
 */
export async function obtenirSituationFinanciere(matricule: string, anneeUniversitaire: string, terme: string) {
  // Confirme que l'étudiant existe côté académique avant d'aller plus
  // loin — ce logiciel ne connaît un étudiant que par ce que
  // l'académique lui en dit.
  await confirmerEtudiantAcademique(matricule);

  const infosAcademiques = await obtenirInfosTerme(matricule, anneeUniversitaire, terme);

  const tarif = infosAcademiques.cycle
    ? await trouverTarif(infosAcademiques.cycle, terme, infosAcademiques.nombreMatieres)
    : null;

  const paiementsExistants = await prisma.paiement.findMany({
    where: { matricule, anneeUniversitaire, terme: terme as Terme },
  });
  const totalPaye = paiementsExistants.reduce((somme: number, p: { montant: unknown }) => somme + Number(p.montant), 0);

  const montantTerme = tarif ? Number(tarif.montant) : null;
  const reste = montantTerme != null ? montantTerme - totalPaye : null;

  return {
    matricule,
    nom: infosAcademiques.nom,
    formation: infosAcademiques.formation,
    cycle: infosAcademiques.cycle,
    niveau: infosAcademiques.niveau,
    anneeUniversitaire,
    terme,
    nombreMatieres: infosAcademiques.nombreMatieres,
    matieres: infosAcademiques.matieres,
    montantTerme,
    tarifConfigure: tarif != null,
    totalPaye,
    reste,
    statut: montantTerme == null ? null : reste! <= 0 ? 'PAYE' : totalPaye > 0 ? 'PARTIEL' : 'NON_PAYE',
  };
}

export interface DonneesEncaissement {
  matricule: string;
  anneeUniversitaire: string;
  terme: string;
  montant: number;
  modePaiement: string;
  caissierId: string;
  // Fourni UNIQUEMENT si tarifConfigure valait false à la consultation —
  // la comptable vient de saisir le tarif total du Terme pour ce nombre
  // de matières précis ; il devient la nouvelle règle, sauvegardée
  // avant que le paiement lui-même ne soit enregistré.
  nouveauTarifSaisi?: number;
}

/**
 * Enregistre UN paiement — jamais fusionné avec les précédents. Si
 * aucune règle de tarif n'existait pour ce (Cycle, Terme, nombre de
 * matières), `nouveauTarifSaisi` la crée d'abord, pour que ce cas soit
 * configuré une fois pour toutes.
 */
export async function encaisserPaiement(donnees: DonneesEncaissement) {
  const etudiant = await confirmerEtudiantAcademique(donnees.matricule);
  const infosAcademiques = await obtenirInfosTerme(donnees.matricule, donnees.anneeUniversitaire, donnees.terme);

  if (!infosAcademiques.cycle) {
    throw new ErreurDonneesInvalides(
      "Le cycle (Licence ou Master) de cette formation n'est pas configuré côté académique. Impossible de déterminer le tarif applicable."
    );
  }

  let tarif = await trouverTarif(infosAcademiques.cycle, donnees.terme, infosAcademiques.nombreMatieres);

  if (!tarif) {
    if (donnees.nouveauTarifSaisi == null) {
      throw new ErreurDonneesInvalides(
        `Aucun tarif configuré pour ${infosAcademiques.cycle}, ${donnees.terme} à ${infosAcademiques.nombreMatieres} matières. ` +
          'Indiquez le montant du Terme pour créer la règle avant d\'encaisser.'
      );
    }
    tarif = await creerOuMettreAJourTarif(
      infosAcademiques.cycle,
      donnees.terme,
      infosAcademiques.nombreMatieres,
      donnees.nouveauTarifSaisi
    );
  }

  // Calculé AVANT la création — pour figer sur ce paiement précis ce qui
  // était vrai à cet instant, jamais recalculé plus tard.
  const paiementsExistants = await prisma.paiement.findMany({
    where: { matricule: donnees.matricule, anneeUniversitaire: donnees.anneeUniversitaire, terme: donnees.terme as Terme },
  });
  const totalPayeAvant = paiementsExistants.reduce((somme: number, p: { montant: unknown }) => somme + Number(p.montant), 0);
  const montantTerme = Number(tarif.montant);
  const resteAvant = montantTerme - totalPayeAvant;

  if (donnees.montant > resteAvant) {
    throw new ErreurDonneesInvalides(
      `Le montant saisi (${donnees.montant} MRU) dépasse le reste à payer pour ce Terme (${resteAvant} MRU). ` +
        `Montant maximum accepté : ${resteAvant} MRU.`
    );
  }

  const totalPayeApres = totalPayeAvant + donnees.montant;
  const resteApres = montantTerme - totalPayeApres;

  const numeroRecu = await genererNumeroRecu();

  const paiement = await prisma.paiement.create({
    data: {
      matricule: donnees.matricule,
      nom: etudiant.nom,
      inn: etudiant.inn ?? undefined,
      anneeUniversitaire: donnees.anneeUniversitaire,
      terme: donnees.terme as Terme,
      montant: donnees.montant,
      modePaiement: donnees.modePaiement,
      cycle: infosAcademiques.cycle,
      formation: infosAcademiques.formation,
      niveau: infosAcademiques.niveau,
      nombreMatieres: infosAcademiques.nombreMatieres,
      montantTerme,
      totalPayeApres,
      resteApres,
      caissierId: donnees.caissierId,
      numeroRecu,
    },
    include: { caissier: { select: { id: true, nom: true, identifiant: true } } },
  });

  const situationApres = await obtenirSituationFinanciere(donnees.matricule, donnees.anneeUniversitaire, donnees.terme);

  return { paiement, etudiant, situationApres };
}

export async function obtenirHistoriquePaiements(matricule: string) {
  await confirmerEtudiantAcademique(matricule);
  return prisma.paiement.findMany({
    where: { matricule },
    include: { caissier: { select: { nom: true } } },
    orderBy: { dateHeure: 'desc' },
  });
}

/**
 * Le total encaissé entre deux dates choisies, avec le détail de chaque
 * paiement qui le compose — jamais juste le chiffre seul. `dateFin` est
 * traitée comme incluant toute cette journée-là (jusqu'à minuit le
 * lendemain), pas seulement jusqu'à son tout début.
 */
export async function obtenirCollectePeriode(dateDebut: Date, dateFin: Date) {
  const finInclusive = new Date(dateFin);
  finInclusive.setDate(finInclusive.getDate() + 1);

  const paiements = await prisma.paiement.findMany({
    where: { dateHeure: { gte: dateDebut, lt: finInclusive } },
    include: { caissier: { select: { nom: true } } },
    orderBy: { dateHeure: 'desc' },
  });

  const total = paiements.reduce((somme: number, p: { montant: unknown }) => somme + Number(p.montant), 0);

  return { total, paiements };
}

export async function obtenirPaiementParId(id: string) {
  const paiement = await prisma.paiement.findUnique({
    where: { id },
    include: { caissier: { select: { id: true, nom: true, identifiant: true } } },
  });
  if (!paiement) {
    throw new ErreurNonTrouve('Paiement');
  }
  return paiement;
}

/**
 * Pour un Terme et une année choisis, tous les étudiants qui devraient
 * payer (ceux que l'académique signale comme ayant des cours sous ce
 * Terme) et qui ne sont pas encore en règle — soit un reste à payer
 * supérieur à zéro, soit aucun tarif encore configuré ET rien payé du
 * tout pour ce cas précis. Le tarif est cherché par Cycle ET Terme ET
 * nombre de matières, jamais l'un sans les autres. Ne modifie jamais
 * rien, purement une consultation croisée entre l'académique (qui
 * devrait payer) et les paiements déjà enregistrés ici.
 */
export async function listerNonPayes(anneeUniversitaire: string, terme: string) {
  const etudiants = await listerEtudiantsParTerme(anneeUniversitaire, terme);

  const resultats = [];
  for (const etu of etudiants) {
    const tarif = etu.cycle ? await trouverTarif(etu.cycle, terme, etu.nombreMatieres) : null;
    const paiementsExistants = await prisma.paiement.findMany({
      where: { matricule: etu.matricule, anneeUniversitaire, terme: terme as Terme },
    });
    const totalPaye = paiementsExistants.reduce((somme: number, p: { montant: unknown }) => somme + Number(p.montant), 0);
    const montantTerme = tarif ? Number(tarif.montant) : null;
    const reste = montantTerme != null ? montantTerme - totalPaye : null;

    const pasEnRegle = (reste != null && reste > 0) || (montantTerme == null && totalPaye === 0);
    if (pasEnRegle) {
      resultats.push({
        matricule: etu.matricule,
        nom: etu.nom,
        formation: etu.formation,
        cycle: etu.cycle,
        niveau: etu.niveau,
        nombreMatieres: etu.nombreMatieres,
        montantTerme,
        totalPaye,
        reste,
      });
    }
  }

  return resultats;
}

/**
 * Le montant total encaissé, mois par mois — pour le tableau de bord.
 * Purement local, aucun appel à l'académique : le regroupement se fait
 * ici, en mémoire, sur les paiements déjà enregistrés.
 */
export async function obtenirCollecteMensuelle() {
  const paiements = await prisma.paiement.findMany({
    select: { montant: true, dateHeure: true },
    orderBy: { dateHeure: 'asc' },
  });

  const parMois = new Map<string, number>();
  for (const p of paiements as { montant: unknown; dateHeure: Date }[]) {
    const cle = `${p.dateHeure.getFullYear()}-${String(p.dateHeure.getMonth() + 1).padStart(2, '0')}`;
    parMois.set(cle, (parMois.get(cle) ?? 0) + Number(p.montant));
  }

  return Array.from(parMois.entries()).map(([mois, total]) => ({ mois, total }));
}
