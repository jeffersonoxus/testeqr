// components/GabaritoComAncoras.tsx

'use client';

import { useRef, useEffect } from 'react';
import { configuracaoGabarito } from '../lib/ancoras-gabarito';

export function GabaritoComAncoras() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { ancoras, questoes, alternativas, startX, startY, spacingX, spacingY, bolinhaRaio } = configuracaoGabarito;

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GABARITO COM ÂNCORAS', canvas.width / 2, 30);

    // Legenda das cores
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const legendas = [
      { cor: '#FF0000', texto: '🔴 Âncora 1 (Top-Left)' },
      { cor: '#00FF00', texto: '🟢 Âncora 2 (Top-Right)' },
      { cor: '#0000FF', texto: '🔵 Âncora 3 (Bottom-Left)' },
      { cor: '#FF00FF', texto: '🟣 Referência Q1A' }
    ];
    
    legendas.forEach((leg, i) => {
      const y = 55 + (i * 20);
      ctx.fillStyle = leg.cor;
      ctx.fillRect(10, y - 8, 12, 12);
      ctx.fillStyle = '#000000';
      ctx.fillText(leg.texto, 28, y + 4);
    });

    // ===== DESENHAR ÂNCORAS =====
    ancoras.forEach(ancora => {
      // Círculo colorido
      ctx.fillStyle = ancora.cor;
      ctx.beginPath();
      ctx.arc(ancora.x, ancora.y, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Borda preta
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ancora.id, ancora.x, ancora.y - 20);
      
      // Coordenadas
      ctx.fillStyle = '#666666';
      ctx.font = '9px Arial';
      ctx.fillText(`(${ancora.x}, ${ancora.y})`, ancora.x, ancora.y + 25);
    });

    // ===== DESENHAR BOLINHAS DO GABARITO =====
    for (let q = 0; q < questoes; q++) {
      for (let a = 0; a < alternativas.length; a++) {
        const x = startX + (a * spacingX);
        const y = startY + (q * spacingY);
        
        // Círculo da bolinha
        ctx.beginPath();
        ctx.arc(x, y, bolinhaRaio, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Letra da alternativa
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(alternativas[a], x, y);
        
        // Número da questão
        if (a === 0) {
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(q + 1), x - 20, y);
        }
      }
    }

    // Instruções
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Imprima este gabarito e preencha as bolinhas com caneta preta', canvas.width / 2, canvas.height - 20);

  }, []);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Gabarito</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = () => {
                // window.print(); // Descomente para imprimir automaticamente
              }
            <\/script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">📐 Gerar Gabarito com Âncoras</h3>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          🖨️ Imprimir / Baixar
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        ⚠️ As cores (🔴🟢🔵🟣) são as <strong>âncoras</strong> que o app vai procurar!
      </p>
      
      <canvas
        ref={canvasRef}
        width={600}
        height={800}
        className="w-full border border-gray-300 rounded"
      />
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <p className="font-bold text-yellow-800">💡 Instruções:</p>
        <ol className="list-decimal list-inside text-yellow-700 mt-1 space-y-1">
          <li>Imprima este gabarito (ou abra no computador)</li>
          <li>Preencha as bolinhas com caneta preta/azul</li>
          <li>No app, clique em "Ler" e aponte a câmera</li>
          <li>O app vai encontrar as âncoras coloridas automaticamente!</li>
        </ol>
      </div>
    </div>
  );
}