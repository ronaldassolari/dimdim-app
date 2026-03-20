import { describe, it, expect } from 'vitest';
import { calcularValor, melhorOpcao, alertaVencimento, PROGRAMAS } from '@/lib/pontos-config';

describe('calcularValor', () => {
  it('Livelo produto = 0.015/pt', () => {
    expect(calcularValor(50000, 'Livelo', 'produto')).toBe(750);
  });
  it('Livelo viagem = 0.017/pt', () => {
    expect(calcularValor(50000, 'Livelo', 'viagem')).toBe(850);
  });
  it('Livelo cashback = 0.013/pt', () => {
    expect(calcularValor(50000, 'Livelo', 'cashback')).toBe(650);
  });
  it('Smiles viagem = 0.025/pt', () => {
    expect(calcularValor(100000, 'Smiles', 'viagem')).toBe(2500);
  });
  it('unknown programa falls back to 0.01', () => {
    expect(calcularValor(1000, 'Desconhecido', 'produto')).toBe(10);
  });
});

describe('melhorOpcao', () => {
  it('Livelo best is viagem', () => {
    const r = melhorOpcao(50000, 'Livelo');
    expect(r.tipo).toBe('viagem');
    expect(r.valor).toBe(850);
  });
  it('Smiles best is viagem', () => {
    const r = melhorOpcao(10000, 'Smiles');
    expect(r.tipo).toBe('viagem');
  });
});

describe('alertaVencimento', () => {
  it('< 30 dias = vermelho', () => {
    expect(alertaVencimento(15)).toBe('vermelho');
  });
  it('30-89 dias = amarelo', () => {
    expect(alertaVencimento(60)).toBe('amarelo');
  });
  it('>= 90 dias = verde', () => {
    expect(alertaVencimento(120)).toBe('verde');
  });
});

describe('PROGRAMAS config', () => {
  it('has at least 10 programs', () => {
    expect(Object.keys(PROGRAMAS).length).toBeGreaterThanOrEqual(10);
  });
  it('all programs have positive rates', () => {
    for (const [, config] of Object.entries(PROGRAMAS)) {
      expect(config.taxa_produto).toBeGreaterThan(0);
      expect(config.taxa_viagem).toBeGreaterThan(0);
      expect(config.taxa_cashback).toBeGreaterThan(0);
    }
  });
  it('viagem rate >= produto rate for all programs', () => {
    for (const [, config] of Object.entries(PROGRAMAS)) {
      expect(config.taxa_viagem).toBeGreaterThanOrEqual(config.taxa_produto);
    }
  });
});
