import { describe, it, expect } from 'vitest';

// Simulate the points calculator logic from the API
const PONTOS_VALOR: Record<string, number> = {
  'livelo': 0.02, 'esfera': 0.025, 'smiles': 0.02, 'azul': 0.05,
  'latam': 0.03, 'dotz': 0.015, 'cashback': 1.0, 'default': 0.01,
};

function getValorPonto(banco: string): number {
  const b = banco.toLowerCase();
  for (const [key, val] of Object.entries(PONTOS_VALOR)) {
    if (b.includes(key)) return val;
  }
  return PONTOS_VALOR.default;
}

function calcularMelhorOpcao(valor: number, cartoes: { apelido: string; banco: string; pontos_por_real: number }[]) {
  return cartoes.map(c => {
    const pontosGanhos = Math.round(valor * c.pontos_por_real);
    const valorPorPonto = getValorPonto(c.banco || c.apelido);
    const valorEquivalente = Number((pontosGanhos * valorPorPonto).toFixed(2));
    const precoFinal = Number((valor - valorEquivalente).toFixed(2));
    return { ...c, pontosGanhos, valorEquivalente, precoFinal };
  }).sort((a, b) => a.precoFinal - b.precoFinal);
}

describe('Calculadora de Pontos', () => {
  const cartoes = [
    { apelido: 'Nubank Ultravioleta', banco: 'Nubank Esfera', pontos_por_real: 2.2 },
    { apelido: 'Itaú Azul', banco: 'Itaú Azul', pontos_por_real: 14 },
    { apelido: 'C6 Carbon Livelo', banco: 'C6 Livelo', pontos_por_real: 2.5 },
    { apelido: 'Bradesco Aeternum', banco: 'Bradesco Livelo', pontos_por_real: 2.0 },
  ];

  it('should calculate iPhone R$1301.16 correctly', () => {
    const result = calcularMelhorOpcao(1301.16, cartoes);
    expect(result[0].precoFinal).toBeLessThan(1301.16);
    expect(result[0].valorEquivalente).toBeGreaterThan(0);
  });

  it('should rank by precoFinal ascending (best deal first)', () => {
    const result = calcularMelhorOpcao(1000, cartoes);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].precoFinal).toBeLessThanOrEqual(result[i + 1].precoFinal);
    }
  });

  it('Azul should give highest points per real', () => {
    const result = calcularMelhorOpcao(1000, cartoes);
    const azul = result.find(r => r.apelido.includes('Azul'));
    expect(azul!.pontosGanhos).toBe(14000);
    expect(azul!.valorEquivalente).toBe(700); // 14000 * 0.05
  });

  it('should never have negative precoFinal', () => {
    const result = calcularMelhorOpcao(100, cartoes);
    result.forEach(r => expect(r.precoFinal).toBeGreaterThanOrEqual(0));
  });

  it('Livelo programs should use 0.02 per point', () => {
    expect(getValorPonto('C6 Livelo')).toBe(0.02);
    expect(getValorPonto('Bradesco Livelo')).toBe(0.02);
  });

  it('Esfera programs should use 0.025 per point', () => {
    expect(getValorPonto('Nubank Esfera')).toBe(0.025);
  });

  it('Azul should use 0.05 per point', () => {
    expect(getValorPonto('Itaú Azul')).toBe(0.05);
  });
});
