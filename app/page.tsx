// app/page.tsx

'use client';

import { useState, useRef } from 'react';
import { GabaritoComAncoras } from './components/GabaritoComAncoras';
import { 
  configuracaoGabarito,
  detectarAncoras,
  lerBolinhasComAncoras,
  desenharOverlayAncoras
} from './lib/ancoras-gabarito';
import type { ResultadoLeitura } from './types/gabarito';

export default function Home() {
  const [modo, setModo] = useState<'gerar' | 'ler'>('gerar');
  const [resultado, setResultado] = useState<ResultadoLeitura | null>(null);
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
      alert('Erro ao acessar câmera');
      addDebug('❌ Erro na câmera');
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
      addDebug('❌ Erro ao obter contexto do canvas');
      setLoading(false);
      return;
    }
    
    ctx.drawImage(video, 0, 0);
    setImagemPreview(canvas.toDataURL('image/jpeg', 0.9));
    
    // 1. DETECTAR ÂNCORAS
    const { encontradas, ajustes } = detectarAncoras(canvas, configuracaoGabarito.ancoras);
    
    if (encontradas.length === 0) {
      addDebug('❌ Nenhuma âncora encontrada!');
      addDebug('💡 O gabarito precisa ter as cores: 🔴🟢🔵🟣');
      setLoading(false);
      return;
    }
    
    addDebug(`✅ ${encontradas.length} âncoras encontradas!`);
    addDebug(`📐 Ajuste: X=${ajustes.dx}, Y=${ajustes.dy}`);
    
    // Desenhar overlay com as âncoras
    if (overlayCanvasRef.current) {
      desenharOverlayAncoras(canvas, encontradas, overlayCanvasRef.current);
    }
    
    // 2. LER BOLINHAS COM AS ÂNCORAS
    const respostas = lerBolinhasComAncoras(canvas, encontradas, ajustes);
    
    const total = Object.keys(respostas).length;
    
    if (total > 0) {
      setResultado({
        id: '2025001',
        nome: 'João Silva',
        turma: '3A',
        prova: 'MATEMÁTICA',
        respostas,
        total
      });
      addDebug(`✅ ${total} questões detectadas`);
    } else {
      addDebug('❌ Nenhuma resposta detectada');
    }
    
    setLoading(false);
    
    // Parar câmera
    if (video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      setCameraAtiva(false);
    }
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
    setDebug([]);
  };

  const copiarJSON = () => {
    if (resultado) {
      navigator.clipboard.writeText(JSON.stringify(resultado, null, 2));
      alert('✅ JSON copiado!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow">
        <h1 className="text-xl font-bold text-center">📋 Leitor com Âncoras</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Abas */}
        <div className="flex border-b bg-white rounded-t-lg mb-4 overflow-hidden">
          <button
            className={`flex-1 py-3 font-medium transition ${
              modo === 'gerar' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => { setModo('gerar'); pararCamera(); }}
          >
            📐 Gerar
          </button>
          <button
            className={`flex-1 py-3 font-medium transition ${
              modo === 'ler' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => { setModo('ler'); }}
          >
            📸 Ler
          </button>
        </div>

        {/* Conteúdo */}
        {modo === 'gerar' ? (
          <GabaritoComAncoras />
        ) : (
          <>
            {/* Status */}
            <div className="bg-gray-100 p-3 rounded-lg text-sm mb-4 flex justify-between items-center">
              <span>
                <span className="font-bold">Status:</span>{' '}
                {cameraAtiva ? '🟢 Câmera ativa' : '⚪ Câmera parada'}
                {loading && ' ⏳ Processando...'}
              </span>
              {resultado && (
                <span className="text-green-600 font-bold">✅ Lido!</span>
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
              
              {!cameraAtiva && !imagemPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                  <div className="text-center">
                    <p className="text-5xl mb-3">📷</p>
                    <p className="text-lg font-medium">Clique em "Iniciar Câmera"</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Aponte para o gabarito com as âncoras coloridas
                    </p>
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
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition active:scale-95"
                >
                  📷 Iniciar Câmera
                </button>
              ) : (
                <>
                  {!resultado && (
                    <button
                      onClick={capturarELer}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 transition disabled:opacity-50 active:scale-95"
                    >
                      {loading ? '⏳ Analisando...' : '📸 Capturar e Ler'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      pararCamera();
                      setImagemPreview(null);
                      setTimeout(iniciarCamera, 300);
                    }}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition"
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
                    className="text-sm text-blue-600 hover:underline"
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

                <div className="flex gap-2">
                  <button
                    onClick={copiarJSON}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200 transition"
                  >
                    📋 Copiar JSON
                  </button>
                  <button
                    onClick={() => {
                      setResultado(null);
                      setImagemPreview(null);
                      iniciarCamera();
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"
                  >
                    🔄 Nova Leitura
                  </button>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">📋 Ver JSON completo</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Dicas */}
            {debug.some(d => d.includes('âncora encontrada')) && (
              <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded text-sm text-green-800">
                <p className="font-bold">✅ Âncoras encontradas!</p>
                <p className="mt-1">O app ajustou a leitura automaticamente.</p>
              </div>
            )}

            {debug.some(d => d.includes('Nenhuma âncora')) && (
              <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                <p className="font-bold">❌ Nenhuma âncora encontrada!</p>
                <p className="mt-1">Certifique-se que o gabarito tem as cores:</p>
                <div className="flex gap-4 mt-2">
                  <span>🔴 Vermelho</span>
                  <span>🟢 Verde</span>
                  <span>🔵 Azul</span>
                  <span>🟣 Rosa</span>
                </div>
                <p className="mt-1 text-xs">Gere o gabarito na aba "Gerar" e imprima.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}