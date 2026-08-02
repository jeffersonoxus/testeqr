// app/page.tsx - Versão Corrigida

'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [aba, setAba] = useState<'gerar' | 'ler'>('ler');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  // ========== LER GABARITO REAL ==========
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
      }
    } catch (error) {
      alert('Erro ao acessar câmera: ' + error);
    }
  };

  const capturarELer = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setLoading(true);
    setResultado(null);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    setImagemPreview(canvas.toDataURL('image/jpeg', 0.8));
    
    setTimeout(() => {
      const respostas = processarGabarito(canvas);
      
      if (respostas && Object.keys(respostas).length > 0) {
        setResultado({
          id: '2025001',
          nome: 'João Silva',
          turma: '3A',
          prova: 'MATEMÁTICA',
          respostas: respostas,
          total: Object.keys(respostas).length
        });
      } else {
        alert('Nenhuma bolinha detectada. Tente enquadrar melhor o gabarito.');
      }
      
      setLoading(false);
      
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }, 1000);
  };

  const processarGabarito = (canvas: HTMLCanvasElement): Record<string, string> => {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const respostas: Record<string, string> = {};
    const questoes = 10;
    const alternativas = ['A', 'B', 'C', 'D', 'E'];
    
    // CONFIGURAÇÃO - AJUSTE PARA SEU GABARITO
    const startX = 100;
    const startY = 200;
    const spacingX = 60;
    const spacingY = 40;
    const bolinhaRaio = 15;
    
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
        
        console.log(`Q${q+1}${alternativas[a]}: ${percentualEscuro.toFixed(1)}% escuro`);
        
        if (percentualEscuro > 40 && percentualEscuro > maiorEscuridao) {
          maiorEscuridao = percentualEscuro;
          alternativaMarcada = alternativas[a];
        }
      }
      
      if (alternativaMarcada) {
        respostas[(q + 1).toString()] = alternativaMarcada;
        console.log(`✅ Q${q+1}: ${alternativaMarcada} (${maiorEscuridao.toFixed(1)}% escuro)`);
      } else {
        console.log(`❌ Q${q+1}: Não detectada`);
      }
    }
    
    console.log(`📊 Total detectado: ${Object.keys(respostas).length} questões`);
    return respostas;
  };

  const pararCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setResultado(null);
    setImagemPreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold text-center">📋 Leitor de Gabarito</h1>
      </div>

      {/* Abas */}
      <div className="flex border-b bg-white">
        <button
          className={`flex-1 py-3 font-medium transition ${
            aba === 'ler' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500'
          }`}
          onClick={() => { setAba('ler'); setResultado(null); pararCamera(); }}
        >
          📸 Ler Gabarito
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4 max-w-md mx-auto">
        <div className="space-y-4">
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800">
            💡 Aponte a câmera para o gabarito e clique em "Capturar"
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
            
            {!videoRef.current?.srcObject && !resultado && !imagemPreview && (
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
          {!videoRef.current?.srcObject && !imagemPreview ? (
            <button
              onClick={iniciarCamera}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition"
            >
              📷 Iniciar Câmera
            </button>
          ) : (
            <>
              {!resultado && (
                <button
                  onClick={capturarELer}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? '⏳ Analisando...' : '📸 Capturar e Ler'}
                </button>
              )}
              
              <button
                onClick={() => { 
                  pararCamera(); 
                  setImagemPreview(null);
                  iniciarCamera();
                }}
                className="w-full bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition"
              >
                🔄 Reiniciar
              </button>
            </>
          )}

          {/* Resultado - CORRIGIDO */}
          {resultado && (
            <div className="bg-white rounded-lg shadow p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-green-600">✅ Gabarito Lido!</h3>
                <button
                  onClick={() => { setResultado(null); setImagemPreview(null); iniciarCamera(); }}
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
                  Respostas ({resultado.total} de 10 questões detectadas)
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(resultado.respostas).map(([q, r]) => {
                    // Garantir que r é string
                    const resposta = String(r);
                    return (
                      <div key={q} className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">{q}</div>
                        <div className="font-bold text-blue-700">{resposta}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500">📋 Ver JSON completo</summary>
                <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
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
          {imagemPreview && !resultado && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800">
              <p>💡 <strong>Dica:</strong> Se não estiver detectando, ajuste as coordenadas:</p>
              <pre className="mt-1 bg-yellow-100 p-2 rounded overflow-x-auto text-xs">
                startX = 100  ← posição X da primeira bolinha<br/>
                startY = 200  ← posição Y da primeira bolinha<br/>
                spacingX = 60 ← distância entre A-B-C-D-E<br/>
                spacingY = 40 ← distância entre questões
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}