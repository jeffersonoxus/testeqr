import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import {
  MM_PARA_PT, PAGINA, AREA_GABARITO, AREA_GABARITO_FIM_X, AREA_GABARITO_FIM_Y,
  ANCORA, QRCODE, GRID, gerarCoordenadasBolhas,
} from "@/lib/gabaritoLayout";

const mm = (v: number) => v * MM_PARA_PT;

export async function POST(req: NextRequest) {
  const { alunoId, provaId, versao } = await req.json();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([mm(PAGINA.larguraMm), mm(PAGINA.alturaMm)]);
  const alturaPt = mm(PAGINA.alturaMm);
  const y = (yMm: number) => alturaPt - mm(yMm);

  // Retângulo pontilhado mostrando a área do gabarito (guia visual pro aluno)
  const xEsqPt = mm(AREA_GABARITO.xMm);
  const xDirPt = mm(AREA_GABARITO_FIM_X);
  const yTopoPt = y(AREA_GABARITO.yMm);
  const yBasePt = y(AREA_GABARITO_FIM_Y);

  page.drawRectangle({
    x: xEsqPt, y: yBasePt,
    width: xDirPt - xEsqPt, height: yTopoPt - yBasePt,
    borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.5, borderDashArray: [4, 4],
  });

  // Âncoras nos 4 cantos da ÁREA (não da página inteira)
  const tam = mm(ANCORA.tamanhoMm);
  const marg = mm(ANCORA.margemMm);
  [
    { x: xEsqPt + marg, y: yTopoPt - marg - tam },
    { x: xDirPt - marg - tam, y: yTopoPt - marg - tam },
    { x: xEsqPt + marg, y: yBasePt + marg },
    { x: xDirPt - marg - tam, y: yBasePt + marg },
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