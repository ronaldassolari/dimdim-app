export interface ProgramaConfig {
  nome: string;
  taxa_produto: number;    // R$ per point for product redemption
  taxa_viagem: number;     // R$ per point for travel redemption
  taxa_cashback: number;   // R$ per point for cashback
  vencimento_meses: number | null; // null = no expiry
}

export const PROGRAMAS: Record<string, ProgramaConfig> = {
  'Livelo': { nome: 'Livelo', taxa_produto: 0.015, taxa_viagem: 0.017, taxa_cashback: 0.013, vencimento_meses: 24 },
  'Smiles': { nome: 'Smiles', taxa_produto: 0.015, taxa_viagem: 0.025, taxa_cashback: 0.012, vencimento_meses: 36 },
  'TudoAzul': { nome: 'TudoAzul', taxa_produto: 0.014, taxa_viagem: 0.016, taxa_cashback: 0.011, vencimento_meses: 24 },
  'Latam Pass': { nome: 'Latam Pass', taxa_produto: 0.012, taxa_viagem: 0.014, taxa_cashback: 0.010, vencimento_meses: 24 },
  'Esfera': { nome: 'Esfera', taxa_produto: 0.010, taxa_viagem: 0.012, taxa_cashback: 0.008, vencimento_meses: null },
  'Membership Rewards': { nome: 'Membership Rewards', taxa_produto: 0.018, taxa_viagem: 0.020, taxa_cashback: 0.015, vencimento_meses: null },
  'Itaucard': { nome: 'Itaucard', taxa_produto: 0.010, taxa_viagem: 0.012, taxa_cashback: 0.008, vencimento_meses: 24 },
  'Bradesco': { nome: 'Bradesco', taxa_produto: 0.012, taxa_viagem: 0.014, taxa_cashback: 0.009, vencimento_meses: 24 },
  'C6 Bank': { nome: 'C6 Bank', taxa_produto: 0.008, taxa_viagem: 0.010, taxa_cashback: 0.006, vencimento_meses: null },
  'Nubank': { nome: 'Nubank', taxa_produto: 0.010, taxa_viagem: 0.013, taxa_cashback: 0.010, vencimento_meses: null },
  'Dotz': { nome: 'Dotz', taxa_produto: 0.005, taxa_viagem: 0.005, taxa_cashback: 0.005, vencimento_meses: 12 },
  'Stix': { nome: 'Stix', taxa_produto: 0.008, taxa_viagem: 0.008, taxa_cashback: 0.008, vencimento_meses: 12 },
};

export function calcularValor(pontos: number, programa: string, tipo: 'produto' | 'viagem' | 'cashback'): number {
  const config = PROGRAMAS[programa];
  if (!config) return pontos * 0.01; // fallback
  const taxa = tipo === 'viagem' ? config.taxa_viagem : tipo === 'cashback' ? config.taxa_cashback : config.taxa_produto;
  return Math.round(pontos * taxa * 100) / 100;
}

export function melhorOpcao(pontos: number, programa: string): { tipo: 'produto' | 'viagem' | 'cashback'; valor: number } {
  const valores = {
    produto: calcularValor(pontos, programa, 'produto'),
    viagem: calcularValor(pontos, programa, 'viagem'),
    cashback: calcularValor(pontos, programa, 'cashback'),
  };
  const melhor = Object.entries(valores).reduce((a, b) => b[1] > a[1] ? b : a);
  return { tipo: melhor[0] as 'produto' | 'viagem' | 'cashback', valor: melhor[1] };
}

export function alertaVencimento(dias: number): 'verde' | 'amarelo' | 'vermelho' {
  if (dias < 30) return 'vermelho';
  if (dias < 90) return 'amarelo';
  return 'verde';
}
