import clientApi from './apiClient';
import type { ReponseApi } from '../types/auth.types';
import type { TarifTerme, DonneesTarif } from '../types/tarifs.types';

export async function listerTarifs(): Promise<TarifTerme[]> {
  const reponse = await clientApi.get<ReponseApi<TarifTerme[]>>('/tarifs');
  return reponse.data.donnees ?? [];
}

export async function creerOuMettreAJourTarif(donnees: DonneesTarif): Promise<TarifTerme> {
  const reponse = await clientApi.put<ReponseApi<TarifTerme>>('/tarifs', donnees);
  if (!reponse.data.donnees) throw new Error('Réponse invalide du serveur.');
  return reponse.data.donnees;
}
