import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { connecter } from '../../services/auth.service';
import './ConnexionPage.css';

export default function ConnexionPage() {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function gererSoumission(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);

    try {
      await connecter(identifiant, motDePasse);
      navigate('/caisse');
    } catch {
      setErreur('Identifiants incorrects. Vérifiez votre identifiant et votre mot de passe.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="page-connexion">
      <div className="cadre-connexion">
        <div className="identite">
          <img src="/logo.png" alt="ISB International School of Business" className="logo-connexion" />
          <p className="nom-institution">ISB International School of Business</p>
          <p className="sous-titre">Inscription et paiement</p>
        </div>

        <div className="carte-connexion">
          <h1>Connexion à l'espace caisse</h1>

          <form onSubmit={gererSoumission}>
            <div className="champ">
              <label htmlFor="identifiant">Identifiant</label>
              <input
                type="text"
                id="identifiant"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                disabled={enCours}
                required
                autoFocus
              />
            </div>

            <div className="champ">
              <label htmlFor="motdepasse">Mot de passe</label>
              <div className="champ-mot-de-passe">
                <input
                  type={motDePasseVisible ? 'text' : 'password'}
                  id="motdepasse"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  disabled={enCours}
                  required
                />
                <button
                  type="button"
                  className="bouton-afficher-mot-de-passe"
                  onClick={() => setMotDePasseVisible((v) => !v)}
                  tabIndex={-1}
                >
                  {motDePasseVisible ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {erreur && <p className="message-erreur" role="alert">{erreur}</p>}

            <button type="submit" className="bouton-connexion" disabled={enCours}>
              {enCours ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="pied-connexion">Accès réservé à la comptabilité.</p>
      </div>
    </div>
  );
}
