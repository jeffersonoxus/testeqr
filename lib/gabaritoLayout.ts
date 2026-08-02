export const MM_PARA_PT = 2.8346;

export const PAGINA = { larguraMm: 210, alturaMm: 297 };

// Início da área útil do gabarito — a partir da metade da página.
// Tudo abaixo dessa linha (em mm, contando do topo) é onde âncoras,
// QR Code e bolhas ficam. Acima disso fica livre para instruções.
export const AREA_GABARITO = {
  inicioYMm: PAGINA.alturaMm / 2, // 148.5mm — começa exatamente na metade
  fimYMm: PAGINA.alturaMm,         // vai até o final da folha
};

export const ANCORA = {
  tamanhoMm: 8, // um pouco menor, já que a área disponível é menor
  margemMm: 8,
};

export const QRCODE = {
  tamanhoMm: 20,
  xMm: PAGINA.larguraMm - ANCORA.margemMm - ANCORA.tamanhoMm - 25,
  yMm: AREA_GABARITO.inicioYMm + 8, // logo abaixo da linha de corte, com respiro
};

export const GRID = {
  numeroQuestoes: 10,
  alternativas: ["A", "B", "C", "D", "E"],
  raioBolhaMm: 2.0,
  espacamentoColunasMm: 7,
  espacamentoLinhasMm: 7.5, // mais compacto, pra caber na metade da folha
  inicioXMm: 22,
  inicioYMm: AREA_GABARITO.inicioYMm + 35, // abaixo do QR Code
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