import { describe, it, expect } from 'vitest';

function calculateInsightPercent(gastos: number, receitas: number): number {
  if (receitas <= 0) return 0;
  return (gastos / receitas) * 100;
}

describe('Insight Calculation', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateInsightPercent(500, 1000)).toBe(50);
    expect(calculateInsightPercent(1000, 1000)).toBe(100);
    expect(calculateInsightPercent(1500, 1000)).toBe(150);
  });

  it('should NEVER multiply by 100 twice (bug prevention)', () => {
    const result = calculateInsightPercent(800, 1000);
    expect(result).toBe(80);
    expect(result).toBeLessThan(200); // Would be 8000 if doubled
  });

  it('should handle zero receitas safely', () => {
    expect(calculateInsightPercent(500, 0)).toBe(0);
  });

  it('should handle gastos > receitas (no vermelho)', () => {
    const result = calculateInsightPercent(1500, 1000);
    expect(result).toBeGreaterThan(100);
  });
});
