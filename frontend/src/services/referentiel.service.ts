import clientApi from './apiClient';
import type { ReponseApi } from '../types/auth.types';

export interface FormationDisponible {
  nom: string;
  cycle: 'LICENCE' | 'MASTER' | null;
}

export async function listerFormationsDisponibles(): Promise<FormationDisponible[]> {
  const reponse = await clientApi.get<ReponseApi<FormationDisponible[]>>('/referentiel/formations');
  return reponse.data.donnees ?? [];
}

export interface AnneeDisponible {
  libelle: string;
  estActive: boolean;
}

export async function listerAnneesDisponibles(): Promise<AnneeDisponible[]> {
  const reponse = await clientApi.get<ReponseApi<AnneeDisponible[]>>('/referentiel/annees');
  return reponse.data.donnees ?? [];
}
