import { Router, Response, NextFunction } from 'express';
import { authentifier } from '../../shared/middlewares/authentification';
import { listerFormationsAcademiques, listerAnneesAcademiques } from '../../shared/integration/clientAcademique';
import { RequeteAuthentifiee } from '../../types/auth.types';

const router = Router();

router.use(authentifier);

/**
 * Relaie la liste des formations depuis le système académique — le
 * navigateur de la comptable ne parle jamais directement à l'académique
 * (il ne connaît pas la clé d'intégration, réservée à ce serveur) ; il
 * passe toujours par cette route, protégée par la connexion normale de
 * ce logiciel.
 */
router.get('/formations', async (_req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
  try {
    const formations = await listerFormationsAcademiques();
    res.status(200).json({ succes: true, donnees: formations });
  } catch (erreur) {
    next(erreur);
  }
});

/**
 * Même principe que /formations, pour les années universitaires — un
 * vrai menu déroulant à l'écran plutôt qu'un champ texte libre.
 */
router.get('/annees', async (_req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
  try {
    const annees = await listerAnneesAcademiques();
    res.status(200).json({ succes: true, donnees: annees });
  } catch (erreur) {
    next(erreur);
  }
});

export default router;
