import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { MM_PARA_PT, PAGINA, AREA_GABARITO, ANCORA, QRCODE, GRID, gerarCoordenadasBolhas } from "@/lib/gabaritoLayout";

const mm = (v: number) => v * MM_PARA_PT;

export async function POST(req: NextRequest) {
  const { alunoId, provaId, versao } = await req.json();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([mm(PAGINA.larguraMm), mm(PAGINA.alturaMm)]);
  const alturaPt = mm(PAGINA.alturaMm);
  const largPt = mm(PAGINA.larguraMm);
  const y = (yMm: number) => alturaPt - mm(yMm);

  // Linha visual marcando o início da área do gabarito (opcional, ajuda o aluno)
  page.drawLine({
    start: { x: 0, y: y(AREA_GABARITO.inicioYMm) },
    end: { x: largPt, y: y(AREA_GABARITO.inicioYMm) },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
    dashArray: [4, 4],
  });

  // Âncoras — agora nos 4 cantos da ÁREA DO GABARITO (metade inferior), não da página inteira
  const tam = mm(ANCORA.tamanhoMm);
  const marg = mm(ANCORA.margemMm);
  const topoAreaPt = y(AREA_GABARITO.inicioYMm); // topo da área útil, em pontos
  const baseAreaPt = y(AREA_GABARITO.fimYMm);    // base da página, em pontos

  [
    { x: marg, y: topoAreaPt - marg - tam },           // superior-esquerda da área
    { x: largPt - marg - tam, y: topoAreaPt - marg - tam }, // superior-direita da área
    { x: marg, y: baseAreaPt + marg },                  // inferior-esquerda da área
    { x: largPt - marg - tam, y: baseAreaPt + marg },   // inferior-direita da área
  ].forEach(({ x, y }) => page.drawRectangle({ x, y, width: tam, height: tam, color: rgb(0, 0, 0) }));

  // QR Code
  const conteudoQr = `aluno_id:${alunoId};prova_id:${provaId};versao:${versao}`;
  const qrDataUrl = await QRCode.toDataURL(conteudoQr, { margin: 0 });
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(",")[1], "base64"));
  const qrTam = mm(QRCODE.tamanhoMm);
  page.drawImage(qrImage, { x: mm(QRCODE.xMm), y: y(QRCODE.yMm) - qrTam, width: qrTam, height: qrTam });

  // Bolhas
  const raio = mm(GRID.raioBolhaMm);
  gerarCoordenadasBolhas().forEach(({ xMm, yMm, alternativa, questao }) => {
    const xPt = mm(xMm), yPt = y(yMm);
    page.drawCircle({ x: xPt, y: yPt, size: raio, borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText(alternativa, { x: xPt - 2.2, y: yPt - 2.8, size: 6, color: rgb(0, 0, 0) });
    if (alternativa === "A") {
      page.drawText(String(questao), { x: mm(GRID.inicioXMm) - mm(10), y: yPt - 2.8, size: 8, color: rgb(0, 0, 0) });
    }
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="gabarito.pdf"` },
  });
}