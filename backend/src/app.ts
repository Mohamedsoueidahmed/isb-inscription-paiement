import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import tarifsRoutes from './modules/tarifs/tarifs.routes';
import paiementsRoutes from './modules/paiements/paiements.routes';
import referentielRoutes from './modules/referentiel/referentiel.routes';
import { gestionErreurs } from './shared/middlewares/gestionErreurs';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tarifs', tarifsRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/referentiel', referentielRoutes);

app.use(gestionErreurs);

export default app;
