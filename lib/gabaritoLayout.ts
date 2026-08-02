export const MM_PARA_PT = 2.8346;

export const PAGINA = { larguraMm: 210, alturaMm: 297 };

// Área reduzida onde fica todo o gabarito (âncoras + QR + bolhas),
// centralizada horizontalmente, na parte inferior da folha.
export const AREA_GABARITO = {
  larguraMm: 150,
  alturaMm: 130,
  xMm: 30,   // borda esquerda (centralizado: (210-150)/2)
  yMm: 150,  // borda superior (distância do topo da página)
};
export const AREA_GABARITO_FIM_X = AREA_GABARITO.xMm + AREA_GABARITO.larguraMm; // 180
export const AREA_GABARITO_FIM_Y = AREA_GABARITO.yMm + AREA_GABARITO.alturaMm;  // 280

export const ANCORA = { tamanhoMm: 8, margemMm: 6 };

export const QRCODE = {
  tamanhoMm: 18,
  xMm: AREA_GABARITO_FIM_X - ANCORA.margemMm - ANCORA.tamanhoMm - 18 - 4, // 144
  yMm: AREA_GABARITO.yMm + ANCORA.margemMm + ANCORA.tamanhoMm + 4,        // 168
};

export const GRID = {
  numeroQuestoes: 10,
  alternativas: ["A", "B", "C", "D", "E"],
  raioBolhaMm: 2.0,
  espacamentoColunasMm: 9,
  espacamentoLinhasMm: 7,
  inicioXMm: AREA_GABARITO.xMm + ANCORA.margemMm + ANCORA.tamanhoMm + 6, // 50
  inicioYMm: QRCODE.yMm + QRCODE.tamanhoMm + 10,                        // 196
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