// types/gabarito.ts

export interface Ancora {
  id: string;
  descricao: string;
  x: number;
  y: number;
  cor: string;
  tipo: 'referencia' | 'bolinha';
}

export interface ConfiguracaoGabarito {
  nome: string;
  questoes: number;
  alternativas: string[];
  ancoras: Ancora[];
  startX: number;
  startY: number;
  spacingX: number;
  spacingY: number;
  bolinhaRaio: number;
}

export interface ResultadoAncora {
  encontradas: Ancora[];
  ajustes: {
    dx: number;
    dy: number;
  };
}

export interface ResultadoLeitura {
  id: string;
  nome: string;
  turma: string;
  prova: string;
  respostas: Record<string, string>;
  total: number;
}

export interface BolinhaDetectada {
  questao: number;
  alternativa: string;
  x: number;
  y: number;
  percentual: number;
  marcada: boolean;
}