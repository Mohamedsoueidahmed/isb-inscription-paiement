import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { obtenirUtilisateurConnecte, deconnecter } from '../services/auth.service';
import PanneauChangementMotDePasse from './PanneauChangementMotDePasse';
import './EnTete.css';

export default function EnTete() {
  const navigate = useNavigate();
  const utilisateur = obtenirUtilisateurConnecte();
  const [panneauMotDePasseOuvert, setPanneauMotDePasseOuvert] = useState(false);

  function gererDeconnexion() {
    deconnecter();
    navigate('/connexion');
  }

  return (
    <header className="en-tete">
      <div className="en-tete-ligne-haute">
        <div className="en-tete-identite">
          <div className="en-tete-logo">
            <img src="/logo.png" alt="ISB" />
          </div>
          <span className="en-tete-nom">ISB Inscription et Paiement</span>
        </div>

        {utilisateur && (
          <div className="en-tete-utilisateur">
            <span>{utilisateur.nom}</span>
            <button className="en-tete-bouton-deconnexion" onClick={() => setPanneauMotDePasseOuvert(true)}>
              Changer le mot de passe
            </button>
            <button className="en-tete-bouton-deconnexion" onClick={gererDeconnexion}>
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      <nav className="en-tete-navigation">
        <NavLink to="/tableau-de-bord" className={({ isActive }) => (isActive ? 'lien-actif' : '')}>
          Tableau de bord
        </NavLink>
        <NavLink to="/caisse" className={({ isActive }) => (isActive ? 'lien-actif' : '')}>
          Caisse
        </NavLink>
        <NavLink to="/historique" className={({ isActive }) => (isActive ? 'lien-actif' : '')}>
          Historique
        </NavLink>
        <NavLink to="/pas-en-regle" className={({ isActive }) => (isActive ? 'lien-actif' : '')}>
          Pas en règle
        </NavLink>
        {utilisateur?.role === 'ADMINISTRATEUR' && (
          <NavLink to="/tarifs" className={({ isActive }) => (isActive ? 'lien-actif' : '')}>
            Tarifs
          </NavLink>
        )}
      </nav>

      {panneauMotDePasseOuvert && (
        <PanneauChangementMotDePasse onFerme={() => setPanneauMotDePasseOuvert(false)} />
      )}
    </header>
  );
}
