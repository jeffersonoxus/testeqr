// lib/ancoras-padrao.ts

export interface Ancora2x2 {
  id: string;
  posicao: 'superior-esquerdo' | 'superior-direito' | 'inferior-esquerdo' | 'inferior-direito';
  padrao: number[][]; // 2x2 matriz: 0=preto, 1=branco
}

export interface ConfiguracaoComAncoras {
  questoes: number;
  alternativas: string[];
  ancoras: Ancora2x2[];
  // Configuração relativa (em % do tamanho do gabarito)
  margemSuperior: number;    // % da altura total
  margemEsquerda: number;    // % da largura total
  espacamentoAlternativas: number; // % do tamanho da âncora
  espacamentoQuestoes: number;     // % do tamanho da âncora
  tamanhoBolinha: number;          // % do tamanho da âncora
}

export const configAncoras: ConfiguracaoComAncoras = {
  questoes: 9,
  alternativas: ['a', 'b', 'c', 'd', 'e'],
  
  ancoras: [
    {
      id: 'sup-esq',
      posicao: 'superior-esquerdo',
      padrao: [
        [0, 1],
        [1, 0]
      ]
    },
    {
      id: 'sup-dir',
      posicao: 'superior-direito',
      padrao: [
        [1, 0],
        [0, 1]
      ]
    },
    {
      id: 'inf-esq',
      posicao: 'inferior-esquerdo',
      padrao: [
        [1, 0],
        [0, 1]
      ]
    },
    {
      id: 'inf-dir',
      posicao: 'inferior-direito',
      padrao: [
        [0, 1],
        [1, 0]
      ]
    }
  ],
  
  // Configurações relativas
  margemSuperior: 0.12,    // 12% da altura
  margemEsquerda: 0.08,    // 8% da largura
  espacamentoAlternativas: 0.7,  // 70% do tamanho da âncora
  espacamentoQuestoes: 1.1,      // 110% do tamanho da âncora
  tamanhoBolinha: 0.6            // 60% do tamanho da âncora
};