import Link from "next/link";

export default function Home() {
  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6 text-center">Gabarito App</h1>
      <div className="flex flex-col gap-3">
        <Link href="/gerar-gabarito" className="block text-center py-3 bg-green-600 text-white rounded-lg font-medium">
          Gerar Gabarito (PDF)
        </Link>
        <Link href="/leitor" className="block text-center py-3 bg-purple-600 text-white rounded-lg font-medium">
          Ler Gabarito (câmera)
        </Link>
      </div>
    </main>
  );
}