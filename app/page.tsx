// app/page.tsx

'use client';

import { useState, useRef } from 'react';
import { GabaritoComAncoras2x2 } from './components/GabaritoComAncoras2x2';
import { detectarAncoras2x2, calcularPosicoes } from './lib/detector-ancoras';
import { configAncoras } from './lib/ancoras-padrao';

export default function Home() {
  const [modo, setModo] = useState<'gerar' | 'ler'>('gerar');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraAtiva(true);
        addDebug('✅ Câmera iniciada');
      }
    } catch (error) {
      alert('Erro ao acessar câmera');
    }
  };

  const capturarELer = () => {
    if (!videoRef.current || !canvasRef.current) {
      addDebug('❌ Video ou Canvas não disponível');
      return;
    }
    
    setLoading(true);
    setResultado(null);
    addDebug('📸 Capturando imagem...');
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      addDebug('❌ Erro ao obter contexto');
      setLoading(false);
      return;
    }
    
    ctx.drawImage(video, 0, 0);
    setImagemPreview(canvas.toDataURL('image/jpeg', 0.9));
    
    // 1. DETECTAR ÂNCORAS
    addDebug('🔍 Procurando âncoras 2x2...');
    const ancorasEncontradas = detectarAncoras2x2(canvas, configAncoras.ancoras);
    
    if (ancorasEncontradas.length < 4) {
      addDebug(`❌ Encontradas apenas ${ancorasEncontradas.length} âncoras (precisa de 4)`);
      addDebug('💡 Verifique se o gabarito está bem iluminado e enquadrado');
      setLoading(false);
      return;
    }
    
    addDebug(`✅ ${ancorasEncontradas.length} âncoras encontradas!`);
    
    // Mostrar âncoras no overlay
    desenharAncorasOverlay(canvas, ancorasEncontradas);
    
    // 2. CALCULAR POSIÇÕES
    const posicoes = calcularPosicoes(canvas, ancorasEncontradas);
    
    if (!posicoes) {
      addDebug('❌ Erro ao calcular posições');
      setLoading(false);
      return;
    }
    
    addDebug(`📍 Posições calculadas:`);
    addDebug(`   Start: (${Math.round(posicoes.startX)}, ${Math.round(posicoes.startY)})`);
    addDebug(`   Spacing: X=${Math.round(posicoes.spacingX)}, Y=${Math.round(posicoes.spacingY)}`);
    addDebug(`   Tamanho âncora: ${Math.round(posicoes.tamanhoAncora)}px`);
    
    // 3. LER BOLINHAS
    const respostas = lerBolinhas(canvas, posicoes);
    
    const total = Object.keys(respostas).length;
    
    if (total > 0) {
      setResultado({
        id: '31059',
        nome: 'Aluno',
        turma: '1ºTA',
        prova: '1º ETAPA 2019',
        respostas,
        total,
        ancoras: ancorasEncontradas,
        posicoes
      });
      addDebug(`✅ ${total} questões detectadas`);
    } else {
      addDebug('❌ Nenhuma resposta detectada');
    }
    
    setLoading(false);
    
    if (video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      setCameraAtiva(false);
    }
  };

  const lerBolinhas = (canvas: HTMLCanvasElement, posicoes: any): Record<string, string> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return {};
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const respostas: Record<string, string> = {};
    const { questoes, alternativas } = configAncoras;
    const { startX, startY, spacingX, spacingY, bolinhaRaio } = posicoes;
    
    for (let q = 0; q < questoes; q++) {
      let alternativaMarcada: string | null = null;
      let maiorEscuridao = 0;
      
      for (let a = 0; a < alternativas.length; a++) {
        const x = startX + (a * spacingX);
        const y = startY + (q * spacingY);
        
        if (x + bolinhaRaio > canvas.width || y + bolinhaRaio > canvas.height) {
          continue;
        }
        
        let totalPixels = 0;
        let pixelsEscuros = 0;
        const raio = bolinhaRaio;
        
        for (let dy = -raio; dy <= raio; dy++) {
          for (let dx = -raio; dx <= raio; dx++) {
            if (dx*dx + dy*dy > raio*raio) continue;
            
            const px = Math.floor(x + dx);
            const py = Math.floor(y + dy);
            
            if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
            
            const index = (py * canvas.width + px) * 4;
            const brilho = (data[index] + data[index+1] + data[index+2]) / 3;
            
            totalPixels++;
            if (brilho < 120) pixelsEscuros++;
          }
        }
        
        const percentual = totalPixels > 0 ? (pixelsEscuros / totalPixels) * 100 : 0;
        
        if (percentual > 35 && percentual > maiorEscuridao) {
          maiorEscuridao = percentual;
          alternativaMarcada = alternativas[a];
        }
      }
      
      if (alternativaMarcada) {
        respostas[(q + 1).toString()] = alternativaMarcada.toUpperCase();
      }
    }
    
    return respostas;
  };

  const desenharAncorasOverlay = (canvas: HTMLCanvasElement, ancoras: any[]) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    ancoras.forEach((ancora, i) => {
      const cores = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF'];
      
      // Círculo ao redor da âncora
      ctx.strokeStyle = cores[i % cores.length];
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(ancora.x, ancora.y, ancora.tamanho, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ANC-${i+1}`, ancora.x, ancora.y);
      
      // Coordenadas
      ctx.fillStyle = '#FFFF00';
      ctx.font = '10px Arial';
      ctx.fillText(`(${Math.round(ancora.x)}, ${Math.round(ancora.y)})`, ancora.x, ancora.y + 20);
    });
  };

  const pararCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraAtiva(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">📋 Leitor com Âncoras 2x2</h1>
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
          <GabaritoComAncoras2x2 />
        ) : (
          <>
            {/* Status */}
            <div className="bg-gray-100 p-2 rounded text-sm mb-4">
              <span className="font-bold">Status:</span>{' '}
              {cameraAtiva ? '🟢 Câmera ativa' : '⚪ Câmera parada'}
              {loading && ' ⏳ Processando...'}
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
              
              {!cameraAtiva && !imagemPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📷</p>
                    <p>Clique em "Iniciar Câmera"</p>
                    <p className="text-sm text-gray-400">Aponte para o gabarito com âncoras 2x2</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="space-y-2 mt-4">
              {!cameraAtiva && !imagemPreview ? (
                <button
                  onClick={iniciarCamera}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700"
                >
                  📷 Iniciar Câmera
                </button>
              ) : (
                <>
                  {!resultado && (
                    <button
                      onClick={capturarELer}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? '⏳ Analisando...' : '📸 Capturar e Ler'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      pararCamera();
                      setImagemPreview(null);
                      setResultado(null);
                      setDebug([]);
                      setTimeout(iniciarCamera, 300);
                    }}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700"
                  >
                    🔄 Reiniciar
                  </button>
                </>
              )}
            </div>

            {/* Debug */}
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
                  <div><strong>Turma:</strong> {resultado.turma}</div>
                  <div><strong>Prova:</strong> {resultado.prova}</div>
                  <div><strong>Total:</strong> {resultado.total} questões</div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-2">Respostas:</p>
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
                  <summary className="cursor-pointer text-gray-500">📋 Ver JSON completo</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}