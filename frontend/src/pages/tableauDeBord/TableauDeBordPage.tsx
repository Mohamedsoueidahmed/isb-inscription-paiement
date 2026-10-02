import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import { obtenirCollecteMensuelle, obtenirCollectePeriode, telechargerRecu } from '../../services/paiements.service';
import type { LigneCollecteMensuelle, CollectePeriode, Terme } from '../../types/paiements.types';

const LIBELLE_MOIS: Record<string, string> = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
};

const LIBELLE_TERME: Record<Terme, string> = { AUTOMNE: 'Automne', PRINTEMPS: 'Printemps', ETE: 'Été' };

function libelleMois(cle: string): string {
  const [annee, mois] = cle.split('-');
  return `${LIBELLE_MOIS[mois] ?? mois} ${annee}`;
}

export default function TableauDeBordPage() {
  const [lignes, setLignes] = useState<LigneCollecteMensuelle[]>([]);
  const [chargement, setChargement] = useState(true);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [periode, setPeriode] = useState<CollectePeriode | null>(null);
  const [chargementPeriode, setChargementPeriode] = useState(false);
  const [erreurPeriode, setErreurPeriode] = useState<string | null>(null);

  useEffect(() => {
    obtenirCollecteMensuelle()
      .then(setLignes)
      .finally(() => setChargement(false));
  }, []);

  const totalGeneral = lignes.reduce((somme, l) => somme + l.total, 0);

  async function gererRecherchePeriode(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!dateDebut || !dateFin) return;

    setErreurPeriode(null);
    setChargementPeriode(true);
    try {
      const resultat = await obtenirCollectePeriode(dateDebut, dateFin);
      setPeriode(resultat);
    } catch {
      setErreurPeriode('Impossible de récupérer la collecte pour cette période.');
      setPeriode(null);
    } finally {
      setChargementPeriode(false);
    }
  }

  return (
    <div>
      <EnTete />
      <div className="page-contenu">
        <h1>Tableau de bord</h1>

        <div className="section-fiche">
          <h2>Montant collecté, par mois</h2>

          {chargement ? (
            <p className="ligne-vide">Chargement...</p>
          ) : lignes.length === 0 ? (
            <p className="ligne-vide">Aucun paiement enregistré pour le moment.</p>
          ) : (
            <>
              <div className="ligne-badges" style={{ marginBottom: 12 }}>
                <span className="badge-etat badge-valide">Total, tous mois confondus : {totalGeneral} MRU</span>
              </div>
              <table className="tableau-liste">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Montant collecté</th>
                  </tr>
                </thead>
                <tbody>
                  {[...lignes].reverse().map((l) => (
                    <tr key={l.mois}>
                      <td>{libelleMois(l.mois)}</td>
                      <td>{l.total} MRU</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="section-fiche">
          <h2>Montant collecté, sur une période choisie</h2>

          <form onSubmit={gererRecherchePeriode} className="rangee-formulaire-caisse">
            <div className="champ">
              <label htmlFor="dateDebut">Du</label>
              <input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="dateFin">Au</label>
              <input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="bouton-principal" disabled={chargementPeriode}>
              {chargementPeriode ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>

          {erreurPeriode && <p className="message-erreur-panneau" role="alert">{erreurPeriode}</p>}

          {periode && !chargementPeriode && !erreurPeriode && (
            <>
              <div className="ligne-badges" style={{ margin: '12px 0' }}>
                <span className="badge-etat badge-valide">Total sur cette période : {periode.total} MRU</span>
                <span className="badge-etat">{periode.paiements.length} paiement(s)</span>
              </div>

              {periode.paiements.length === 0 ? (
                <p className="ligne-vide">Aucun paiement enregistré sur cette période.</p>
              ) : (
                <table className="tableau-liste">
                  <thead>
                    <tr>
                      <th>Reçu</th>
                      <th>Date</th>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Terme</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Caissier</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {periode.paiements.map((ligne) => (
                      <tr key={ligne.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{ligne.numeroRecu}</td>
                        <td>{new Date(ligne.dateHeure).toLocaleDateString('fr-FR')}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{ligne.matricule}</td>
                        <td>{ligne.nom}</td>
                        <td>{LIBELLE_TERME[ligne.terme]}</td>
                        <td>{ligne.montant} MRU</td>
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
            </>
          )}
        </div>

        <div className="section-fiche">
          <h2>Étudiants pas en règle</h2>
          <p className="panneau-sous-titre">
            Choisissez une année et un Terme pour voir précisément qui n'a pas encore payé.
          </p>
          <Link to="/pas-en-regle" className="bouton-secondaire">
            Consulter la liste
          </Link>
        </div>
      </div>
    </div>
  );
}
