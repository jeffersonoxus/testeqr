"use client";
import { useEffect, useRef, useState } from "react";
import { useOpenCV } from "@/hooks/useOpenCV";
import { GRID, PAGINA, gerarCoordenadasBolhas } from "@/lib/gabaritoLayout";

const LARGURA_CORRIGIDA = 800;
const ALTURA_CORRIGIDA = Math.round((PAGINA.alturaMm / PAGINA.larguraMm) * LARGURA_CORRIGIDA);

export default function LeitorGabarito() {
  const { cv, pronto } = useOpenCV();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Carregando OpenCV...");
  const [resultado, setResultado] = useState<{ qr: string; respostas: Record<number, string | null> } | null>(null);

  useEffect(() => {
    if (!pronto) return;
    let streamAtivo: MediaStream | null = null;
    let ativo = true;

    async function iniciar() {
      setStatus("Iniciando câmera...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        streamAtivo = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch {
        setStatus("Erro ao acessar a câmera.");
        return;
      }
      setStatus("Posicione o gabarito no quadro...");
      loop();
    }

    function ordenarCantos(pontos: { x: number; y: number }[]) {
      const soma = pontos.map((p) => p.x + p.y);
      const dif = pontos.map((p) => p.x - p.y);
      return [
        pontos[soma.indexOf(Math.min(...soma))],
        pontos[dif.indexOf(Math.max(...dif))],
        pontos[soma.indexOf(Math.max(...soma))],
        pontos[dif.indexOf(Math.min(...dif))],
      ];
    }

    function encontrarAncoras(matCinza: any) {
      const bin = new cv.Mat();
      cv.threshold(matCinza, bin, 80, 255, cv.THRESH_BINARY_INV);
      const contornos = new cv.MatVector();
      const hier = new cv.Mat();
      cv.findContours(bin, contornos, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const candidatos: { ponto: { x: number; y: number }; area: number }[] = [];
      for (let i = 0; i < contornos.size(); i++) {
        const c = contornos.get(i);
        const area = cv.contourArea(c);
        const r = cv.boundingRect(c);
        const aspecto = r.width / r.height;
        if (area > 300 && area < 8000 && aspecto > 0.7 && aspecto < 1.3) {
          candidatos.push({ ponto: { x: r.x + r.width / 2, y: r.y + r.height / 2 }, area });
        }
        c.delete();
      }
      bin.delete(); contornos.delete(); hier.delete();

      if (candidatos.length < 4) return null;
      candidatos.sort((a, b) => b.area - a.area);
      return ordenarCantos(candidatos.slice(0, 4).map((c) => c.ponto));
    }

    function lerRespostas(matBinaria: any) {
      const fatorX = LARGURA_CORRIGIDA / PAGINA.larguraMm;
      const fatorY = ALTURA_CORRIGIDA / PAGINA.alturaMm;
      const raioPx = Math.round(GRID.raioBolhaMm * fatorX * 0.8);
      const porQuestao: Record<number, { alt: string; px: number }[]> = {};

      gerarCoordenadasBolhas().forEach(({ questao, alternativa, xMm, yMm }) => {
        const cx = Math.round(xMm * fatorX), cy = Math.round(yMm * fatorY);
        const mascara = cv.Mat.zeros(matBinaria.rows, matBinaria.cols, cv.CV_8UC1);
        cv.circle(mascara, new cv.Point(cx, cy), raioPx, new cv.Scalar(255), -1);
        const res = new cv.Mat();
        cv.bitwise_and(matBinaria, matBinaria, res, mascara);
        const px = cv.countNonZero(res);
        mascara.delete(); res.delete();
        (porQuestao[questao] ||= []).push({ alt: alternativa, px });
      });

      const LIMIAR = 40;
      const respostas: Record<number, string | null> = {};
      Object.entries(porQuestao).forEach(([q, alts]) => {
        const maior = alts.reduce((a, b) => (b.px > a.px ? b : a));
        respostas[Number(q)] = maior.px >= LIMIAR ? maior.alt : null;
      });
      return respostas;
    }

    function loop() {
      if (!ativo || !videoRef.current || !canvasRef.current || !cv) return;
      const video = videoRef.current, canvas = canvasRef.current;
      if (video.videoWidth === 0) { requestAnimationFrame(loop); return; }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);

      const matOriginal = cv.imread(canvas);
      const matCinza = new cv.Mat();
      cv.cvtColor(matOriginal, matCinza, cv.COLOR_RGBA2GRAY);

      const cantos = encontrarAncoras(matCinza);

      if (cantos) {
        setStatus("Detectado! Processando...");

        const origem = cv.matFromArray(4, 1, cv.CV_32FC2, cantos.flatMap((p) => [p.x, p.y]));
        const destino = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, LARGURA_CORRIGIDA, 0, LARGURA_CORRIGIDA, ALTURA_CORRIGIDA, 0, ALTURA_CORRIGIDA]);
        const matriz = cv.getPerspectiveTransform(origem, destino);
        const corrigida = new cv.Mat();
        cv.warpPerspective(matOriginal, corrigida, matriz, new cv.Size(LARGURA_CORRIGIDA, ALTURA_CORRIGIDA));

        // QR Code
        const detector = new cv.QRCodeDetector();
        const qr = detector.detectAndDecode(corrigida);

        // bolhas
        const corrigidaCinza = new cv.Mat();
        cv.cvtColor(corrigida, corrigidaCinza, cv.COLOR_RGBA2GRAY);
        const binaria = new cv.Mat();
        cv.adaptiveThreshold(corrigidaCinza, binaria, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 25, 10);
        const respostas = lerRespostas(binaria);

        origem.delete(); destino.delete(); matriz.delete(); corrigida.delete();
        corrigidaCinza.delete(); binaria.delete(); matOriginal.delete(); matCinza.delete();

        ativo = false;
        setResultado({ qr: qr || "(QR não lido)", respostas });
        setStatus("Leitura concluída.");
        return;
      }

      matOriginal.delete(); matCinza.delete();
      requestAnimationFrame(loop);
    }

    iniciar();
    return () => { ativo = false; streamAtivo?.getTracks().forEach((t) => t.stop()); };
  }, [pronto, cv]);

  return (
    <div className="max-w-md mx-auto">
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-center mt-2 text-sm text-gray-600">{status}</p>

      {resultado && (
        <div className="mt-4 bg-white border rounded-lg p-3">
          <p className="text-sm text-gray-500">QR Code:</p>
          <p className="font-mono text-sm mb-3">{resultado.qr}</p>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {Object.entries(resultado.respostas).map(([q, alt]) => (
              <div key={q} className="bg-gray-50 rounded p-2 text-center">
                {q}: <span className="font-mono font-bold">{alt ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}