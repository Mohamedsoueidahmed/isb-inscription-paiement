// Gestion des comptes du système de CAISSE.
//
// À lancer DANS le conteneur du backend, jamais directement : utilisez le
// script comptes.sh qui se trouve à côté de docker-compose.yml.
//
//   ./comptes.sh lister           liste tous les comptes
//   ./comptes.sh creer            crée un compte (caissier ou administrateur)
//   ./comptes.sh mot-de-passe     remplace le mot de passe d'un compte
//   ./comptes.sh desactiver       bloque la connexion d'un compte
//   ./comptes.sh activer          rend la connexion à un compte désactivé
//
// Les mots de passe sont demandés à l'écran, sans affichage : ils ne passent
// jamais par la ligne de commande (donc jamais dans l'historique du terminal).
// Un compte ne se supprime jamais : chaque reçu garde le nom de son
// encaisseur. On le désactive.

const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const TOURS_BCRYPT = 12;
const LONGUEUR_MIN_MOT_DE_PASSE = 10;
const ROLES = ['CAISSIER', 'ADMINISTRATEUR'];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// --- Questions à l'écran ----------------------------------------------------

const interactif = Boolean(process.stdin.isTTY);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: interactif,
});
let masque = false;
// Pendant la saisie d'un mot de passe, rien n'est affiché.
rl._writeToOutput = (texte) => {
  if (!masque) process.stdout.write(texte);
};

function poser(question, { secret = false } = {}) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    masque = secret && interactif;
    rl.question('', (reponse) => {
      masque = false;
      if (secret && interactif) process.stdout.write('\n');
      resolve(reponse.trim());
    });
  });
}

function erreur(message) {
  throw new Error(message);
}

async function demanderMotDePasse(identifiant) {
  const premier = await poser(
    `Mot de passe (au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères, une phrase fonctionne très bien) : `,
    { secret: true },
  );
  if (premier.length < LONGUEUR_MIN_MOT_DE_PASSE) {
    erreur(`Le mot de passe doit avoir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`);
  }
  if (new Set(premier).size < 4) {
    erreur('Ce mot de passe est trop simple (trop peu de caractères différents).');
  }
  if (identifiant && premier.toLowerCase().includes(identifiant.toLowerCase())) {
    erreur("Le mot de passe ne doit pas contenir l'identifiant.");
  }
  const second = await poser('Retapez le mot de passe : ', { secret: true });
  if (premier !== second) {
    erreur('Les deux mots de passe ne sont pas identiques. Rien n\'a été modifié.');
  }
  return premier;
}

// --- Commandes ----------------------------------------------------------------

async function lister() {
  const comptes = await prisma.utilisateur.findMany({ orderBy: { creeLe: 'asc' } });
  if (comptes.length === 0) {
    console.log('Aucun compte.');
    return;
  }
  const col = (texte, largeur) => String(texte).padEnd(largeur).slice(0, largeur);
  console.log(`${col('IDENTIFIANT', 20)} ${col('NOM', 28)} ${col('RÔLE', 15)} ${col('ACTIF', 6)} CRÉÉ LE`);
  for (const c of comptes) {
    console.log(
      `${col(c.identifiant, 20)} ${col(c.nom, 28)} ${col(c.role, 15)} ${col(c.estActif ? 'oui' : 'NON', 6)} ${c.creeLe.toISOString().slice(0, 10)}`,
    );
  }
}

async function creer() {
  const identifiant = (await poser('Identifiant de connexion (minuscules, chiffres, . _ -) : '));
  if (!/^[a-z0-9._-]{3,32}$/.test(identifiant)) {
    erreur('Identifiant invalide : 3 à 32 caractères, en minuscules sans accent (lettres, chiffres, point, tiret, soulignement).');
  }
  if (await prisma.utilisateur.findUnique({ where: { identifiant } })) {
    erreur(`L'identifiant "${identifiant}" existe déjà.`);
  }
  const nom = await poser('Nom complet (affiché sur les reçus) : ');
  if (nom.length < 2 || nom.length > 80) {
    erreur('Le nom doit avoir entre 2 et 80 caractères.');
  }
  console.log('Rôle :  1 = CAISSIER (encaisse les paiements)   2 = ADMINISTRATEUR (peut aussi modifier les tarifs)');
  const choix = (await poser('Votre choix [1] : ')) || '1';
  if (choix !== '1' && choix !== '2') {
    erreur('Choix invalide : tapez 1 ou 2.');
  }
  const role = ROLES[Number(choix) - 1];
  const motDePasse = await demanderMotDePasse(identifiant);

  const motDePasseHash = await bcrypt.hash(motDePasse, TOURS_BCRYPT);
  await prisma.utilisateur.create({ data: { identifiant, nom, role, motDePasseHash } });
  console.log(`\nCompte créé : ${identifiant} (${nom}), rôle ${role}.`);
  console.log('La personne peut changer son mot de passe depuis le bouton « Changer le mot de passe ».');
}

async function trouver(question) {
  const identifiant = await poser(question);
  const compte = await prisma.utilisateur.findUnique({ where: { identifiant } });
  if (!compte) erreur(`Aucun compte avec l'identifiant "${identifiant}". Tapez ./comptes.sh lister pour voir la liste.`);
  return compte;
}

async function changerMotDePasse() {
  const compte = await trouver('Identifiant du compte : ');
  console.log(`Compte trouvé : ${compte.identifiant} (${compte.nom}).`);
  const motDePasse = await demanderMotDePasse(compte.identifiant);
  const motDePasseHash = await bcrypt.hash(motDePasse, TOURS_BCRYPT);
  await prisma.utilisateur.update({ where: { id: compte.id }, data: { motDePasseHash } });
  console.log('\nMot de passe remplacé. Les connexions déjà ouvertes restent valables jusqu\'à leur expiration.');
}

async function changerEtat(actif) {
  const compte = await trouver(`Identifiant du compte à ${actif ? 'réactiver' : 'désactiver'} : `);
  if (compte.estActif === actif) {
    console.log(`Ce compte est déjà ${actif ? 'actif' : 'désactivé'}. Rien à faire.`);
    return;
  }
  if (!actif && compte.role === 'ADMINISTRATEUR') {
    const autres = await prisma.utilisateur.count({
      where: { role: 'ADMINISTRATEUR', estActif: true, NOT: { id: compte.id } },
    });
    if (autres === 0) {
      erreur('Impossible : ce serait le dernier administrateur actif. Créez d\'abord un autre administrateur.');
    }
  }
  await prisma.utilisateur.update({ where: { id: compte.id }, data: { estActif: actif } });
  console.log(`\nCompte ${compte.identifiant} ${actif ? 'réactivé' : 'désactivé'}.`);
  if (!actif) {
    console.log('Il ne pourra plus se connecter. Une connexion déjà ouverte reste valable jusqu\'à son expiration.');
  }
}

const COMMANDES = {
  lister,
  creer,
  'mot-de-passe': changerMotDePasse,
  desactiver: () => changerEtat(false),
  activer: () => changerEtat(true),
};

async function main() {
  const commande = process.argv[2];
  if (!COMMANDES[commande]) {
    console.error(`Commande inconnue. Utilisez : ${Object.keys(COMMANDES).join(' | ')}`);
    process.exitCode = 1;
    return;
  }
  await COMMANDES[commande]();
}

main()
  .catch((e) => {
    console.error(`\nErreur : ${e.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
