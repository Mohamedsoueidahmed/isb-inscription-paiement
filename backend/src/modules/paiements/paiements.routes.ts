import { Router, Response, NextFunction } from 'express';
import { authentifier } from '../../shared/middlewares/authentification';
import {
  obtenirSituationFinanciere,
  encaisserPaiement,
  obtenirHistoriquePaiements,
  obtenirPaiementParId,
  listerNonPayes,
  obtenirCollecteMensuelle,
  obtenirCollectePeriode,
} from './paiements.service';
import { genererRecuPdf } from './paiements.pdf';
import { schemaEncaissement } from './paiements.validation';
import { ErreurDonneesInvalides } from '../../shared/erreurs/ErreurMetier';
import { extraireChaineUnique } from '../../shared/utils/extraireParametre';
import { RequeteAuthentifiee } from '../../types/auth.types';

const router = Router();

router.use(authentifier);

/**
 * La situation financière consultée AVANT d'encaisser — c'est cet appel
 * que l'écran de caisse fait dès que la comptable tape un matricule et
 * choisit un Terme, pour afficher le montant dû et le reste.
 */
router.get(
  '/situation/:matricule/:anneeUniversitaire/:terme',
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const matricule = extraireChaineUnique(req.params.matricule, 'matricule');
      const anneeUniversitaire = extraireChaineUnique(req.params.anneeUniversitaire, 'anneeUniversitaire');
      const terme = extraireChaineUnique(req.params.terme, 'terme');
      const situation = await obtenirSituationFinanciere(matricule, anneeUniversitaire, terme);
      res.status(200).json({ succes: true, donnees: situation });
    } catch (erreur) {
      next(erreur);
    }
  }
);

router.post('/', async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
  try {
    const resultatValidation = schemaEncaissement.safeParse(req.body);
    if (!resultatValidation.success) {
      throw new ErreurDonneesInvalides(resultatValidation.error.issues[0]?.message ?? 'Données invalides.');
    }

    // req.utilisateur est garanti présent : authentifier l'a déjà posé.
    const caissierId = req.utilisateur!.utilisateurId;
    const resultat = await encaisserPaiement({ ...resultatValidation.data, caissierId });
    res.status(201).json({ succes: true, donnees: resultat });
  } catch (erreur) {
    next(erreur);
  }
});

router.get(
  '/historique/:matricule',
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const matricule = extraireChaineUnique(req.params.matricule, 'matricule');
      const historique = await obtenirHistoriquePaiements(matricule);
      res.status(200).json({ succes: true, donnees: historique });
    } catch (erreur) {
      next(erreur);
    }
  }
);

router.get(
  '/:id/recu-pdf',
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const id = extraireChaineUnique(req.params.id, 'id');
      const paiement = await obtenirPaiementParId(id);
      const doc = genererRecuPdf(paiement);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${paiement.numeroRecu}.pdf"`);
      doc.pipe(res);
      doc.end();
    } catch (erreur) {
      next(erreur);
    }
  }
);

router.get(
  '/pas-en-regle/:anneeUniversitaire/:terme',
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const anneeUniversitaire = extraireChaineUnique(req.params.anneeUniversitaire, 'anneeUniversitaire');
      const terme = extraireChaineUnique(req.params.terme, 'terme');
      const liste = await listerNonPayes(anneeUniversitaire, terme);
      res.status(200).json({ succes: true, donnees: liste });
    } catch (erreur) {
      next(erreur);
    }
  }
);

router.get(
  '/collecte-mensuelle',
  async (_req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const collecte = await obtenirCollecteMensuelle();
      res.status(200).json({ succes: true, donnees: collecte });
    } catch (erreur) {
      next(erreur);
    }
  }
);

router.get(
  '/collecte-periode',
  async (req: RequeteAuthentifiee, res: Response, next: NextFunction) => {
    try {
      const debutTexte = extraireChaineUnique(req.query.debut, 'debut');
      const finTexte = extraireChaineUnique(req.query.fin, 'fin');
      const dateDebut = new Date(debutTexte);
      const dateFin = new Date(finTexte);
      if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
        throw new ErreurDonneesInvalides('Les deux dates doivent être valides.');
      }
      const collecte = await obtenirCollectePeriode(dateDebut, dateFin);
      res.status(200).json({ succes: true, donnees: collecte });
    } catch (erreur) {
      next(erreur);
    }
  }
);

export default router;
