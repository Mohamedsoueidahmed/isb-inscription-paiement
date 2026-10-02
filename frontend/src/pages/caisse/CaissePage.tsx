import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import EnTete from '../../components/EnTete';
import { obtenirSituation, encaisser, telechargerRecu } from '../../services/paiements.service';
import { listerAnneesDisponibles } from '../../services/referentiel.service';
import type { AnneeDisponible } from '../../services/referentiel.service';
import type { SituationFinanciere, Terme, ResultatEncaissement } from '../../types/paiements.types';

const LIBELLE_TERME: Record<Terme, string> = { AUTOMNE: 'Automne', PRINTEMPS: 'Printemps', ETE: 'Été' };
const LIBELLE_STATUT: Record<string, string> = { PAYE: 'Payé', PARTIEL: 'Partiel', NON_PAYE: 'Non payé' };
const LIBELLE_CYCLE: Record<string, string> = { LICENCE: 'Licence', MASTER: 'Master' };

export default function CaissePage() {
  const [matricule, setMatricule] = useState('');
  const [anneesListe, setAnneesListe] = useState<AnneeDisponible[]>([]);
  const [anneeUniversitaire, setAnneeUniversitaire] = useState('');
  const [terme, setTerme] = useState<Terme>('AUTOMNE');

  const [chargementConsultation, setChargementConsultation] = useState(false);
  const [erreurConsultation, setErreurConsultation] = useState<string | null>(null);
  const [situation, setSituation] = useState<SituationFinanciere | null>(null);

  const [nouveauTarif, setNouveauTarif] = useState('');
  const [montantAEncaisser, setMontantAEncaisser] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [enCoursEncaissement, setEnCoursEncaissement] = useState(false);
  const [erreurEncaissement, setErreurEncaissement] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ResultatEncaissement | null>(null);

  // L'année active côté académique est la plus probable à vouloir — elle
  // est pré-sélectionnée, mais reste librement modifiable (un paiement en
  // retard pour une année déjà terminée reste un cas réel).
  useEffect(() => {
    listerAnneesDisponibles()
      .then((annees) => {
        setAnneesListe(annees);
        const active = annees.find((a) => a.estActive);
        setAnneeUniversitaire(active?.libelle ?? annees[0]?.libelle ?? '');
      })
      .catch(() => {
        // Silencieux ici — le champ reste vide, l'administration verra
        // immédiatement qu'aucune année n'est proposée, sans bloquer le
        // reste de l'écran pour autant.
      });
  }, []);

  async function gererConsultation(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreurConsultation(null);
    setSituation(null);
    setConfirmation(null);
    setNouveauTarif('');
    setMontantAEncaisser('');

    if (!matricule.trim() || !anneeUniversitaire.trim()) return;

    setChargementConsultation(true);
    try {
      // Aucune vérification locale préalable — ce logiciel ne connaît un
      // étudiant que par ce que l'académique en dit ; si le matricule
      // n'existe nulle part là-bas, obtenirSituation le signale déjà
      // clairement, avec un message précis.
      const resultat = await obtenirSituation(matricule.trim(), anneeUniversitaire.trim(), terme);
      setSituation(resultat);
    } catch (erreur: unknown) {
      const message =
        (erreur as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Impossible de consulter la situation de cet étudiant.';
      setErreurConsultation(message);
    } finally {
      setChargementConsultation(false);
    }
  }

  async function gererEncaissement(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreurEncaissement(null);

    const montant = Number(montantAEncaisser);
    if (!montant || montant <= 0) {
      setErreurEncaissement('Le montant à encaisser doit être positif.');
      return;
    }

    if (situation && !situation.tarifConfigure && (!nouveauTarif || Number(nouveauTarif) <= 0)) {
      setErreurEncaissement("Indiquez le montant du Terme avant d'encaisser : aucun tarif configuré pour ce cas.");
      return;
    }

    if (situation && situation.reste != null && montant > situation.reste) {
      setErreurEncaissement(
        `Le montant saisi (${montant} MRU) dépasse le reste à payer pour ce Terme (${situation.reste} MRU). ` +
          `Montant maximum accepté : ${situation.reste} MRU.`
      );
      return;
    }

    setEnCoursEncaissement(true);
    try {
      const resultat = await encaisser({
        matricule: matricule.trim(),
        anneeUniversitaire: anneeUniversitaire.trim(),
        terme,
        montant,
        modePaiement,
        nouveauTarifSaisi: situation && !situation.tarifConfigure ? Number(nouveauTarif) : undefined,
      });
      setConfirmation(resultat);
      setSituation(resultat.situationApres);
      setMontantAEncaisser('');
      setNouveauTarif('');
    } catch (erreur: unknown) {
      const message =
        (erreur as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'enregistrer ce paiement.";
      setErreurEncaissement(message);
    } finally {
      setEnCoursEncaissement(false);
    }
  }

  return (
    <div>
      <EnTete />
      <div className="page-contenu">
        <h1>Caisse</h1>

        <div className="section-fiche">
          <form onSubmit={gererConsultation} className="rangee-formulaire-caisse">
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
            <div className="champ">
              <label htmlFor="annee">Année universitaire</label>
              <select
                id="annee"
                value={anneeUniversitaire}
                onChange={(e) => setAnneeUniversitaire(e.target.value)}
                disabled={anneesListe.length === 0}
                required
              >
                <option value="">
                  {anneesListe.length === 0 ? 'Chargement...' : 'Choisir une année'}
                </option>
                {anneesListe.map((a) => (
                  <option key={a.libelle} value={a.libelle}>
                    {a.libelle}
                    {a.estActive ? ' (active)' : ''}
                  </option>
                ))}
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
            <button type="submit" className="bouton-principal" disabled={chargementConsultation}>
              {chargementConsultation ? 'Consultation...' : 'Consulter'}
            </button>
          </form>

          {erreurConsultation && (
            <p className="message-erreur-panneau" role="alert">{erreurConsultation}</p>
          )}
        </div>

        {situation && (
          <div className="section-fiche">
            <h2>{situation.nom}</h2>
            <p className="panneau-sous-titre">
              {situation.cycle ? `${LIBELLE_CYCLE[situation.cycle]} · ` : ''}
              {situation.formation} · {situation.niveau} · {LIBELLE_TERME[situation.terme]} {situation.anneeUniversitaire}
            </p>

            <table className="tableau-liste" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Matière</th>
                </tr>
              </thead>
              <tbody>
                {situation.matieres.map((m) => (
                  <tr key={m.code}>
                    <td>{m.code}</td>
                    <td>{m.titre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="panneau-sous-titre">{situation.nombreMatieres} matière(s) au total.</p>

            {!situation.tarifConfigure && (
              <div className="champ" style={{ maxWidth: 300, marginTop: 16 }}>
                <label htmlFor="nouveauTarif">
                  Montant du Terme (aucun tarif configuré pour {LIBELLE_TERME[situation.terme]} à{' '}
                  {situation.nombreMatieres} matières)
                </label>
                <input
                  id="nouveauTarif"
                  type="number"
                  value={nouveauTarif}
                  onChange={(e) => setNouveauTarif(e.target.value)}
                  placeholder="Ex. 15000"
                />
              </div>
            )}

            {situation.tarifConfigure && (
              <div className="ligne-badges" style={{ marginTop: 16 }}>
                <span className="badge-etat">Montant du Terme : {situation.montantTerme} MRU</span>
                <span className="badge-etat badge-valide">Total payé : {situation.totalPaye} MRU</span>
                <span className="badge-etat badge-en-attente">Reste : {situation.reste} MRU</span>
                <span className="badge-etat">{LIBELLE_STATUT[situation.statut ?? ''] ?? situation.statut}</span>
              </div>
            )}

            <form onSubmit={gererEncaissement} className="rangee-formulaire-caisse" style={{ marginTop: 20 }}>
              <div className="champ">
                <label htmlFor="montant">Montant à encaisser</label>
                <input
                  id="montant"
                  type="number"
                  value={montantAEncaisser}
                  onChange={(e) => setMontantAEncaisser(e.target.value)}
                  placeholder="Ex. 5000"
                  required
                />
              </div>
              <div className="champ">
                <label htmlFor="mode">Mode de paiement</label>
                <select id="mode" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                  <option value="Espèces">Espèces</option>
                  <option value="Bankily">Bankily</option>
                  <option value="Sedad">Sedad</option>
                  <option value="Masrivi">Masrivi</option>
                  <option value="Click">Click</option>
                  <option value="BIM Bank">BIM Bank</option>
                </select>
              </div>
              <button type="submit" className="bouton-principal" disabled={enCoursEncaissement}>
                {enCoursEncaissement ? 'Encaissement...' : 'Encaisser'}
              </button>
            </form>

            {erreurEncaissement && (
              <p className="message-erreur-panneau" role="alert">{erreurEncaissement}</p>
            )}
          </div>
        )}

        {confirmation && (
          <div className="section-fiche">
            <h2>Paiement enregistré</h2>
            <p>
              Reçu <strong>{confirmation.paiement.numeroRecu}</strong> : {confirmation.paiement.montant} MRU encaissés,
              le {new Date(confirmation.paiement.dateHeure).toLocaleString('fr-FR')}.
            </p>
            <p className="panneau-sous-titre">
              Reste à payer pour ce Terme : {confirmation.situationApres.reste} MRU.
            </p>
            <button
              className="bouton-secondaire"
              onClick={() => telechargerRecu(confirmation.paiement.id, confirmation.paiement.numeroRecu)}
            >
              Télécharger le reçu (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
