import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { MM_PARA_PT, PAGINA, ANCORA, QRCODE, GRID, gerarCoordenadasBolhas } from "@/lib/gabaritoLayout";

const mm = (v: number) => v * MM_PARA_PT;

export async function POST(req: NextRequest) {
  const { alunoId, provaId, versao } = await req.json();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([mm(PAGINA.larguraMm), mm(PAGINA.alturaMm)]);
  const alturaPt = mm(PAGINA.alturaMm);
  const largPt = mm(PAGINA.larguraMm);
  const y = (yMm: number) => alturaPt - mm(yMm);

  // âncoras
  const tam = mm(ANCORA.tamanhoMm);
  const marg = mm(ANCORA.margemMm);
  [
    { x: marg, y: alturaPt - marg - tam },
    { x: largPt - marg - tam, y: alturaPt - marg - tam },
    { x: marg, y: marg },
    { x: largPt - marg - tam, y: marg },
  ].forEach(({ x, y }) => page.drawRectangle({ x, y, width: tam, height: tam, color: rgb(0, 0, 0) }));

  // QR Code
  const conteudoQr = `aluno_id:${alunoId};prova_id:${provaId};versao:${versao}`;
  const qrDataUrl = await QRCode.toDataURL(conteudoQr, { margin: 0 });
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(",")[1], "base64"));
  const qrTam = mm(QRCODE.tamanhoMm);
  page.drawImage(qrImage, { x: mm(QRCODE.xMm), y: y(QRCODE.yMm) - qrTam, width: qrTam, height: qrTam });

  // bolhas
  const raio = mm(GRID.raioBolhaMm);
  gerarCoordenadasBolhas().forEach(({ xMm, yMm, alternativa, questao }) => {
    const xPt = mm(xMm), yPt = y(yMm);
    page.drawCircle({ x: xPt, y: yPt, size: raio, borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText(alternativa, { x: xPt - 2.5, y: yPt - 3, size: 7, color: rgb(0, 0, 0) });
    if (alternativa === "A") {
      page.drawText(String(questao), { x: mm(GRID.inicioXMm) - mm(12), y: yPt - 3, size: 9, color: rgb(0, 0, 0) });
    }
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="gabarito.pdf"` },
  });
}