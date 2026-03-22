import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    const userId = session.id;
    const hoje = new Date().toISOString().split('T')[0];

    const { rows: compromissosHoje } = await sql`SELECT * FROM compromissos WHERE user_id = ${userId} AND data = ${hoje} ORDER BY hora`;
    const { rows: boletosUrgentes } = await sql`SELECT * FROM boletos WHERE user_id = ${userId} AND pago = 0 AND vencimento >= CURRENT_DATE AND vencimento <= CURRENT_DATE + INTERVAL '3 days' ORDER BY vencimento`;
    const mes = hoje.substring(0, 7) + '%';
    const { rows: recR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${userId} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes}`;
    const { rows: gasR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${userId} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes}`;
    const receitas = Number((recR[0] as any).t);
    const gastos = Number((gasR[0] as any).t);
    const saldo = receitas - gastos;

    const hojeStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    let resumo = `Bom dia! Resumo de ${hojeStr}\n\n`;
    if (compromissosHoje.length > 0) {
      resumo += 'COMPROMISSOS HOJE:\n';
      for (const c of compromissosHoje) { const r = c as any; resumo += `- ${r.hora || '??:??'} ${r.titulo}\n`; }
      resumo += '\n';
    }
    if (boletosUrgentes.length > 0) {
      resumo += 'BOLETOS:\n';
      for (const b of boletosUrgentes) { const r = b as any; const dias = Math.ceil((new Date(r.vencimento).getTime() - Date.now()) / 86400000); resumo += `- ${r.tipo}: R$ ${Number(r.valor).toFixed(2)} (${dias === 0 ? 'HOJE' : dias + ' dias'})\n`; }
      resumo += '\n';
    }
    resumo += `SALDO: R$ ${saldo.toFixed(2)} (Entradas: R$ ${receitas.toFixed(2)} | Saidas: R$ ${gastos.toFixed(2)})`;

    return NextResponse.json({ resumo, compromissos: compromissosHoje.length, boletos: boletosUrgentes.length, saldo });
  } catch (error) {
    console.error('Erro resumo diario:', error);
    return NextResponse.json({ error: 'Erro ao gerar resumo' }, { status: 500 });
  }
}
