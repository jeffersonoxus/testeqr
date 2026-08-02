'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [corDetectada, setCorDetectada] = useState<string>('Aguardando...');
  const [percentual, setPercentual] = useState<number>(0);
  const [debug, setDebug] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<number | null>(null);

  // ========== ADICIONAR DEBUG ==========
  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
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
        addDebug(`📐 Resolução: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        
        // Iniciar detecção ao vivo
        iniciarDetecção();
      }
    } catch (error) {
      console.error('Erro na câmera:', error);
      addDebug(`❌ Erro: ${error}`);
      alert('Erro ao acessar câmera. Verifique as permissões.');
    }
  };

  // ========== DETECÇÃO DE CORES AO VIVO ==========
  const iniciarDetecção = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const detectar = () => {
      // Verificar se o vídeo está pronto
      if (!video || video.readyState < 2) {
        frameIdRef.current = requestAnimationFrame(detectar);
        return;
      }

      // Configurar canvas com tamanho do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        frameIdRef.current = requestAnimationFrame(detectar);
        return;
      }

      // Desenhar o frame atual no canvas
      ctx.drawImage(video, 0, 0);

      // Pegar os dados da imagem
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Analisar cores
      const cores = analisarCores(data);
      
      // Atualizar estado
      setCorDetectada(cores.nome);
      setPercentual(cores.percentual);

      // Continuar detectando
      frameIdRef.current = requestAnimationFrame(detectar);
    };

    // Iniciar loop
    frameIdRef.current = requestAnimationFrame(detectar);
    addDebug('🔍 Detectando cores ao vivo...');
  };

  // ========== ANALISAR CORES ==========
  const analisarCores = (data: Uint8ClampedArray) => {
    let totalPixels = data.length / 4;
    let pixelsVermelhos = 0;
    let pixelsVerdes = 0;
    let pixelsAzuis = 0;
    let pixelsPretos = 0;
    let pixelsBrancos = 0;

    // Analisar cada pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calcular brilho
      const brilho = (r + g + b) / 3;

      // Classificar cor
      if (brilho < 30) {
        pixelsPretos++;
      } else if (brilho > 220) {
        pixelsBrancos++;
      } else if (r > g && r > b && r > 100) {
        pixelsVermelhos++;
      } else if (g > r && g > b && g > 100) {
        pixelsVerdes++;
      } else if (b > r && b > g && b > 100) {
        pixelsAzuis++;
      }
    }

    // Calcular percentuais
    const calcPercentual = (count: number) => (count / totalPixels) * 100;

    const vermelho = calcPercentual(pixelsVermelhos);
    const verde = calcPercentual(pixelsVerdes);
    const azul = calcPercentual(pixelsAzuis);
    const preto = calcPercentual(pixelsPretos);
    const branco = calcPercentual(pixelsBrancos);

    // Encontrar a cor com maior percentual
    const cores = [
      { nome: '🔴 Vermelho', percentual: vermelho },
      { nome: '🟢 Verde', percentual: verde },
      { nome: '🔵 Azul', percentual: azul },
      { nome: '⚫ Preto', percentual: preto },
      { nome: '⚪ Branco', percentual: branco }
    ];

    const maior = cores.reduce((a, b) => a.percentual > b.percentual ? a : b);

    return maior;
  };

  // ========== PARAR CÂMERA ==========
  const pararCamera = () => {
    // Parar loop de animação
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    // Parar stream da câmera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAtiva(false);
    setCorDetectada('Aguardando...');
    setPercentual(0);
    addDebug('⏹️ Câmera parada');
  };

  // ========== LIMPAR DEBUG ==========
  const limparDebug = () => {
    setDebug([]);
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
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
        <h1 className="text-xl font-bold text-center">🎨 Detector de Cores</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Status */}
        <div className="bg-gray-100 p-3 rounded-lg text-sm mb-4 flex justify-between items-center">
          <span>
            <span className="font-bold">Status:</span>{' '}
            {cameraAtiva ? '🟢 Ativa' : '⚪ Parada'}
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
            ref={canvasRef}
            className="hidden"
          />
          
          {!cameraAtiva && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
              <div className="text-center">
                <p className="text-5xl mb-3">📷</p>
                <p className="text-lg font-medium">Clique em "Iniciar Câmera"</p>
                <p className="text-sm text-gray-400 mt-1">
                  Aponte para qualquer objeto colorido
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botão Iniciar */}
        {!cameraAtiva && (
          <button
            onClick={iniciarCamera}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition active:scale-95 mt-4"
          >
            📷 Iniciar Câmera
          </button>
        )}

        {/* Resultado da Detecção */}
        {cameraAtiva && (
          <div className="mt-4 bg-white rounded-lg shadow p-4 space-y-3">
            <h3 className="font-bold text-lg">🎯 Cor Detectada</h3>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div 
                className="w-16 h-16 rounded-full border-4 border-gray-300"
                style={{
                  background: corDetectada.includes('Vermelho') ? '#FF0000' :
                              corDetectada.includes('Verde') ? '#00FF00' :
                              corDetectada.includes('Azul') ? '#0000FF' :
                              corDetectada.includes('Preto') ? '#000000' :
                              corDetectada.includes('Branco') ? '#FFFFFF' :
                              '#CCCCCC'
                }}
              />
              <div>
                <p className="text-2xl font-bold">{corDetectada}</p>
                <p className="text-sm text-gray-500">
                  {percentual.toFixed(1)}% da imagem
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Percentual</span>
                <span>{percentual.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(percentual, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Debug */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-bold text-gray-500">🐛 DEBUG</p>
            <button
              onClick={limparDebug}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Limpar
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-2 rounded-lg text-xs font-mono h-[100px] overflow-y-auto">
            {debug.length === 0 ? (
              <p className="text-gray-500">Aguardando ações...</p>
            ) : (
              debug.map((msg, i) => (
                <div key={i} className="border-b border-gray-800 py-0.5">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <p className="font-bold">💡 Como testar:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Aponte a câmera para objetos coloridos</li>
            <li>O app vai mostrar a cor predominante</li>
            <li>Veja o percentual em tempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
}