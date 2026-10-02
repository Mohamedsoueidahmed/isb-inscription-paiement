import { z } from 'zod';

export const schemaConnexion = z.object({
  identifiant: z.string().min(1, { message: "L'identifiant est requis." }),
  motDePasse: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

export const schemaChangementMotDePasse = z.object({
  motDePasseActuel: z.string().min(1),
  nouveauMotDePasse: z.string().min(8, { message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' }),
});
