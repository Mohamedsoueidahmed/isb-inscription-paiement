import app from './app';

// Port différent du système académique (qui tourne sur 3000 par défaut)
// — les deux serveurs peuvent tourner en même temps sur la même
// machine sans jamais se marcher dessus.
const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Serveur d'inscription et paiement démarré sur le port ${PORT}`);
});
