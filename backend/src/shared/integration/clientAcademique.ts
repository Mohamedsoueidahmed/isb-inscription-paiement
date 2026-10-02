import axios from 'axios';
import { ErreurDonneesInvalides, ErreurNonTrouve } from '../erreurs/ErreurMetier';

/**
 * Le SEUL point de contact avec le système académique existant — tout
 * appel à son API passe par ici, jamais dispersé ailleurs dans le code.
 * Ce logiciel n'accède JAMAIS directement à la base de données
 * académique : uniquement par ces deux appels HTTP, avec la clé
 * partagée en en-tête.
 */

function obtenirClientHttp() {
  const url = process.env.URL_API_ACADEMIQUE;
  const cle = process.env.CLE_API_ACADEMIQUE;

  if (!url || !cle) {
    throw new Error(
      "URL_API_ACADEMIQUE et CLE_API_ACADEMIQUE doivent être configurées dans les variables d'environnement."
    );
  }

  return axios.create({
    baseURL: url,
    headers: { 'x-api-key': cle },
    timeout: 10_000,
  });
}

export interface EtudiantAcademique {
  id: string;
  matricule: string;
  nom: string;
  inn: string | null;
  dateNaissance: string | null;
  typeBac: string | null;
  numeroBac: string | null;
  statut: 'ACTIF' | 'ARCHIVE' | 'BLOQUE';
}

/**
 * Retrouve un étudiant côté académique par son matricule — utilisé pour
 * vérifier qu'un dossier académique existe déjà, ou simplement pour
 * afficher son nom sur un reçu. Renvoie null si aucun étudiant ne porte
 * ce matricule côté académique (ce n'est pas une erreur : un étudiant
 * peut très bien avoir un dossier ICI, sans encore avoir été inscrit
 * là-bas).
 *
 * Réutilise une route déjà existante côté académique (jamais modifiée
 * pour ce besoin) : GET /etudiants/par-matricule/:matricule. Cette
 * route-là suppose une session administrateur (jeton de 15 minutes),
 * différente de la clé d'intégration utilisée pour la route dédiée
 * ci-dessous — voir le commentaire sur obtenirInfosTerme.
 */
/**
 * Retrouve un étudiant côté académique par son matricule — utilisé pour
 * confirmer qu'un dossier académique existe avant d'encaisser, et pour
 * figer son nom sur le paiement (voir paiements.service.ts). Renvoie
 * null si aucun étudiant ne porte ce matricule côté académique — ce
 * logiciel ne crée plus jamais d'étudiant lui-même, l'académique est la
 * seule source de vérité pour l'identité.
 *
 * Passe par /integration/etudiants/:matricule (protégée par la clé
 * partagée), jamais par /etudiants/par-matricule/:matricule (celle-là
 * exige une session administrateur, pensée pour le navigateur).
 */
export async function trouverEtudiantAcademique(matricule: string): Promise<EtudiantAcademique | null> {
  try {
    const client = obtenirClientHttp();
    const reponse = await client.get(`/integration/etudiants/${matricule}`);
    return reponse.data?.donnees ?? null;
  } catch (erreur) {
    if (axios.isAxiosError(erreur) && erreur.response?.status === 404) {
      return null;
    }
    throw new ErreurDonneesInvalides(
      "Impossible de contacter le système académique pour vérifier ce matricule."
    );
  }
}

export interface EtudiantParTerme {
  matricule: string;
  nom: string;
  formation: string;
  cycle: 'LICENCE' | 'MASTER' | null;
  niveau: string;
  nombreMatieres: number;
}

/**
 * Tous les étudiants ayant des cours réellement affectés sous un Terme
 * donné, pour l'année universitaire actuellement active côté académique
 * — utilisé pour savoir "qui devrait payer pour ce Terme", à croiser
 * ensuite avec les paiements déjà enregistrés ici.
 */
export async function listerEtudiantsParTerme(anneeUniversitaire: string, terme: string): Promise<EtudiantParTerme[]> {
  const client = obtenirClientHttp();
  try {
    const reponse = await client.get(`/integration/annees/${anneeUniversitaire}/termes/${terme}/etudiants`);
    return reponse.data?.donnees ?? [];
  } catch {
    throw new ErreurDonneesInvalides(
      'Impossible de récupérer la liste des étudiants pour ce Terme depuis le système académique.'
    );
  }
}

export interface FormationAcademique {
  nom: string;
  cycle: 'LICENCE' | 'MASTER' | null;
}

/**
 * La liste des formations actives côté académique — pour proposer un
 * vrai choix à l'écran de création de dossier, plutôt qu'un champ texte
 * libre.
 */
export async function listerFormationsAcademiques(): Promise<FormationAcademique[]> {
  const client = obtenirClientHttp();
  try {
    const reponse = await client.get('/integration/formations');
    return reponse.data?.donnees ?? [];
  } catch {
    throw new ErreurDonneesInvalides('Impossible de récupérer la liste des formations depuis le système académique.');
  }
}

export interface AnneeAcademique {
  libelle: string;
  estActive: boolean;
}

/**
 * Les années universitaires existantes côté académique, les plus
 * récentes d'abord — pour proposer un vrai choix à l'écran (Caisse, Pas
 * en règle) plutôt qu'un champ texte libre où une faute de frappe ne
 * donnerait jamais aucun résultat.
 */
export async function listerAnneesAcademiques(): Promise<AnneeAcademique[]> {
  const client = obtenirClientHttp();
  try {
    const reponse = await client.get('/integration/annees');
    return reponse.data?.donnees ?? [];
  } catch {
    throw new ErreurDonneesInvalides(
      'Impossible de récupérer la liste des années universitaires depuis le système académique.'
    );
  }
}

export interface InfosTermeAcademique {
  matricule: string;
  nom: string;
  anneeUniversitaire: string;
  formation: string;
  cycle: 'LICENCE' | 'MASTER' | null;
  niveau: string;
  terme: string;
  nombreMatieres: number;
  matieres: { code: string; titre: string }[];
}

/**
 * Pour un matricule et un Terme donnés, ce que ce logiciel a besoin de
 * savoir pour déterminer le tarif : combien de matières l'étudiant a-t-il
 * réellement, pour l'année universitaire actuellement active côté
 * académique. Appelle la route dédiée
 * GET /integration/etudiants/:matricule/termes/:terme (créée
 * spécifiquement pour cette communication, protégée par la clé
 * d'intégration — jamais la session administrateur).
 */
export async function obtenirInfosTerme(
  matricule: string,
  anneeUniversitaire: string,
  terme: string
): Promise<InfosTermeAcademique> {
  const client = obtenirClientHttp();
  try {
    const reponse = await client.get(
      `/integration/etudiants/${matricule}/annees/${anneeUniversitaire}/termes/${terme}`
    );
    return reponse.data.donnees;
  } catch (erreur) {
    if (axios.isAxiosError(erreur)) {
      if (erreur.response?.status === 404) {
        throw new ErreurNonTrouve(
          `Inscription académique de ce matricule pour l'année ${anneeUniversitaire}, Terme ${terme}`
        );
      }
      if (erreur.response?.data?.message) {
        throw new ErreurDonneesInvalides(erreur.response.data.message);
      }
    }
    throw new ErreurDonneesInvalides('Impossible de contacter le système académique.');
  }
}
