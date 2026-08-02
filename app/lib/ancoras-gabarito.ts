// lib/ancoras-gabarito.ts

import type { 
  Ancora, 
  ConfiguracaoGabarito, 
  ResultadoAncora,
  BolinhaDetectada 
} from '../types/gabarito';

// ========== CONFIGURAÇÃO ==========
export const configuracaoGabarito: ConfiguracaoGabarito = {
  nome: 'Gabarito Padrão',
  questoes: 10,
  alternativas: ['A', 'B', 'C', 'D', 'E'],
  bolinhaRaio: 15,
  startX: 150,
  startY: 200,
  spacingX: 60,
  spacingY: 40,
  
  ancoras: [
    {
      id: 'top-left',
      descricao: 'Canto superior esquerdo',
      x: 50,
      y: 50,
      cor: '#FF0000',
      tipo: 'referencia'
    },
    {
      id: 'top-right',
      descricao: 'Canto superior direito',
      x: 450,
      y: 50,
      cor: '#00FF00',
      tipo: 'referencia'
    },
    {
      id: 'bottom-left',
      descricao: 'Canto inferior esquerdo',
      x: 50,
      y: 650,
      cor: '#0000FF',
      tipo: 'referencia'
    },
    {
      id: 'q1-a',
      descricao: 'Questão 1 - A',
      x: 150,
      y: 200,
      cor: '#FF00FF',
      tipo: 'bolinha'
    }
  ]
};

// ========== DETECTAR ÂNCORAS ==========
export function detectarAncoras(
  canvas: HTMLCanvasElement,
  ancoras: Ancora[]
): ResultadoAncora {
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { encontradas: [], ajustes: { dx: 0, dy: 0 } };
  }
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const encontradas: Ancora[] = [];
  
  // Procurar cada âncora
  ancoras.forEach(ancora => {
    const resultado = procurarAncoraPorCor(imageData, ancora);
    if (resultado.encontrada) {
      encontradas.push({
        ...ancora,
        x: resultado.x,
        y: resultado.y
      });
    }
  });
  
  // Calcular ajustes baseado na primeira âncora encontrada
  let dx = 0;
  let dy = 0;
  
  const primeiraAncora = encontradas.find(a => a.id === 'top-left');
  const referencia = ancoras.find(a => a.id === 'top-left');
  
  if (primeiraAncora && referencia) {
    dx = primeiraAncora.x - referencia.x;
    dy = primeiraAncora.y - referencia.y;
  }
  
  return {
    encontradas,
    ajustes: { dx, dy }
  };
}

// ========== PROCURAR ÂNCORA POR COR ==========
function procurarAncoraPorCor(
  imageData: ImageData,
  ancora: Ancora
): { encontrada: boolean; x: number; y: number } {
  
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Extrair cores RGB da âncora
  const cor = hexToRgb(ancora.cor);
  if (!cor) return { encontrada: false, x: 0, y: 0 };
  
  const raioBusca = 50;
  const raioAncora = 8;
  
  // Procurar na região esperada
  for (let y = Math.max(0, ancora.y - raioBusca); y < Math.min(height, ancora.y + raioBusca); y++) {
    for (let x = Math.max(0, ancora.x - raioBusca); x < Math.min(width, ancora.x + raioBusca); x++) {
      const index = (y * width + x) * 4;
      
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      // Verificar se a cor corresponde (com tolerância)
      const tolerancia = 60;
      if (
        Math.abs(r - cor.r) < tolerancia &&
        Math.abs(g - cor.g) < tolerancia &&
        Math.abs(b - cor.b) < tolerancia
      ) {
        // Verificar se é um círculo
        if (verificarFormaCircular(imageData, x, y, raioAncora)) {
          return { encontrada: true, x, y };
        }
      }
    }
  }
  
  return { encontrada: false, x: 0, y: 0 };
}

// ========== VERIFICAR FORMA CIRCULAR ==========
function verificarFormaCircular(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  raio: number
): boolean {
  
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let pixelsCor = 0;
  let totalPixels = 0;
  
  for (let y = -raio; y <= raio; y++) {
    for (let x = -raio; x <= raio; x++) {
      // Verificar se está dentro do círculo
      if (x * x + y * y > raio * raio) continue;
      
      const px = centerX + x;
      const py = centerY + y;
      
      if (px < 0 || px >= width || py < 0 || py >= height) continue;
      
      const index = (py * width + px) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      totalPixels++;
      
      // Verificar se é escuro (cor da âncora)
      if (r < 100 && g < 100 && b < 100) {
        pixelsCor++;
      }
    }
  }
  
  return totalPixels > 0 && (pixelsCor / totalPixels) > 0.3;
}

// ========== UTILITÁRIO: HEX para RGB ==========
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

// ========== LER BOLINHAS COM ÂNCORAS ==========
export function lerBolinhasComAncoras(
  canvas: HTMLCanvasElement,
  ancorasEncontradas: Ancora[],
  ajustes: { dx: number; dy: number }
): Record<string, string> {
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const respostas: Record<string, string> = {};
  const { questoes, alternativas, bolinhaRaio, startX, startY, spacingX, spacingY } = configuracaoGabarito;
  
  // Ajustar posições com base nas âncoras
  const ajusteX = startX + ajustes.dx;
  const ajusteY = startY + ajustes.dy;
  
  for (let q = 0; q < questoes; q++) {
    let alternativaMarcada: string | null = null;
    let maiorEscuridao = 0;
    
    for (let a = 0; a < alternativas.length; a++) {
      const x = ajusteX + (a * spacingX);
      const y = ajusteY + (q * spacingY);
      
      // Verificar se está dentro da imagem
      if (x + bolinhaRaio > canvas.width || y + bolinhaRaio > canvas.height) {
        continue;
      }
      
      let totalPixels = 0;
      let pixelsEscuros = 0;
      
      for (let dy = -bolinhaRaio; dy <= bolinhaRaio; dy++) {
        for (let dx = -bolinhaRaio; dx <= bolinhaRaio; dx++) {
          if (dx * dx + dy * dy > bolinhaRaio * bolinhaRaio) continue;
          
          const px = Math.floor(x + dx);
          const py = Math.floor(y + dy);
          
          if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
          
          const index = (py * canvas.width + px) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          
          const brilho = (r + g + b) / 3;
          
          totalPixels++;
          if (brilho < 100) {
            pixelsEscuros++;
          }
        }
      }
      
      const percentualEscuro = totalPixels > 0 ? (pixelsEscuros / totalPixels) * 100 : 0;
      
      if (percentualEscuro > 40 && percentualEscuro > maiorEscuridao) {
        maiorEscuridao = percentualEscuro;
        alternativaMarcada = alternativas[a];
      }
    }
    
    if (alternativaMarcada) {
      respostas[(q + 1).toString()] = alternativaMarcada;
    }
  }
  
  return respostas;
}

// ========== DESENHAR OVERLAY ==========
export function desenharOverlayAncoras(
  canvas: HTMLCanvasElement,
  ancoras: Ancora[],
  overlayCanvas: HTMLCanvasElement
): void {
  
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  
  const ctx = overlayCanvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
  ancoras.forEach(ancora => {
    // Círculo externo
    ctx.strokeStyle = ancora.cor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ancora.x, ancora.y, 25, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Preenchimento semi-transparente
    ctx.fillStyle = ancora.cor + '44';
    ctx.beginPath();
    ctx.arc(ancora.x, ancora.y, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ancora.id.replace('-', ' '), ancora.x, ancora.y);
    
    // Coordenadas
    ctx.fillStyle = '#FFFFFFAA';
    ctx.font = '10px Arial';
    ctx.fillText(`(${ancora.x}, ${ancora.y})`, ancora.x, ancora.y + 35);
  });
}