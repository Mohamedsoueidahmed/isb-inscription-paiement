import clientApi from './apiClient';
import type { ReponseApi, ReponseConnexion, Utilisateur } from '../types/auth.types';

export async function connecter(identifiant: string, motDePasse: string): Promise<Utilisateur> {
  const reponse = await clientApi.post<ReponseApi<ReponseConnexion>>('/auth/connexion', {
    identifiant,
    motDePasse,
  });

  if (!reponse.data.succes || !reponse.data.donnees) {
    throw new Error(reponse.data.message ?? 'Échec de la connexion.');
  }

  const { tokenAcces, tokenRafraichissement, utilisateur } = reponse.data.donnees;
  localStorage.setItem('tokenAcces', tokenAcces);
  localStorage.setItem('tokenRafraichissement', tokenRafraichissement);
  localStorage.setItem('utilisateur', JSON.stringify(utilisateur));

  return utilisateur;
}

export function deconnecter(): void {
  localStorage.removeItem('tokenAcces');
  localStorage.removeItem('tokenRafraichissement');
  localStorage.removeItem('utilisateur');
}

export function obtenirUtilisateurConnecte(): Utilisateur | null {
  const donnees = localStorage.getItem('utilisateur');
  if (!donnees) return null;

  try {
    return JSON.parse(donnees) as Utilisateur;
  } catch {
    return null;
  }
}

/**
 * Un jeton JWT porte sa propre date d'expiration (`exp`, en secondes)
 * dans sa partie centrale, lisible directement sans appeler le
 * serveur. Un jeton illisible est traité comme expiré — jamais comme
 * valide par défaut, en cas de doute.
 */
function tokenEstExpire(token: string): boolean {
  try {
    const partiePayload = token.split('.')[1];
    const payloadBase64 = partiePayload.replace(/-/g, '+').replace(/_/g, '/');
    const complement = '='.repeat((4 - (payloadBase64.length % 4)) % 4);
    const payload = JSON.parse(atob(payloadBase64 + complement)) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function estConnecte(): boolean {
  const token = localStorage.getItem('tokenAcces');
  if (!token) return false;
  return !tokenEstExpire(token);
}

/**
 * Change le mot de passe de l'utilisateur actuellement connecté — le
 * serveur vérifie lui-même que motDePasseActuel est correct avant
 * d'accepter le changement (voir changerMotDePassePropre côté backend),
 * jamais une confiance aveugle dans ce que l'écran envoie.
 */
export async function changerMotDePasse(motDePasseActuel: string, nouveauMotDePasse: string): Promise<void> {
  await clientApi.patch('/auth/mot-de-passe', { motDePasseActuel, nouveauMotDePasse });
}
