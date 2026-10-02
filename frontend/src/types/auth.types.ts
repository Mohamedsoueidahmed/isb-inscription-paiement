export interface ReponseApi<T> {
  succes: boolean;
  donnees?: T;
  message?: string;
  code?: string;
}

export type LibelleRole = 'ADMINISTRATEUR' | 'CAISSIER';

export interface Utilisateur {
  id: string;
  nom: string;
  identifiant: string;
  role: LibelleRole;
}

export interface ReponseConnexion {
  tokenAcces: string;
  tokenRafraichissement: string;
  utilisateur: Utilisateur;
}
