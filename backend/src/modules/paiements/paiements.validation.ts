import { z } from 'zod';

export const schemaEncaissement = z.object({
  matricule: z.string().min(1, { message: 'Le matricule est requis.' }),
  anneeUniversitaire: z.string().min(1, { message: "L'année universitaire est requise." }),
  terme: z.enum(['AUTOMNE', 'PRINTEMPS', 'ETE']),
  montant: z.number().positive({ message: 'Le montant doit être positif.' }),
  modePaiement: z.string().min(1, { message: 'Le mode de paiement est requis.' }),
  nouveauTarifSaisi: z.number().positive().optional(),
});
