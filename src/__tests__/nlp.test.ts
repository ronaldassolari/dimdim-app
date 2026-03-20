import { describe, it, expect } from 'vitest';
import { detectarIntencao, extrairGasto, detectarCategoria } from '@/lib/nlp';

describe('detectarIntencao', () => {
  // Gasto cases
  it.each([
    ['30 bigpao', 'gasto'],
    ['50 ifood', 'gasto'],
    ['gastei 50 no ifood', 'gasto'],
    ['paguei 200 aluguel', 'gasto'],
    ['comprei 80 reais de roupa', 'gasto'],
    ['150 conta de luz', 'gasto'],
    ['R$150 luz', 'gasto'],
    ['30,50 padaria', 'gasto'],
    ['30.50 uber', 'gasto'],
    ['custou 45 reais', 'gasto'],
    ['foram 120 no mercado', 'gasto'],
  ])('"%s" → %s', (msg, expected) => {
    expect(detectarIntencao(msg)).toBe(expected);
  });

  // Resumo cases
  it.each([
    ['resumo', 'resumo'],
    ['saldo', 'resumo'],
    ['extrato', 'resumo'],
    ['quanto tenho', 'resumo'],
    ['quanto gastei', 'resumo'],
    ['quanto sobrou', 'resumo'],
    ['como tão minhas finanças', 'resumo'],
  ])('"%s" → %s', (msg, expected) => {
    expect(detectarIntencao(msg)).toBe(expected);
  });

  // Busca cases
  it.each([
    ['busca iphone 15', 'busca'],
    ['buscar iphone 15', 'busca'],
    ['quanto custa geladeira', 'busca'],
    ['busca notebook', 'busca'],
    ['procura tv 50', 'busca'],
    ['procurar macbook air', 'busca'],
    ['preço do ps5', 'busca'],
  ])('"%s" → %s', (msg, expected) => {
    expect(detectarIntencao(msg)).toBe(expected);
  });

  // Pontos cases
  it.each([
    ['pontos', 'pontos'],
    ['meus pontos', 'pontos'],
    ['smiles', 'pontos'],
    ['quanto valem minhas milhas', 'pontos'],
    ['livelo', 'pontos'],
    ['carteira de pontos', 'pontos'],
  ])('"%s" → %s', (msg, expected) => {
    expect(detectarIntencao(msg)).toBe(expected);
  });

  // Geral cases
  it.each([
    ['oi', 'geral'],
    ['ajuda', 'geral'],
    ['como economizar', 'geral'],
  ])('"%s" → %s', (msg, expected) => {
    expect(detectarIntencao(msg)).toBe(expected);
  });
});

describe('extrairGasto', () => {
  it('extracts "30 bigpao"', () => {
    const r = extrairGasto('30 bigpao');
    expect(r).not.toBeNull();
    expect(r!.valor).toBe(30);
    expect(r!.descricao).toBe('bigpao');
  });

  it('extracts "gastei 50 no ifood"', () => {
    const r = extrairGasto('gastei 50 no ifood');
    expect(r).not.toBeNull();
    expect(r!.valor).toBe(50);
    expect(r!.descricao).toBe('ifood');
  });

  it('extracts "30,50 padaria"', () => {
    const r = extrairGasto('30,50 padaria');
    expect(r).not.toBeNull();
    expect(r!.valor).toBeCloseTo(30.5);
  });

  it('extracts "paguei 200 aluguel"', () => {
    const r = extrairGasto('paguei 200 aluguel');
    expect(r).not.toBeNull();
    expect(r!.valor).toBe(200);
  });

  it('extracts "150 conta de luz"', () => {
    const r = extrairGasto('150 conta de luz');
    expect(r).not.toBeNull();
    expect(r!.valor).toBe(150);
  });
});

describe('detectarCategoria', () => {
  it.each([
    ['ifood', 'Alimentação'],
    ['uber', 'Transporte'],
    ['farmacia', 'Saúde'],
    ['netflix', 'Lazer'],
    ['aluguel', 'Moradia'],
    ['roupa', 'Roupas'],
    ['notebook', 'Eletrônicos'],
    ['bigpao', 'Alimentação'],
  ])('"%s" → %s', (desc, expected) => {
    expect(detectarCategoria(desc)).toBe(expected);
  });
});

describe('NLP edge cases', () => {
  it('handles empty string', () => {
    expect(detectarIntencao('')).toBe('geral');
  });

  it('handles very long string', () => {
    expect(detectarIntencao('a'.repeat(1000))).toBe('geral');
  });

  it('handles special characters', () => {
    expect(detectarIntencao('!@#$%')).toBe('geral');
  });

  it('handles numbers only', () => {
    expect(detectarIntencao('12345')).toBe('geral');
  });

  it('handles mixed case "RESUMO"', () => {
    expect(detectarIntencao('RESUMO')).toBe('resumo');
  });

  it('handles "gastei 50 no mercado"', () => {
    expect(detectarIntencao('gastei 50 no mercado')).toBe('gasto');
  });

  it('extrairGasto handles value over 100000', () => {
    expect(extrairGasto('200000 carro')).toBeNull();
  });

  it('extrairGasto handles zero value', () => {
    expect(extrairGasto('0 nada')).toBeNull();
  });

  it('extrairGasto returns null for empty string', () => {
    expect(extrairGasto('')).toBeNull();
  });

  it('extrairGasto returns null for text without number', () => {
    expect(extrairGasto('comprei algo')).toBeNull();
  });

  it('detectarCategoria returns Outros for unknown', () => {
    expect(detectarCategoria('xyzabc')).toBe('Outros');
  });
});
