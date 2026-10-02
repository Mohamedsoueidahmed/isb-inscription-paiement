import { useState } from 'react';
import type { FormEvent } from 'react';
import EnTete from '../../components/EnTete';
import { listerNonPayes } from '../../services/paiements.service';
import type { EtudiantPasEnRegle, Terme } from '../../types/paiements.types';

export default function PasEnReglePage() {
  const [anneeUniversitaire, setAnneeUniversitaire] = useState('');
  const [terme, setTerme] = useState<Terme>('AUTOMNE');

  const [lignes, setLignes] = useState<EtudiantPasEnRegle[]>([]);
  const [aRecherche, setARecherche] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererRecherche(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!anneeUniversitaire.trim()) return;

    setErreur(null);
    setChargement(true);
    setARecherche(true);
    try {
      const resultat = await listerNonPayes(anneeUniversitaire.trim(), terme);
      setLignes(resultat);
    } catch {
      setErreur('Impossible de récupérer la liste pour ce Terme.');
      setLignes([]);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <EnTete />
      <div className="page-contenu">
        <h1>Étudiants pas en règle</h1>
        <p className="panneau-sous-titre">
          Pour un Terme choisi, tous les étudiants que l'académique signale comme concernés, et qui n'ont pas
          encore payé l'ensemble du montant dû.
        </p>

        <div className="section-fiche">
          <form onSubmit={gererRecherche} className="rangee-formulaire-caisse">
            <div className="champ">
              <label htmlFor="annee">Année universitaire</label>
              <input
                id="annee"
                type="text"
                value={anneeUniversitaire}
                onChange={(e) => setAnneeUniversitaire(e.target.value)}
                placeholder="Ex. 2027-2028"
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="terme">Terme</label>
              <select id="terme" value={terme} onChange={(e) => setTerme(e.target.value as Terme)}>
                <option value="AUTOMNE">Automne</option>
                <option value="PRINTEMPS">Printemps</option>
                <option value="ETE">Été</option>
              </select>
            </div>
            <button type="submit" className="bouton-principal" disabled={chargement}>
              {chargement ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>

          {erreur && <p className="message-erreur-panneau" role="alert">{erreur}</p>}
        </div>

        {aRecherche && !chargement && !erreur && (
          <div className="section-fiche">
            <div className="ligne-badges" style={{ marginBottom: 12 }}>
              <span className="badge-etat badge-echoue">{lignes.length} étudiant(s) pas en règle</span>
            </div>

            {lignes.length === 0 ? (
              <p className="ligne-vide">Tout le monde est en règle pour ce Terme.</p>
            ) : (
              <table className="tableau-liste">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Formation</th>
                    <th>Niveau</th>
                    <th>Montant du Terme</th>
                    <th>Payé</th>
                    <th>Reste</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l) => (
                    <tr key={l.matricule}>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{l.matricule}</td>
                      <td>{l.nom}</td>
                      <td>{l.formation}</td>
                      <td>{l.niveau}</td>
                      <td>{l.montantTerme != null ? `${l.montantTerme} MRU` : 'Non configuré'}</td>
                      <td>{l.totalPaye} MRU</td>
                      <td>{l.reste != null ? `${l.reste} MRU` : '—'}</td>
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
