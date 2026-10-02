import { Router, Response, NextFunction } from 'express';
import { authentifier, autoriser } from '../../shared/middlewares/authentification';
import { listerTarifs, creerOuMettreAJourTarif } from './tarifs.service';
import { schemaTarif } from './tarifs.validation';
import { ErreurDonneesInvalides } from '../../shared/erreurs/ErreurMetier';
import { RequeteAuthentifiee } from '../../types/auth.types';

const router = Router();

router.use(authentifier);

router.get('/', async (_req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
  try {
    const tarifs = await listerTarifs();
    res.status(200).json({ succes: true, donnees: tarifs });
  } catch (erreur) {
    next(erreur);
  }
});

/**
 * Créer ou corriger une règle de tarif — réservé à l'administrateur, un
 * caissier ne configure pas les prix, seulement les paiements. C'est
 * aussi CETTE route qu'appelle l'écran de caisse quand la comptable
 * saisit un montant manuel pour un cas non configuré.
 */
router.put(
  '/',
  autoriser('ADMINISTRATEUR'),
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const resultatValidation = schemaTarif.safeParse(req.body);
      if (!resultatValidation.success) {
        throw new ErreurDonneesInvalides(resultatValidation.error.issues[0]?.message ?? 'Données invalides.');
      }

      const { cycle, terme, nombreMatieres, montant } = resultatValidation.data;
      const tarif = await creerOuMettreAJourTarif(cycle, terme, nombreMatieres, montant);
      res.status(200).json({ succes: true, donnees: tarif });
    } catch (erreur) {
      next(erreur);
    }
  }
);

export default router;
