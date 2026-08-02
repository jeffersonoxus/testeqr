// lib/detector-ancoras.ts

import type { Ancora2x2 } from './ancoras-padrao';

export interface AncoraEncontrada {
  id: string;
  x: number;
  y: number;
  tamanho: number;
}

export interface PosicoesCalculadas {
  startX: number;
  startY: number;
  spacingX: number;
  spacingY: number;
  bolinhaRaio: number;
  larguraTotal: number;
  alturaTotal: number;
  tamanhoAncora: number;
}

export function detectarAncoras2x2(
  canvas: HTMLCanvasElement,
  ancoras: Ancora2x2[]
): AncoraEncontrada[] {
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const encontradas: AncoraEncontrada[] = [];
  
  // Para cada âncora, procurar na imagem
  ancoras.forEach(ancora => {
    // Procurar o padrão 2x2
    const resultado = procurarPadrao2x2(imageData, ancora.padrao);
    
    if (resultado.encontrada) {
      encontradas.push({
        id: ancora.id,
        x: resultado.x,
        y: resultado.y,
        tamanho: resultado.tamanho
      });
    }
  });
  
  return encontradas;
}

function procurarPadrao2x2(
  imageData: ImageData,
  padrao: number[][]
): { encontrada: boolean; x: number; y: number; tamanho: number } {
  
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Procurar em toda a imagem (otimizar depois)
  for (let y = 0; y < height - 20; y++) {
    for (let x = 0; x < width - 20; x++) {
      // Verificar se o padrão 2x2 existe
      const resultado = verificarPadrao(imageData, x, y, padrao);
      
      if (resultado.encontrada) {
        // Calcular o tamanho da âncora (expandir até encontrar bordas)
        const tamanho = calcularTamanhoAncora(imageData, x, y);
        
        return {
          encontrada: true,
          x: x + tamanho / 2,
          y: y + tamanho / 2,
          tamanho
        };
      }
    }
  }
  
  return { encontrada: false, x: 0, y: 0, tamanho: 0 };
}

function verificarPadrao(
  imageData: ImageData,
  startX: number,
  startY: number,
  padrao: number[][]
): { encontrada: boolean; tamanho: number } {
  
  const data = imageData.data;
  const width = imageData.width;
  
  // Verificar o padrão 2x2 em diferentes escalas
  for (let escala = 2; escala < 20; escala++) {
    let corresponde = true;
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const px = startX + (col * escala);
        const py = startY + (row * escala);
        
        if (px >= width || py >= imageData.height) {
          corresponde = false;
          break;
        }
        
        const index = (py * width + px) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brilho = (r + g + b) / 3;
        
        const esperadoPreto = padrao[row][col] === 0;
        const isPreto = brilho < 80;
        
        if (isPreto !== esperadoPreto) {
          corresponde = false;
          break;
        }
      }
      if (!corresponde) break;
    }
    
    if (corresponde) {
      return { encontrada: true, tamanho: escala };
    }
  }
  
  return { encontrada: false, tamanho: 0 };
}

function calcularTamanhoAncora(
  imageData: ImageData,
  startX: number,
  startY: number
): number {
  // Expandir enquanto encontrar pixels pretos
  let tamanho = 2;
  const data = imageData.data;
  const width = imageData.width;
  
  while (tamanho < 50) {
    let temPreto = false;
    
    // Verificar borda do quadrado
    for (let i = 0; i < tamanho; i++) {
      const pontos = [
        { x: startX + i, y: startY },
        { x: startX + i, y: startY + tamanho },
        { x: startX, y: startY + i },
        { x: startX + tamanho, y: startY + i }
      ];
      
      for (const p of pontos) {
        if (p.x >= width || p.y >= imageData.height) continue;
        const index = (p.y * width + p.x) * 4;
        const brilho = (data[index] + data[index+1] + data[index+2]) / 3;
        if (brilho < 80) temPreto = true;
      }
    }
    
    if (!temPreto) break;
    tamanho++;
  }
  
  return tamanho;
}

export function calcularPosicoes(
  canvas: HTMLCanvasElement,
  ancorasEncontradas: AncoraEncontrada[]
): PosicoesCalculadas | null {
  
  // Precisa das 4 âncoras
  if (ancorasEncontradas.length < 4) return null;
  
  // Encontrar cada âncora por posição
  const supEsq = ancorasEncontradas.find(a => a.id === 'sup-esq');
  const supDir = ancorasEncontradas.find(a => a.id === 'sup-dir');
  const infEsq = ancorasEncontradas.find(a => a.id === 'inf-esq');
  const infDir = ancorasEncontradas.find(a => a.id === 'inf-dir');
  
  if (!supEsq || !supDir || !infEsq || !infDir) return null;
  
  // Calcular dimensões do gabarito
  const larguraTotal = supDir.x - supEsq.x;
  const alturaTotal = infEsq.y - supEsq.y;
  
  // Tamanho médio das âncoras
  const tamanhoAncora = (supEsq.tamanho + supDir.tamanho + infEsq.tamanho + infDir.tamanho) / 4;
  
  // Configurações relativas
  const margemSuperior = 0.12;
  const margemEsquerda = 0.08;
  const espacamentoAlternativas = 0.7;
  const espacamentoQuestoes = 1.1;
  const tamanhoBolinha = 0.6;
  
  // Calcular posições
  const startX = supEsq.x + (larguraTotal * margemEsquerda);
  const startY = supEsq.y + (alturaTotal * margemSuperior);
  const spacingX = tamanhoAncora * espacamentoAlternativas;
  const spacingY = tamanhoAncora * espacamentoQuestoes;
  const bolinhaRaio = (tamanhoAncora * tamanhoBolinha) / 2;
  
  return {
    startX,
    startY,
    spacingX,
    spacingY,
    bolinhaRaio,
    larguraTotal,
    alturaTotal,
    tamanhoAncora
  };
}