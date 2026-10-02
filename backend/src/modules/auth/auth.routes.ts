import { Router, Request, Response, NextFunction } from 'express';
import { connecter, changerMotDePassePropre } from './auth.service';
import { schemaConnexion, schemaChangementMotDePasse } from './auth.validation';
import { authentifier } from '../../shared/middlewares/authentification';
import { ErreurDonneesInvalides } from '../../shared/erreurs/ErreurMetier';
import { RequeteAuthentifiee } from '../../types/auth.types';

const router = Router();

router.post('/connexion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resultatValidation = schemaConnexion.safeParse(req.body);

    if (!resultatValidation.success) {
      throw new ErreurDonneesInvalides(resultatValidation.error.issues[0]?.message ?? 'Données invalides.');
    }

    const { identifiant, motDePasse } = resultatValidation.data;
    const resultat = await connecter(identifiant, motDePasse);

    res.status(200).json({ succes: true, donnees: resultat });
  } catch (erreur) {
    next(erreur);
  }
});

router.patch(
  '/mot-de-passe',
  authentifier,
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const resultatValidation = schemaChangementMotDePasse.safeParse(req.body);
      if (!resultatValidation.success) {
        throw new ErreurDonneesInvalides(resultatValidation.error.issues[0]?.message ?? 'Données invalides.');
      }

      const utilisateurId = req.utilisateur!.utilisateurId;
      const { motDePasseActuel, nouveauMotDePasse } = resultatValidation.data;

      await changerMotDePassePropre(utilisateurId, motDePasseActuel, nouveauMotDePasse);
      res.status(200).json({ succes: true, donnees: null });
    } catch (erreur) {
      next(erreur);
    }
  }
);

export default router;
