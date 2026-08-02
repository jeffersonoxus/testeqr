'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [aba, setAba] = useState<'gerar' | 'ler'>('gerar');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ========== GERAR GABARITO ==========
  const gerarGabarito = () => {
    // Dados fixos para teste
    const aluno = {
      id: '2025001',
      nome: 'João Silva',
      turma: '3A',
      prova: 'MATEMÁTICA'
    };

    // Criar QR Code na hora (usando API simples)
    const qrText = `ID:${aluno.id},NOME:${aluno.nome},TURMA:${aluno.turma},PROVA:${aluno.prova}`;
    
    // Gerar QR Code com API pública (gratuita)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;
    
    // Abrir para impressão
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Gabarito - ${aluno.nome}</title>
            <style>
              body { font-family: Arial; padding: 40px; }
              .gabarito { max-width: 210mm; margin: 0 auto; }
              .header { display: flex; gap: 20px; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .info { flex: 1; }
              .info h1 { margin: 0; }
              .info p { margin: 5px 0; }
              .questoes { display: grid; grid-template-columns: 30px 1fr; gap: 5px; align-items: center; }
              .questoes .num { text-align: center; font-weight: bold; }
              .alternativas { display: flex; gap: 20px; justify-content: center; }
              .alternativas label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
              .alternativas input[type="radio"] { width: 20px; height: 20px; accent-color: #2563eb; }
              .footer { margin-top: 30px; border-top: 2px solid #333; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="gabarito">
              <div class="header">
                <div>
                  <img src="${qrUrl}" style="width:120px;height:120px;border:1px solid #ddd;" />
                </div>
                <div class="info">
                  <h1>GABARITO - ${aluno.prova}</h1>
                  <p><strong>ID:</strong> ${aluno.id}</p>
                  <p><strong>Aluno:</strong> ${aluno.nome}</p>
                  <p><strong>Turma:</strong> ${aluno.turma}</p>
                </div>
              </div>

              <div class="questoes">
                ${Array.from({ length: 10 }, (_, i) => {
                  const num = i + 1;
                  return `
                    <div class="num">${String(num).padStart(2, '0')}</div>
                    <div class="alternativas">
                      ${['A','B','C','D','E'].map(letra => `
                        <label>
                          <input type="radio" name="q${num}" value="${letra}" />
                          ${letra}
                        </label>
                      `).join('')}
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="footer">
                <p>Preencha completamente a bolinha da alternativa escolhida</p>
                <p>Não rasurar • Use caneta preta</p>
              </div>

              <div style="text-align:center;margin-top:20px;">
                <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;">
                  🖨️ Imprimir
                </button>
              </div>
            </div>
            <script>
              // Auto-imprimir? Descomente a linha abaixo se quiser
              // window.print();
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  // ========== LER GABARITO ==========
  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
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
    
    // Capturar frame
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    // Simular leitura (sempre retorna dados de teste)
    setTimeout(() => {
      setResultado({
        id: '2025001',
        nome: 'João Silva',
        turma: '3A',
        prova: 'MATEMÁTICA',
        respostas: {
          '1': 'A',
          '2': 'C',
          '3': 'D',
          '4': 'B',
          '5': 'A',
          '6': 'E',
          '7': 'C',
          '8': 'D',
          '9': 'B',
          '10': 'A'
        },
        total: 10
      });
      setLoading(false);
      
      // Parar câmera
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }, 1500);
  };

  const pararCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setResultado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold text-center">📋 Sistema Gabarito</h1>
      </div>

      {/* Abas */}
      <div className="flex border-b bg-white">
        <button
          className={`flex-1 py-3 font-medium transition ${
            aba === 'gerar' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500'
          }`}
          onClick={() => { setAba('gerar'); setResultado(null); pararCamera(); }}
        >
          📋 Gerar
        </button>
        <button
          className={`flex-1 py-3 font-medium transition ${
            aba === 'ler' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500'
          }`}
          onClick={() => { setAba('ler'); iniciarCamera(); }}
        >
          📸 Ler
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4 max-w-md mx-auto">
        {aba === 'gerar' ? (
          // ===== ABA GERAR =====
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-2">Dados do Aluno (pré-definido)</h2>
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> 2025001</p>
                <p><strong>Nome:</strong> João Silva</p>
                <p><strong>Turma:</strong> 3A</p>
                <p><strong>Prova:</strong> MATEMÁTICA</p>
              </div>
            </div>

            <button
              onClick={gerarGabarito}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition"
            >
              🖨️ Gerar e Imprimir
            </button>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
              ⚠️ Abrirá uma nova janela com o gabarito para impressão
            </div>
          </div>
        ) : (
          // ===== ABA LER =====
          <div className="space-y-4">
            {/* Câmera */}
            <div className="bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!videoRef.current?.srcObject && !resultado && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <p>📷 Clique em "Capturar" para ativar</p>
                </div>
              )}
            </div>

            {/* Botões */}
            {!resultado ? (
              <button
                onClick={capturarELer}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? '⏳ Processando...' : '📸 Capturar e Ler'}
              </button>
            ) : (
              <button
                onClick={() => { setResultado(null); iniciarCamera(); }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition"
              >
                🔄 Nova Leitura
              </button>
            )}

            {/* Resultado */}
            {resultado && (
              <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <h3 className="font-bold text-lg text-green-600">✅ Gabarito Lido!</h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
                  <div><strong>ID:</strong> {resultado.id}</div>
                  <div><strong>Nome:</strong> {resultado.nome}</div>
                  <div><strong>Turma:</strong> {resultado.turma}</div>
                  <div><strong>Prova:</strong> {resultado.prova}</div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-2">Respostas ({resultado.total} questões)</p>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(resultado.respostas).map(([q, r]) => (
                      <div key={q} className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">{q}</div>
                        <div className="font-bold text-blue-700">{r}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">Ver JSON</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}