import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import EnTete from '../../components/EnTete';
import { listerTarifs, creerOuMettreAJourTarif } from '../../services/tarifs.service';
import type { TarifTerme, Terme, Cycle } from '../../types/tarifs.types';

const LIBELLE_TERME: Record<Terme, string> = { AUTOMNE: 'Automne', PRINTEMPS: 'Printemps', ETE: 'Été' };
const LIBELLE_CYCLE: Record<Cycle, string> = { LICENCE: 'Licence', MASTER: 'Master' };

export default function TarifsPage() {
  const [tarifs, setTarifs] = useState<TarifTerme[]>([]);
  const [chargement, setChargement] = useState(true);

  const [cycle, setCycle] = useState<Cycle>('LICENCE');
  const [terme, setTerme] = useState<Terme>('AUTOMNE');
  const [nombreMatieres, setNombreMatieres] = useState('');
  const [montant, setMontant] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function charger() {
    setChargement(true);
    listerTarifs()
      .then(setTarifs)
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
  }, []);

  async function gererSoumission(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    const nombreMatieresNum = Number(nombreMatieres);
    const montantNum = Number(montant);
    if (!nombreMatieresNum || nombreMatieresNum <= 0 || !montantNum || montantNum <= 0) {
      setErreur('Le nombre de matières et le montant doivent être positifs.');
      return;
    }

    setEnCours(true);
    try {
      await creerOuMettreAJourTarif({ cycle, terme, nombreMatieres: nombreMatieresNum, montant: montantNum });
      setNombreMatieres('');
      setMontant('');
      charger();
    } catch {
      setErreur('Impossible d\'enregistrer ce tarif.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <EnTete />
      <div className="page-contenu">
        <h1>Tarifs</h1>
        <p className="panneau-sous-titre">
          Une règle par combinaison Cycle, Terme et nombre de matières. Licence et Master ne partagent jamais la
          même règle. La caisse crée automatiquement une règle quand aucune n'existe pour un cas rencontré. Cet
          écran sert à les consulter, ou à en préparer à l'avance.
        </p>

        <div className="section-fiche">
          <h2>Ajouter ou corriger une règle</h2>

          <form onSubmit={gererSoumission} className="rangee-formulaire-caisse">
            <div className="champ">
              <label htmlFor="cycle">Cycle</label>
              <select id="cycle" value={cycle} onChange={(e) => setCycle(e.target.value as Cycle)}>
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
              </select>
            </div>
            <div className="champ">
              <label htmlFor="terme">Terme</label>
              <select id="terme" value={terme} onChange={(e) => setTerme(e.target.value as Terme)}>
                <option value="AUTOMNE">Automne</option>
                <option value="PRINTEMPS">Printemps</option>
                <option value="ETE">Été</option>
              </select>
            </div>
            <div className="champ">
              <label htmlFor="nombreMatieres">Nombre de matières</label>
              <input
                id="nombreMatieres"
                type="number"
                value={nombreMatieres}
                onChange={(e) => setNombreMatieres(e.target.value)}
                placeholder="Ex. 3"
                required
              />
            </div>
            <div className="champ">
              <label htmlFor="montant">Montant du Terme (MRU)</label>
              <input
                id="montant"
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="Ex. 20000"
                required
              />
            </div>
            <button type="submit" className="bouton-principal" disabled={enCours}>
              {enCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>

          {erreur && <p className="message-erreur-panneau" role="alert">{erreur}</p>}
        </div>

        <div className="section-fiche">
          <h2>Règles configurées</h2>

          {chargement ? (
            <p className="ligne-vide">Chargement...</p>
          ) : tarifs.length === 0 ? (
            <p className="ligne-vide">Aucune règle configurée pour le moment.</p>
          ) : (
            <table className="tableau-liste">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Terme</th>
                  <th>Nombre de matières</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.map((t) => (
                  <tr key={t.id}>
                    <td>{LIBELLE_CYCLE[t.cycle]}</td>
                    <td>{LIBELLE_TERME[t.terme]}</td>
                    <td>{t.nombreMatieres}</td>
                    <td>{t.montant} MRU</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
