export type Terme = 'AUTOMNE' | 'PRINTEMPS' | 'ETE';
export type Cycle = 'LICENCE' | 'MASTER';

export interface MatiereAcademique {
  code: string;
  titre: string;
}

export interface SituationFinanciere {
  matricule: string;
  nom: string;
  formation: string;
  cycle: Cycle | null;
  niveau: string;
  anneeUniversitaire: string;
  terme: Terme;
  nombreMatieres: number;
  matieres: MatiereAcademique[];
  montantTerme: number | null;
  tarifConfigure: boolean;
  totalPaye: number;
  reste: number | null;
  statut: 'PAYE' | 'PARTIEL' | 'NON_PAYE' | null;
}

export interface DonneesEncaissement {
  matricule: string;
  anneeUniversitaire: string;
  terme: Terme;
  montant: number;
  modePaiement: string;
  nouveauTarifSaisi?: number;
}

export interface Paiement {
  id: string;
  matricule: string;
  nom: string;
  inn: string | null;
  anneeUniversitaire: string;
  terme: Terme;
  montant: string;
  modePaiement: string;
  cycle: Cycle;
  formation: string;
  niveau: string;
  nombreMatieres: number;
  montantTerme: string;
  totalPayeApres: string;
  resteApres: string;
  caissierId: string;
  numeroRecu: string;
  dateHeure: string;
  caissier?: { id: string; nom: string; identifiant: string };
}

export interface ResultatEncaissement {
  paiement: Paiement;
  etudiant: {
    matricule: string;
    nom: string;
  };
  situationApres: SituationFinanciere;
}

export interface LignePaiementHistorique extends Omit<Paiement, 'caissier'> {
  caissier: { nom: string };
}

export interface EtudiantPasEnRegle {
  matricule: string;
  nom: string;
  formation: string;
  cycle: Cycle | null;
  niveau: string;
  nombreMatieres: number;
  montantTerme: number | null;
  totalPaye: number;
  reste: number | null;
}

export interface LigneCollecteMensuelle {
  mois: string;
  total: number;
}

export interface CollectePeriode {
  total: number;
  paiements: LignePaiementHistorique[];
}
