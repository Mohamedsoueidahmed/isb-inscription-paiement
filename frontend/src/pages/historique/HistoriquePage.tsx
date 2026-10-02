import { useState } from 'react';
import type { FormEvent } from 'react';
import EnTete from '../../components/EnTete';
import { obtenirHistorique, telechargerRecu } from '../../services/paiements.service';
import type { LignePaiementHistorique, Terme } from '../../types/paiements.types';

const LIBELLE_TERME: Record<Terme, string> = { AUTOMNE: 'Automne', PRINTEMPS: 'Printemps', ETE: 'Été' };

export default function HistoriquePage() {
  const [matricule, setMatricule] = useState('');
  const [lignes, setLignes] = useState<LignePaiementHistorique[]>([]);
  const [aRecherche, setARecherche] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererRecherche(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!matricule.trim()) return;

    setErreur(null);
    setChargement(true);
    setARecherche(true);
    try {
      const resultat = await obtenirHistorique(matricule.trim());
      setLignes(resultat);
    } catch {
      setErreur('Impossible de récupérer l\'historique de ce matricule.');
      setLignes([]);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <EnTete />
      <div className="page-contenu">
        <h1>Historique des paiements</h1>

        <div className="section-fiche">
          <form onSubmit={gererRecherche} className="rangee-formulaire-caisse">
            <div className="champ">
              <label htmlFor="matricule">Matricule</label>
              <input
                id="matricule"
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Ex. 12510001"
                required
              />
            </div>
            <button type="submit" className="bouton-principal" disabled={chargement}>
              {chargement ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>

          {erreur && <p className="message-erreur-panneau" role="alert">{erreur}</p>}
        </div>

        {aRecherche && !chargement && !erreur && (
          <div className="section-fiche">
            {lignes.length === 0 ? (
              <p className="ligne-vide">Aucun paiement enregistré pour ce matricule.</p>
            ) : (
              <table className="tableau-liste">
                <thead>
                  <tr>
                    <th>Reçu</th>
                    <th>Date</th>
                    <th>Année</th>
                    <th>Terme</th>
                    <th>Montant payé</th>
                    <th>Reste (ce Terme)</th>
                    <th>Mode</th>
                    <th>Caissier</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{ligne.numeroRecu}</td>
                      <td>{new Date(ligne.dateHeure).toLocaleDateString('fr-FR')}</td>
                      <td>{ligne.anneeUniversitaire}</td>
                      <td>{LIBELLE_TERME[ligne.terme]}</td>
                      <td>{ligne.montant} MRU</td>
                      <td>{ligne.resteApres} MRU</td>
                      <td>{ligne.modePaiement}</td>
                      <td>{ligne.caissier.nom}</td>
                      <td>
                        <button
                          className="bouton-secondaire"
                          onClick={() => telechargerRecu(ligne.id, ligne.numeroRecu)}
                        >
                          Reçu (PDF)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
