import { z } from 'zod';

export const schemaTarif = z.object({
  cycle: z.enum(['LICENCE', 'MASTER']),
  terme: z.enum(['AUTOMNE', 'PRINTEMPS', 'ETE']),
  nombreMatieres: z.number().int().positive({ message: 'Le nombre de matières doit être positif.' }),
  montant: z.number().positive({ message: 'Le montant doit être positif.' }),
});
