import clientApi from './apiClient';
import type { ReponseApi } from '../types/auth.types';
import type {
  SituationFinanciere,
  DonneesEncaissement,
  ResultatEncaissement,
  LignePaiementHistorique,
  EtudiantPasEnRegle,
  LigneCollecteMensuelle,
  CollectePeriode,
} from '../types/paiements.types';

export async function obtenirSituation(
  matricule: string,
  anneeUniversitaire: string,
  terme: string
): Promise<SituationFinanciere> {
  const reponse = await clientApi.get<ReponseApi<SituationFinanciere>>(
    `/paiements/situation/${matricule}/${anneeUniversitaire}/${terme}`
  );
  if (!reponse.data.donnees) throw new Error('Réponse invalide du serveur.');
  return reponse.data.donnees;
}

export async function encaisser(donnees: DonneesEncaissement): Promise<ResultatEncaissement> {
  const reponse = await clientApi.post<ReponseApi<ResultatEncaissement>>('/paiements', donnees);
  if (!reponse.data.donnees) throw new Error('Réponse invalide du serveur.');
  return reponse.data.donnees;
}

export async function obtenirHistorique(matricule: string): Promise<LignePaiementHistorique[]> {
  const reponse = await clientApi.get<ReponseApi<LignePaiementHistorique[]>>(`/paiements/historique/${matricule}`);
  return reponse.data.donnees ?? [];
}

export async function listerNonPayes(anneeUniversitaire: string, terme: string): Promise<EtudiantPasEnRegle[]> {
  const reponse = await clientApi.get<ReponseApi<EtudiantPasEnRegle[]>>(
    `/paiements/pas-en-regle/${anneeUniversitaire}/${terme}`
  );
  return reponse.data.donnees ?? [];
}

export async function obtenirCollecteMensuelle(): Promise<LigneCollecteMensuelle[]> {
  const reponse = await clientApi.get<ReponseApi<LigneCollecteMensuelle[]>>('/paiements/collecte-mensuelle');
  return reponse.data.donnees ?? [];
}

export async function obtenirCollectePeriode(dateDebut: string, dateFin: string): Promise<CollectePeriode> {
  const reponse = await clientApi.get<ReponseApi<CollectePeriode>>('/paiements/collecte-periode', {
    params: { debut: dateDebut, fin: dateFin },
  });
  if (!reponse.data.donnees) throw new Error('Réponse invalide du serveur.');
  return reponse.data.donnees;
}

/**
 * Télécharge le reçu PDF d'un paiement précis — passe par clientApi
 * (pas un lien direct) pour que le jeton d'authentification soit bien
 * joint à la requête.
 */
export async function telechargerRecu(paiementId: string, numeroRecu: string): Promise<void> {
  const reponse = await clientApi.get(`/paiements/${paiementId}/recu-pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([reponse.data]));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `${numeroRecu}.pdf`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}
