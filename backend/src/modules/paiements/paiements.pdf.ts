import PDFDocument from 'pdfkit';
import path from 'path';

const CHEMIN_LOGO = path.join(__dirname, '../../assets/logo.png');
const LIBELLE_TERME: Record<string, string> = { AUTOMNE: 'Automne', PRINTEMPS: 'Printemps', ETE: 'Été' };
const LIBELLE_CYCLE: Record<string, string> = { LICENCE: 'Licence', MASTER: 'Master' };

interface PaiementPourRecu {
  numeroRecu: string;
  dateHeure: Date;
  anneeUniversitaire: string;
  terme: string;
  cycle: string;
  formation: string;
  niveau: string;
  nombreMatieres: number;
  montant: { toString(): string };
  montantTerme: { toString(): string };
  totalPayeApres: { toString(): string };
  resteApres: { toString(): string };
  modePaiement: string;
  matricule: string;
  nom: string;
  inn: string | null;
  caissier: { nom: string };
}

/**
 * Le reçu d'UN paiement précis — jamais recalculé depuis les données
 * actuelles : chaque valeur vient de ce qui a été figé sur ce paiement
 * au moment où il a eu lieu (voir encaisserPaiement, paiements.service.ts),
 * pour qu'un reçu réimprimé plus tard reste identique à celui remis ce
 * jour-là, même si le tarif ou l'affectation académique ont changé
 * depuis.
 */
export function genererRecuPdf(paiement: PaiementPourRecu): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  try {
    doc.image(CHEMIN_LOGO, 50, 45, { width: 50 });
  } catch {
    // Le logo est un agrément visuel, jamais bloquant pour le reçu.
  }

  doc.fontSize(16).font('Helvetica-Bold').text('ISB International School of Business', 110, 50);
  doc.fontSize(11).font('Helvetica').fillColor('#555555').text('Reçu de paiement', 110, 70);
  doc.fillColor('#000000');

  doc.moveDown(3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);

  doc.fontSize(10);
  doc.text(`N° reçu : ${paiement.numeroRecu}`);
  doc.text(`Date : ${paiement.dateHeure.toLocaleString('fr-FR')}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text('Étudiant');
  doc.font('Helvetica');
  doc.text(`Nom : ${paiement.nom}`);
  doc.text(`Matricule : ${paiement.matricule}`);
  if (paiement.inn) {
    doc.text(`INN : ${paiement.inn}`);
  }
  doc.text(`Cycle : ${LIBELLE_CYCLE[paiement.cycle] ?? paiement.cycle}`);
  doc.text(`Formation : ${paiement.formation}`);
  doc.text(`Niveau : ${paiement.niveau}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text('Terme concerné');
  doc.font('Helvetica');
  doc.text(`Année universitaire : ${paiement.anneeUniversitaire}`);
  doc.text(`Terme : ${LIBELLE_TERME[paiement.terme] ?? paiement.terme}`);
  doc.text(`Nombre de matières : ${paiement.nombreMatieres}`);
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(0.5);

  doc.fontSize(11);
  doc.text(`Montant du Terme : ${paiement.montantTerme.toString()} MRU`);
  doc.font('Helvetica-Bold').text(`Paiement actuel : ${paiement.montant.toString()} MRU`);
  doc.font('Helvetica');
  doc.text(`Total déjà payé : ${paiement.totalPayeApres.toString()} MRU`);
  doc.text(`Reste à payer : ${paiement.resteApres.toString()} MRU`);

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);

  doc.fontSize(10);
  doc.text(`Mode de paiement : ${paiement.modePaiement}`);
  doc.text(`Caissier : ${paiement.caissier.nom}`);

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#555555').text('Merci pour votre paiement.', { align: 'center' });

  return doc;
}
