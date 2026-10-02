export type Terme = 'AUTOMNE' | 'PRINTEMPS' | 'ETE';
export type Cycle = 'LICENCE' | 'MASTER';

export interface TarifTerme {
  id: string;
  cycle: Cycle;
  terme: Terme;
  nombreMatieres: number;
  montant: string;
  creeLe: string;
}

export interface DonneesTarif {
  cycle: Cycle;
  terme: Terme;
  nombreMatieres: number;
  montant: number;
}
