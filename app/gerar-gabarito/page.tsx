"use client";
import { useState } from "react";

export default function GerarGabarito() {
  const [carregando, setCarregando] = useState(false);

  async function gerarPdf() {
    setCarregando(true);
    const resposta = await fetch("/api/gabarito/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alunoId: "1234", provaId: "56", versao: "A" }),
    });
    const blob = await resposta.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gabarito-teste.pdf";
    link.click();
    setCarregando(false);
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Gerar Gabarito</h1>
      <button onClick={gerarPdf} disabled={carregando} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium">
        {carregando ? "Gerando..." : "Gerar PDF de Teste"}
      </button>
    </main>
  );
}