// components/GabaritoComAncoras2x2.tsx

'use client';

import { useRef, useEffect, useState } from 'react';

export function GabaritoComAncoras2x2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState({
    questoes: 9,
    alternativas: ['a', 'b', 'c', 'd', 'e'],
    tamanhoAncora: 20
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { questoes, alternativas, tamanhoAncora } = config;
    const margin = 60;
    const spacingX = 50;
    const spacingY = 35;
    const bolinhaRaio = 12;

    // Fundo
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GABARITO COM ÂNCORAS 2x2', canvas.width / 2, 30);

    // ===== DESENHAR ÂNCORAS =====
    const ancoras = [
      { x: margin, y: margin, padrao: [[0,1],[1,0]] },
      { x: canvas.width - margin - tamanhoAncora, y: margin, padrao: [[1,0],[0,1]] },
      { x: margin, y: canvas.height - margin - tamanhoAncora, padrao: [[1,0],[0,1]] },
      { x: canvas.width - margin - tamanhoAncora, y: canvas.height - margin - tamanhoAncora, padrao: [[0,1],[1,0]] }
    ];

    ancoras.forEach((ancora, index) => {
      const size = tamanhoAncora;
      
      // Desenhar os 4 quadrados (2x2)
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const x = ancora.x + (col * size / 2);
          const y = ancora.y + (row * size / 2);
          
          ctx.fillStyle = ancora.padrao[row][col] === 0 ? '#000' : '#FFF';
          ctx.fillRect(x, y, size / 2, size / 2);
          
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, size / 2, size / 2);
        }
      }
      
      // Borda da âncora
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(ancora.x, ancora.y, size, size);
      
      // Label
      ctx.fillStyle = '#FF0000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const labels = ['ANC-1', 'ANC-2', 'ANC-3', 'ANC-4'];
      ctx.fillText(labels[index], ancora.x + size/2, ancora.y - 5);
    });

    // ===== DESENHAR BOLINHAS =====
    const startX = margin + tamanhoAncora + 20;
    const startY = margin + tamanhoAncora + 40;

    for (let q = 0; q < questoes; q++) {
      for (let a = 0; a < alternativas.length; a++) {
        const x = startX + (a * spacingX);
        const y = startY + (q * spacingY);
        
        ctx.beginPath();
        ctx.arc(x, y, bolinhaRaio, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(alternativas[a].toUpperCase(), x, y);
        
        if (a === 0) {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(`Q.${q+1}`, x - 20, y);
        }
      }
    }

    // Instruções
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    const msg = 'As âncoras (quadrados 2x2) serão detectadas automaticamente';
    ctx.fillText(msg, canvas.width / 2, canvas.height - 20);

  }, [config]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Gabarito com Âncoras 2x2</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
              img { max-width: 100%; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              @media print { body { background: white; } img { box-shadow: none; } }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>window.onload = () => { setTimeout(window.print, 1000); }<\/script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">📐 Gabarito com Âncoras 2x2</h3>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          🖨️ Imprimir
        </button>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm mb-4">
        <p className="font-bold text-yellow-800">🔍 Como funciona:</p>
        <ul className="list-disc list-inside text-yellow-700 mt-1 text-xs space-y-1">
          <li>As âncoras são os quadrados 2x2 nos cantos (padrão preto/branco)</li>
          <li>O app vai procurar por esses padrões automaticamente</li>
          <li>Depois de encontrar, calcula a posição de TODAS as bolinhas</li>
          <li>Não precisa de coordenadas fixas - funciona mesmo se a foto estiver torta!</li>
        </ul>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full border border-gray-300 rounded"
      />
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 p-2 rounded">
          <span className="font-bold">Âncora 1:</span> Superior Esquerdo
          <br/>
          <span className="text-gray-500">Padrão: █▓ / ▓█</span>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <span className="font-bold">Âncora 2:</span> Superior Direito
          <br/>
          <span className="text-gray-500">Padrão: ▓█ / █▓</span>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <span className="font-bold">Âncora 3:</span> Inferior Esquerdo
          <br/>
          <span className="text-gray-500">Padrão: ▓█ / █▓</span>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <span className="font-bold">Âncora 4:</span> Inferior Direito
          <br/>
          <span className="text-gray-500">Padrão: █▓ / ▓█</span>
        </div>
      </div>
    </div>
  );
}