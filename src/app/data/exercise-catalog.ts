import slim from './exercises.slim.json';

export interface SlimExercise {
  id: string;
  nome: string;
  categoria: string;
  equipamento: string;
  alvo: string;
  musculo: string;
  passos: string[];
  image: string;
  gif: string;
}

export const catalogAll = slim as SlimExercise[];
export const catalogById = new Map(catalogAll.map((e) => [e.id, e]));
