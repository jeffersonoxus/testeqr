// app/api/processar/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  // Dados fixos para teste
  return NextResponse.json({
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
    }
  });
}