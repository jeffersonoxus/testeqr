'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [aba, setAba] = useState<'gerar' | 'ler'>('ler');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const [bolinhasDetectadas, setBolinhasDetectadas] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);

  // ========== INICIAR CÂMERA ==========
  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraAtiva(true);
        addDebug('✅ Câmera iniciada');
      }
    } catch (error) {
      alert('Erro ao acessar câmera: ' + error);
      addDebug('❌ Erro na câmera');
    }
  };

  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // ========== CAPTURAR E LER ==========
  const capturarELer = () => {
    if (!videoRef.current || !canvasRef.current) {
      addDebug('❌ Video ou Canvas não disponível');
      return;
    }
    
    setLoading(true);
    setResultado(null);
    setBolinhasDetectadas([]);
    addDebug('📸 Capturando imagem...');
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImagemPreview(imageDataUrl);
    addDebug(`📷 Imagem capturada: ${canvas.width}x${canvas.height}`);
    
    // Processar
    setTimeout(() => {
      const resultado = processarGabarito(canvas);
      
      if (resultado && Object.keys(resultado.respostas).length > 0) {
        setResultado({
          id: '2025001',
          nome: 'João Silva',
          turma: '3A',
          prova: 'MATEMÁTICA',
          respostas: resultado.respostas,
          total: Object.keys(resultado.respostas).length
        });
        addDebug(`✅ ${resultado.total} questões detectadas`);
      } else {
        addDebug('❌ Nenhuma bolinha detectada!');
        addDebug('💡 Ajuste as coordenadas no código');
      }
      
      setLoading(false);
      
      // Parar câmera
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        setCameraAtiva(false);
      }
    }, 500);
  };

  // ========== PROCESSAR COM OVERLAY ==========
  const processarGabarito = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const respostas: Record<string, string> = {};
    const questoes = 10;
    const alternativas = ['A', 'B', 'C', 'D', 'E'];
    
    // CONFIGURAÇÃO - AJUSTE CONFORME SEU GABARITO
    const startX = 100;
    const startY = 200;
    const spacingX = 60;
    const spacingY = 40;
    const bolinhaRaio = 15;
    
    addDebug(`🔍 Analisando posição inicial: X=${startX}, Y=${startY}`);
    addDebug(`📏 Espaçamento: X=${spacingX}, Y=${spacingY}`);
    
    const bolinhasEncontradas: any[] = [];
    
    for (let q = 0; q < questoes; q++) {
      let alternativaMarcada: string | null = null;
      let maiorEscuridao = 0;
      let maioresDados: any = null;
      
      for (let a = 0; a < alternativas.length; a++) {
        const x = startX + (a * spacingX);
        const y = startY + (q * spacingY);
        
        if (x + bolinhaRaio > canvas.width || y + bolinhaRaio > canvas.height) {
          addDebug(`⚠️ Posição Q${q+1}${alternativas[a]} (${x},${y}) fora da imagem`);
          continue;
        }
        
        let totalPixels = 0;
        let pixelsEscuros = 0;
        
        for (let dy = -bolinhaRaio; dy <= bolinhaRaio; dy++) {
          for (let dx = -bolinhaRaio; dx <= bolinhaRaio; dx++) {
            if (dx*dx + dy*dy > bolinhaRaio*bolinhaRaio) continue;
            
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
        
        // Guardar para debug
        bolinhasEncontradas.push({
          questao: q + 1,
          alternativa: alternativas[a],
          x,
          y,
          percentual: percentualEscuro,
          marcada: percentualEscuro > 40
        });
        
        addDebug(`Q${q+1}${alternativas[a]}: ${percentualEscuro.toFixed(1)}% escuro`);
        
        if (percentualEscuro > 40 && percentualEscuro > maiorEscuridao) {
          maiorEscuridao = percentualEscuro;
          alternativaMarcada = alternativas[a];
          maioresDados = { x, y, percentual: percentualEscuro };
        }
      }
      
      if (alternativaMarcada) {
        respostas[(q + 1).toString()] = alternativaMarcada;
        addDebug(`✅ Q${q+1}: ${alternativaMarcada} (${maiorEscuridao.toFixed(1)}% escuro)`);
      } else {
        addDebug(`❌ Q${q+1}: Nenhuma alternativa detectada`);
      }
    }
    
    setBolinhasDetectadas(bolinhasEncontradas);
    addDebug(`📊 Total: ${Object.keys(respostas).length} questões detectadas`);
    
    // Desenhar overlay no canvas
    desenharOverlay(canvas, bolinhasEncontradas);
    
    return { respostas };
  };

  // ========== DESENHAR OVERLAY (ÂNCORAS VISUAIS) ==========
  const desenharOverlay = (canvas: HTMLCanvasElement, bolinhas: any[]) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const ctx = overlayCanvas.getContext('2d')!;
    
    // Limpar
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Desenhar cada bolinha analisada
    bolinhas.forEach(b => {
      const x = b.x;
      const y = b.y;
      const raio = 15;
      
      // Cor conforme percentual de escuro
      if (b.marcada) {
        // Verde = detectada como marcada
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      } else if (b.percentual > 20) {
        // Amarelo = parcialmente escura
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      } else {
        // Vermelho = clara (não marcada)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
      }
      
      // Desenhar círculo
      ctx.beginPath();
      ctx.arc(x, y, raio, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Escrever percentual
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${b.percentual.toFixed(0)}%`, x, y);
    });
  };

  const pararCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraAtiva(false);
    }
    setResultado(null);
    setImagemPreview(null);
    setBolinhasDetectadas([]);
    setDebug([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">📋 Leitor de Gabarito</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Status */}
        <div className="bg-gray-100 p-2 rounded text-sm mb-4">
          <span className="font-bold">Status: </span>
          {cameraAtiva ? '🟢 Câmera ativa' : '⚪ Câmera parada'}
          {loading && ' ⏳ Processando...'}
        </div>

        {/* Câmera com Overlay */}
        <div className="bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            className="w-full h-[400px] object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Canvas do Overlay (mostra âncoras) */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 w-full h-[400px] object-cover pointer-events-none"
          />
          
          {!cameraAtiva && !imagemPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <div className="text-center">
                <p className="text-4xl mb-2">📷</p>
                <p>Clique em "Iniciar Câmera"</p>
              </div>
            </div>
          )}

          {imagemPreview && !resultado && (
            <img 
              src={imagemPreview} 
              alt="Preview" 
              className="w-full h-[400px] object-cover"
            />
          )}
        </div>

        {/* Botões */}
        <div className="space-y-2 mt-4">
          {!cameraAtiva && !imagemPreview ? (
            <button
              onClick={iniciarCamera}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition"
            >
              📷 Iniciar Câmera
            </button>
          ) : (
            <>
              {!resultado && (
                <button
                  onClick={capturarELer}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? '⏳ Analisando...' : '📸 Capturar e Ler'}
                </button>
              )}
              
              <button
                onClick={() => { 
                  pararCamera(); 
                  setImagemPreview(null);
                  setTimeout(iniciarCamera, 500);
                }}
                className="w-full bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition"
              >
                🔄 Reiniciar
              </button>
            </>
          )}
        </div>

        {/* DEBUG - MOSTRA O QUE ESTÁ ACONTECENDO */}
        <div className="mt-4 bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-[200px] overflow-y-auto">
          <p className="text-white font-bold mb-1">🐛 DEBUG:</p>
          {debug.length === 0 ? (
            <p className="text-gray-500">Aguardando ação...</p>
          ) : (
            debug.map((msg, i) => (
              <div key={i} className="border-b border-gray-800 py-0.5">
                {msg}
              </div>
            ))
          )}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="mt-4 bg-white rounded-lg shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-green-600">✅ Gabarito Lido!</h3>
              <button
                onClick={() => { setResultado(null); setImagemPreview(null); }}
                className="text-sm text-blue-600"
              >
                Nova Leitura
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
              <div><strong>ID:</strong> {resultado.id}</div>
              <div><strong>Nome:</strong> {resultado.nome}</div>
              <div><strong>Turma:</strong> {resultado.turma}</div>
              <div><strong>Prova:</strong> {resultado.prova}</div>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">
                Respostas ({resultado.total} de 10 detectadas)
              </p>
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
          </div>
        )}

        {/* Ajuda para ajustar coordenadas */}
        {debug.some(d => d.includes('Nenhuma bolinha')) && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800">
            <p className="font-bold">💡 Nenhuma bolinha detectada!</p>
            <p className="mt-1">Ajuste as coordenadas no código:</p>
            <pre className="mt-1 bg-yellow-100 p-2 rounded overflow-x-auto">
              startX = 100  ← Posição X da 1ª bolinha (A da Q1)<br/>
              startY = 200  ← Posição Y da 1ª bolinha (A da Q1)<br/>
              spacingX = 60 ← Distância entre alternativas<br/>
              spacingY = 40 ← Distância entre questões
            </pre>
            <p className="mt-2 text-red-600 font-bold">
              ⚠️ IMPORTANTE: O overlay mostra onde o app está procurando!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}