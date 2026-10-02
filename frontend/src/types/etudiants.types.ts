export interface EtudiantAdministratif {
  id: string;
  matricule: string;
  inn: string;
  nom: string;
  dateNaissance: string;
  typeBac: string;
  numeroBac: string;
  formationSouhaitee: string;
  creeLe: string;
}

export interface DonneesCreationDossier {
  matricule: string;
  inn: string;
  nom: string;
  dateNaissance: string;
  typeBac: string;
  numeroBac: string;
  formationSouhaitee: string;
}
