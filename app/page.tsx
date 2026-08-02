'use client';

import { useState, useRef, useEffect } from 'react';

// ========== TIPOS ==========
interface Ancora {
  id: number;
  x: number;
  y: number;
  tamanho: number;
  padrao: number[][]; // 4x4 ou 6x6 checkerboard
}

interface Bolinha {
  x: number;
  y: number;
  questao: number;
  alternativa: string;
  preenchida: boolean;
  percentualPreto: number;
}

interface Gabarito {
  questoes: number;
  alternativas: string[];
  ancoras: Ancora[];
}

// ========== CONFIGURAÇÃO DO GABARITO ==========
// 12 Âncoras com padrão CHECKERBOARD 4x4
// Cada âncora é um quadrado com padrão xadrez (mais fácil de detectar)

const criarPadraoCheckerboard = (tamanho: number): number[][] => {
  const padrao: number[][] = [];
  for (let i = 0; i < tamanho; i++) {
    padrao[i] = [];
    for (let j = 0; j < tamanho; j++) {
      padrao[i][j] = (i + j) % 2 === 0 ? 0 : 1; // 0=preto, 1=branco
    }
  }
  return padrao;
};

const CONFIG_GABARITO: Gabarito = {
  questoes: 9,
  alternativas: ['a', 'b', 'c', 'd', 'e'],
  ancoras: [
    // TOPO (4 âncoras)
    { id: 1, x: 20, y: 15, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 2, x: 150, y: 15, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 3, x: 300, y: 15, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 4, x: 450, y: 15, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    
    // LATERAL ESQUERDA (2 âncoras)
    { id: 5, x: 15, y: 130, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 6, x: 15, y: 260, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    
    // LATERAL DIREITA (2 âncoras)
    { id: 7, x: 470, y: 130, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 8, x: 470, y: 260, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    
    // RODAPÉ (4 âncoras)
    { id: 9, x: 20, y: 350, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 10, x: 150, y: 350, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 11, x: 300, y: 350, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
    { id: 12, x: 450, y: 350, tamanho: 20, padrao: criarPadraoCheckerboard(4) },
  ]
};

export default function Home() {
  const [modo, setModo] = useState<'gerar' | 'ler'>('gerar');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [status, setStatus] = useState('Aguardando...');
  const [fps, setFps] = useState(5);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [contagemFrames, setContagemFrames] = useState(0);

  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // ========== GERAR GABARITO ==========
  const gerarGabarito = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d')!;

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('1ºTA - 1º ETAPA - 2019 - 1º ANO', canvas.width / 2, 40);

    // ===== DESENHAR ÂNCORAS (12 com padrão CHECKERBOARD) =====
    CONFIG_GABARITO.ancoras.forEach(ancora => {
      const size = ancora.tamanho;
      const padrao = ancora.padrao;
      const cellSize = size / padrao.length;
      
      // Desenhar cada célula do checkerboard
      for (let row = 0; row < padrao.length; row++) {
        for (let col = 0; col < padrao[row].length; col++) {
          const x = ancora.x + (col * cellSize);
          const y = ancora.y + (row * cellSize);
          
          ctx.fillStyle = padrao[row][col] === 0 ? '#000000' : '#FFFFFF';
          ctx.fillRect(x, y, cellSize, cellSize);
          
          // Borda para contraste
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }
      
      // Borda externa da âncora (vermelha para visualização, mas o app não usa cor)
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(ancora.x, ancora.y, size, size);
      ctx.setLineDash([]);
      
      // Número da âncora
      ctx.fillStyle = '#FF0000';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`A${ancora.id}`, ancora.x + size/2, ancora.y - 4);
    });

    // ===== DESENHAR BOLINHAS =====
    const { questoes, alternativas } = CONFIG_GABARITO;
    const startX = 100;
    const startY = 75;
    const spacingX = 55;
    const spacingY = 30;
    const raio = 10;

    for (let q = 0; q < questoes; q++) {
      // Número da questão
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Q.${q+1}`, startX - 12, startY + (q * spacingY));

      for (let a = 0; a < alternativas.length; a++) {
        const x = startX + (a * spacingX);
        const y = startY + (q * spacingY);
        
        // Círculo
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Letra da alternativa (dentro da bolinha)
        ctx.fillStyle = '#000';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(alternativas[a].toUpperCase(), x, y);
      }
    }

    // Instruções
    ctx.fillStyle = '#666';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Preencha as bolinhas com caneta preta', canvas.width / 2, 395);
    ctx.fillText('Âncoras = padrão xadrez 4x4', canvas.width / 2, 410);

    // Abrir para impressão
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Gabarito com Âncoras</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
              img { max-width: 100%; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              @media print { body { background: white; } img { box-shadow: none; } }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              setTimeout(() => { window.print(); }, 1000);
            <\/script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  // ========== INICIAR CÂMERA ==========
  const iniciarCamera = async () => {
    try {
      addDebug('📷 Solicitando acesso à câmera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraAtiva(true);
        addDebug('✅ Câmera iniciada');
        iniciarLeituraGabarito();
      }
    } catch (error) {
      console.error('Erro na câmera:', error);
      addDebug(`❌ Erro: ${error}`);
      alert('Erro ao acessar câmera.');
    }
  };

  // ========== LER GABARITO COM 12 ÂNCORAS (5 FPS) ==========
  const iniciarLeituraGabarito = () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    // Limpar intervalo anterior
    if (frameIdRef.current !== null) {
      clearInterval(frameIdRef.current);
      frameIdRef.current = null;
    }

    const detectar = () => {
      if (!video || video.readyState < 2) return;

      setContagemFrames(prev => prev + 1);

      // Configurar canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      overlayCanvas.width = video.videoWidth;
      overlayCanvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      
      if (!ctx || !overlayCtx) return;

      // Desenhar frame
      ctx.drawImage(video, 0, 0);

      // Pegar dados da imagem
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // ===== 1. CONVERTER PARA CINZA =====
      const grayData = converterParaCinza(imageData);
      
      // ===== 2. BINARIZAR =====
      const binaryData = binarizar(grayData, 80);
      
      // ===== 3. ENCONTRAR CONTORNOS =====
      const contornos = encontrarContornos(binaryData, canvas.width, canvas.height);
      
      // ===== 4. ENCONTRAR ÂNCORAS (CHECKERBOARD) =====
      const ancorasEncontradas = encontrarAncorasCheckerboard(
        contornos,
        binaryData,
        canvas.width,
        canvas.height,
        CONFIG_GABARITO.ancoras.length
      );
      
      // ===== 5. CALCULAR POSIÇÕES =====
      let bolinhas: Bolinha[] = [];
      let posicoes: any = null;
      
      if (ancorasEncontradas.length >= 4) {
        posicoes = calcularPosicoes(ancorasEncontradas, canvas.width, canvas.height);
        if (posicoes) {
          bolinhas = lerBolinhas(imageData, posicoes);
          
          // Gerar resultado
          const respostas: Record<string, string> = {};
          let totalPreenchidas = 0;
          
          bolinhas.forEach(b => {
            if (b.preenchida) {
              respostas[`Q.${b.questao}`] = b.alternativa.toUpperCase();
              totalPreenchidas++;
            }
          });
          
          if (totalPreenchidas > 0) {
            setResultado({
              id: '31059',
              turma: '1ºTA',
              prova: '1º ETAPA 2019',
              respostas,
              total: totalPreenchidas,
              questoes: CONFIG_GABARITO.questoes
            });
            setStatus(`✅ ${totalPreenchidas} respostas detectadas`);
          } else {
            setStatus('🔍 Nenhuma bolinha preenchida');
          }
        }
      } else {
        setStatus(`🔍 Âncoras: ${ancorasEncontradas.length}/12`);
      }

      // ===== 6. DESENHAR OVERLAY =====
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      // Desenhar âncoras encontradas (verde)
      ancorasEncontradas.forEach((ancora) => {
        const size = ancora.tamanho;
        overlayCtx.strokeStyle = '#00FF00';
        overlayCtx.lineWidth = 3;
        overlayCtx.shadowColor = '#00FF00';
        overlayCtx.shadowBlur = 10;
        overlayCtx.strokeRect(
          ancora.x - size/2,
          ancora.y - size/2,
          size,
          size
        );
        overlayCtx.shadowBlur = 0;
        
        overlayCtx.fillStyle = '#FFFFFF';
        overlayCtx.font = '10px Arial';
        overlayCtx.textAlign = 'center';
        overlayCtx.fillText(`A${ancora.id}`, ancora.x, ancora.y - size/2 - 8);
      });
      
      // Desenhar bolinhas detectadas
      bolinhas.forEach(b => {
        const cor = b.preenchida ? '#00FF00' : '#FF6600';
        overlayCtx.strokeStyle = cor;
        overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        overlayCtx.arc(b.x, b.y, posicoes?.raio || 10, 0, 2 * Math.PI);
        overlayCtx.stroke();
        
        if (b.preenchida) {
          overlayCtx.fillStyle = 'rgba(0, 255, 0, 0.2)';
          overlayCtx.beginPath();
          overlayCtx.arc(b.x, b.y, posicoes?.raio || 10, 0, 2 * Math.PI);
          overlayCtx.fill();
        }
        
        // Label: questão + alternativa
        overlayCtx.fillStyle = '#FFFFFF';
        overlayCtx.font = '8px Arial';
        overlayCtx.textAlign = 'center';
        overlayCtx.textBaseline = 'middle';
        overlayCtx.fillText(
          `${b.questao}${b.alternativa}`,
          b.x,
          b.y
        );
      });

      // Contador de FPS no canto
      overlayCtx.fillStyle = 'rgba(255,255,255,0.5)';
      overlayCtx.font = '10px Arial';
      overlayCtx.textAlign = 'left';
      overlayCtx.textBaseline = 'top';
      overlayCtx.fillText(`FPS: ${fps} | Frame: ${contagemFrames}`, 10, 10);
    };

    // Executar a cada 200ms (5 FPS)
    frameIdRef.current = setInterval(detectar, 200);
    addDebug(`📖 Lendo gabarito a ${fps} FPS...`);
  };

  // ========== FUNÇÕES DE PROCESSAMENTO ==========
  
  const converterParaCinza = (imageData: ImageData): Uint8ClampedArray => {
    const data = imageData.data;
    const gray = new Uint8ClampedArray(data.length / 4);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = (data[i] + data[i+1] + data[i+2]) / 3;
    }
    return gray;
  };

  const binarizar = (grayData: Uint8ClampedArray, limiar: number): Uint8ClampedArray => {
    const binary = new Uint8ClampedArray(grayData.length);
    for (let i = 0; i < grayData.length; i++) {
      binary[i] = grayData[i] < limiar ? 0 : 255;
    }
    return binary;
  };

  const encontrarContornos = (
    binaryData: Uint8ClampedArray,
    width: number,
    height: number
  ): Array<{x: number, y: number}[]> => {
    const visitado = new Uint8Array(binaryData.length);
    const contornos: Array<{x: number, y: number}[]> = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (binaryData[idx] === 0 && visitado[idx] === 0) {
          const contorno: {x: number, y: number}[] = [];
          const pilha: {x: number, y: number}[] = [{x, y}];
          
          while (pilha.length > 0) {
            const p = pilha.pop()!;
            const pIdx = p.y * width + p.x;
            if (visitado[pIdx] === 1 || binaryData[pIdx] !== 0) continue;
            
            visitado[pIdx] = 1;
            contorno.push(p);
            
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = p.x + dx;
                const ny = p.y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const nIdx = ny * width + nx;
                if (visitado[nIdx] === 0 && binaryData[nIdx] === 0) {
                  pilha.push({x: nx, y: ny});
                }
              }
            }
          }
          
          if (contorno.length > 20) {
            contornos.push(contorno);
          }
        }
      }
    }
    
    return contornos;
  };

  // ========== ENCONTRAR ÂNCORAS COM PADRÃO CHECKERBOARD ==========
  const encontrarAncorasCheckerboard = (
    contornos: Array<{x: number, y: number}[]>,
    binaryData: Uint8ClampedArray,
    width: number,
    height: number,
    totalEsperado: number
  ): Ancora[] => {
    const ancoras: Ancora[] = [];
    const candidatos: {x: number, y: number, tamanho: number, score: number}[] = [];
    
    contornos.forEach(contorno => {
      // Calcular bounding box
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      for (const p of contorno) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      
      const largura = maxX - minX;
      const altura = maxY - minY;
      const area = largura * altura;
      const proporcao = Math.max(largura, altura) / Math.min(largura, altura);
      
      // Filtros básicos
      if (area < 30 || area > 600) return;
      if (proporcao > 1.3) return;
      
      // Centro
      const centroX = minX + largura / 2;
      const centroY = minY + altura / 2;
      const tamanho = Math.max(largura, altura);
      
      // Verificar padrão checkerboard (4x4)
      const score = verificarCheckerboard(binaryData, width, height, centroX, centroY, tamanho);
      
      if (score > 0.6) { // 60% de correspondência
        candidatos.push({
          x: centroX,
          y: centroY,
          tamanho: tamanho,
          score: score
        });
      }
    });
    
    // Ordenar por score e pegar os melhores
    candidatos.sort((a, b) => b.score - a.score);
    
    // Selecionar os 12 melhores (ou menos se não tiver)
    const quantidade = Math.min(candidatos.length, totalEsperado);
    for (let i = 0; i < quantidade; i++) {
      ancoras.push({
        id: i + 1,
        x: candidatos[i].x,
        y: candidatos[i].y,
        tamanho: candidatos[i].tamanho,
        padrao: [] // Não usado na detecção
      });
    }
    
    return ancoras;
  };

  // ========== VERIFICAR PADRÃO CHECKERBOARD ==========
  const verificarCheckerboard = (
    binaryData: Uint8ClampedArray,
    width: number,
    height: number,
    cx: number,
    cy: number,
    tamanho: number
  ): number => {
    // Verificar um padrão 4x4 dentro da âncora
    const cells = 4;
    const cellSize = tamanho / cells;
    let matches = 0;
    let total = 0;
    
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        const px = cx - tamanho/2 + (col * cellSize) + cellSize/2;
        const py = cy - tamanho/2 + (row * cellSize) + cellSize/2;
        
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        
        const idx = Math.round(py) * width + Math.round(px);
        const valor = binaryData[idx];
        
        // Padrão checkerboard: (row + col) % 2 === 0 → preto (0)
        const esperado = (row + col) % 2 === 0 ? 0 : 255;
        
        total++;
        if (valor === esperado) {
          matches++;
        }
      }
    }
    
    return total > 0 ? matches / total : 0;
  };

  // ========== CALCULAR POSIÇÕES ==========
  const calcularPosicoes = (
    ancoras: Ancora[],
    width: number,
    height: number
  ): any => {
    if (ancoras.length < 4) return null;
    
    // Ordenar âncoras por posição
    const sorted = [...ancoras].sort((a, b) => a.x - b.x || a.y - b.y);
    
    // Encontrar extremos
    const topAncoras = sorted.filter(a => a.y < height * 0.3);
    const bottomAncoras = sorted.filter(a => a.y > height * 0.7);
    const leftAncoras = sorted.filter(a => a.x < width * 0.3);
    const rightAncoras = sorted.filter(a => a.x > width * 0.7);
    
    if (topAncoras.length < 2 || bottomAncoras.length < 2) {
      // Fallback: usar as primeiras 4 âncoras
      const ref = sorted.slice(0, 4);
      const mediaX = ref.reduce((sum, a) => sum + a.x, 0) / ref.length;
      const mediaY = ref.reduce((sum, a) => sum + a.y, 0) / ref.length;
      const escala = ref.reduce((sum, a) => sum + a.tamanho, 0) / ref.length / 20;
      
      return {
        startX: mediaX + (50 * escala),
        startY: mediaY + (60 * escala),
        spacingX: 55 * escala,
        spacingY: 30 * escala,
        raio: 10 * escala,
        escala
      };
    }
    
    // Calcular com todas as âncoras
    const topY = topAncoras.reduce((sum, a) => sum + a.y, 0) / topAncoras.length;
    const bottomY = bottomAncoras.reduce((sum, a) => sum + a.y, 0) / bottomAncoras.length;
    const leftX = leftAncoras.reduce((sum, a) => sum + a.x, 0) / leftAncoras.length;
    const rightX = rightAncoras.reduce((sum, a) => sum + a.x, 0) / rightAncoras.length;
    
    const gabaritoLargura = rightX - leftX;
    const gabaritoAltura = bottomY - topY;
    const escala = ancoras.reduce((sum, a) => sum + a.tamanho, 0) / ancoras.length / 20;
    
    return {
      startX: leftX + (gabaritoLargura * 0.18),
      startY: topY + (gabaritoAltura * 0.22),
      spacingX: (gabaritoLargura * 0.1),
      spacingY: (gabaritoAltura * 0.085),
      raio: Math.min(gabaritoLargura, gabaritoAltura) * 0.018,
      escala,
      totalLargura: gabaritoLargura,
      totalAltura: gabaritoAltura
    };
  };

  // ========== LER BOLINHAS ==========
  const lerBolinhas = (
    imageData: ImageData,
    posicoes: any
  ): Bolinha[] => {
    const data = imageData.data;
    const { questoes, alternativas } = CONFIG_GABARITO;
    const { startX, startY, spacingX, spacingY, raio } = posicoes;
    
    const bolinhas: Bolinha[] = [];
    
    for (let q = 0; q < questoes; q++) {
      for (let a = 0; a < alternativas.length; a++) {
        const x = startX + (a * spacingX);
        const y = startY + (q * spacingY);
        
        // Verificar se está dentro da imagem
        if (x + raio > imageData.width || y + raio > imageData.height) continue;
        
        // Analisar pixels da bolinha
        let totalPixels = 0;
        let pixelsPretos = 0;
        const raioEfetivo = Math.max(raio, 5);
        
        for (let dy = -raioEfetivo; dy <= raioEfetivo; dy++) {
          for (let dx = -raioEfetivo; dx <= raioEfetivo; dx++) {
            if (dx*dx + dy*dy > raioEfetivo*raioEfetivo) continue;
            
            const px = Math.floor(x + dx);
            const py = Math.floor(y + dy);
            
            if (px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) continue;
            
            const idx = (py * imageData.width + px) * 4;
            const brilho = (data[idx] + data[idx+1] + data[idx+2]) / 3;
            
            totalPixels++;
            if (brilho < 100) pixelsPretos++;
          }
        }
        
        const percentualPreto = totalPixels > 0 ? (pixelsPretos / totalPixels) * 100 : 0;
        const preenchida = percentualPreto > 30;
        
        bolinhas.push({
          x,
          y,
          questao: q + 1,
          alternativa: alternativas[a],
          preenchida,
          percentualPreto
        });
      }
    }
    
    return bolinhas;
  };

  // ========== PARAR CÂMERA ==========
  const pararCamera = () => {
    if (frameIdRef.current !== null) {
      clearInterval(frameIdRef.current);
      frameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraAtiva(false);
    setResultado(null);
    setStatus('Aguardando...');
    setContagemFrames(0);
    addDebug('⏹️ Câmera parada');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        clearInterval(frameIdRef.current);
        frameIdRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow">
        <h1 className="text-xl font-bold text-center">📋 Leitor com 12 Âncoras Checkerboard</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Abas */}
        <div className="flex border-b bg-white rounded-t-lg mb-4 overflow-hidden">
          <button
            className={`flex-1 py-3 font-medium ${
              modo === 'gerar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => { setModo('gerar'); pararCamera(); }}
          >
            📐 Gerar
          </button>
          <button
            className={`flex-1 py-3 font-medium ${
              modo === 'ler' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setModo('ler')}
          >
            📸 Ler
          </button>
        </div>

        {modo === 'gerar' ? (
          // ===== ABA GERAR =====
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">📐 Gerar Gabarito</h3>
            
            <div className="bg-green-50 border border-green-200 p-3 rounded text-sm mb-4">
              <p className="font-bold text-green-800">✅ Âncoras Checkerboard (12):</p>
              <div className="grid grid-cols-4 gap-1 mt-2">
                <div className="bg-green-100 p-1 text-center text-xs rounded">
                  <span className="font-bold">4x4</span>
                  <br/>
                  <span className="text-green-700">Alto contraste</span>
                </div>
                <div className="bg-green-100 p-1 text-center text-xs rounded">
                  <span className="font-bold">12</span>
                  <br/>
                  <span className="text-green-700">âncoras</span>
                </div>
                <div className="bg-green-100 p-1 text-center text-xs rounded">
                  <span className="font-bold">5 FPS</span>
                  <br/>
                  <span className="text-green-700">suave</span>
                </div>
                <div className="bg-green-100 p-1 text-center text-xs rounded">
                  <span className="font-bold">Preto</span>
                  <br/>
                  <span className="text-green-700">Branco</span>
                </div>
              </div>
            </div>

            <button
              onClick={gerarGabarito}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition"
            >
              🖨️ Gerar e Imprimir Gabarito
            </button>

            <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
              <p className="font-bold">📐 Âncoras:</p>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {CONFIG_GABARITO.ancoras.map(a => (
                  <div key={a.id} className="bg-gray-200 p-1 text-center text-xs rounded">
                    A{a.id}
                    <br/>
                    <span className="text-gray-500">({a.x},{a.y})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ===== ABA LER =====
          <>
            {/* Status */}
            <div className="bg-gray-100 p-2 rounded text-sm mb-4 flex justify-between items-center">
              <span>
                <span className="font-bold">Status:</span>{' '}
                {cameraAtiva ? '🟢 Ativa' : '⚪ Parada'}
                {resultado && ' ✅ Leitura concluída'}
                {cameraAtiva && ` 📊 ${contagemFrames} frames`}
              </span>
              {cameraAtiva && (
                <button
                  onClick={pararCamera}
                  className="text-red-600 hover:underline text-xs font-bold"
                >
                  ⏹ Parar
                </button>
              )}
            </div>

            {/* Câmera */}
            <div className="bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                autoPlay
                playsInline
                muted
              />
              
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 w-full h-[400px] object-cover pointer-events-none"
              />
              
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Status na tela */}
              {cameraAtiva && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                  {status}
                </div>
              )}
              
              {!cameraAtiva && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                  <div className="text-center">
                    <p className="text-5xl mb-3">📷</p>
                    <p className="text-lg font-medium">Clique em "Iniciar Câmera"</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Aponte para o gabarito com as 12 âncoras checkerboard
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="space-y-2 mt-4">
              {!cameraAtiva ? (
                <button
                  onClick={iniciarCamera}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition"
                >
                  📷 Iniciar Câmera
                </button>
              ) : (
                <button
                  onClick={() => {
                    pararCamera();
                    setResultado(null);
                    setTimeout(iniciarCamera, 300);
                  }}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition"
                >
                  🔄 Reiniciar
                </button>
              )}
            </div>

            {/* Resultado */}
            {resultado && (
              <div className="mt-4 bg-white rounded-lg shadow p-4 space-y-3">
                <h3 className="font-bold text-green-600">✅ Leitura concluída!</h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
                  <div><strong>Prova:</strong> {resultado.prova}</div>
                  <div><strong>Turma:</strong> {resultado.turma}</div>
                  <div className="col-span-2">
                    <strong>Respostas:</strong> {resultado.total} de {resultado.questoes} questões
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-2">Respostas detectadas:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(resultado.respostas).map(([q, r]) => (
                      <div key={q} className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">{q}</div>
                        <div className="font-bold text-blue-700">{String(r)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">📋 Ver JSON</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(resultado, null, 2));
                    alert('✅ JSON copiado!');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200 transition"
                >
                  📋 Copiar JSON
                </button>
              </div>
            )}

            {/* Debug */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-gray-500">🐛 DEBUG ({debug.length})</p>
                <button
                  onClick={() => setDebug([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              </div>
              <div className="bg-gray-900 text-green-400 p-2 rounded-lg text-xs font-mono h-[100px] overflow-y-auto">
                {debug.length === 0 ? (
                  <p className="text-gray-500">Aguardando ações...</p>
                ) : (
                  debug.slice(-15).map((msg, i) => (
                    <div key={i} className="border-b border-gray-800 py-0.5 text-xs">
                      {msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}