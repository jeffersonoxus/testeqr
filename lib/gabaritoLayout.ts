export const MM_PARA_PT = 2.8346;

export const PAGINA = { larguraMm: 210, alturaMm: 297 };

export const ANCORA = { tamanhoMm: 10, margemMm: 10 };

export const QRCODE = { tamanhoMm: 25, xMm: 145, yMm: 15 };

export const GRID = {
  numeroQuestoes: 10, // versão simples: começa com poucas questões
  alternativas: ["A", "B", "C", "D", "E"],
  raioBolhaMm: 2.2,
  espacamentoColunasMm: 8,
  espacamentoLinhasMm: 9,
  inicioXMm: 25,
  inicioYMm: 60,
};

export function gerarCoordenadasBolhas() {
  const coordenadas: { questao: number; alternativa: string; xMm: number; yMm: number }[] = [];
  for (let q = 0; q < GRID.numeroQuestoes; q++) {
    const yMm = GRID.inicioYMm + q * GRID.espacamentoLinhasMm;
    GRID.alternativas.forEach((alt, i) => {
      coordenadas.push({ questao: q + 1, alternativa: alt, xMm: GRID.inicioXMm + i * GRID.espacamentoColunasMm, yMm });
    });
  }
  return coordenadas;
}