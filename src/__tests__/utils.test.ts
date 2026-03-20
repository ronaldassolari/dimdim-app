import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate, formatInputMoney, parseInputMoney } from '@/lib/utils';

describe('formatMoney', () => {
  it('formats zero', () => {
    expect(formatMoney(0)).toContain('0,00');
  });

  it('formats positive value', () => {
    const result = formatMoney(1234.56);
    expect(result).toContain('1.234,56');
  });

  it('formats negative value', () => {
    const result = formatMoney(-50);
    expect(result).toContain('50,00');
  });

  it('formats large number', () => {
    const result = formatMoney(1000000);
    expect(result).toContain('1.000.000,00');
  });

  it('formats decimal value', () => {
    const result = formatMoney(9.99);
    expect(result).toContain('9,99');
  });

  it('formats small decimal', () => {
    const result = formatMoney(0.01);
    expect(result).toContain('0,01');
  });
});

describe('formatDate', () => {
  it('formats standard date', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024');
  });

  it('returns empty for empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('formats end of year', () => {
    expect(formatDate('2024-12-31')).toBe('31/12/2024');
  });

  it('formats start of year', () => {
    expect(formatDate('2024-01-01')).toBe('01/01/2024');
  });
});

describe('formatInputMoney', () => {
  it('formats empty string as zero', () => {
    expect(formatInputMoney('')).toBe('0,00');
  });

  it('formats digits as cents', () => {
    expect(formatInputMoney('1050')).toBe('10,50');
  });

  it('formats single digit', () => {
    expect(formatInputMoney('5')).toBe('0,05');
  });

  it('strips non-digit characters', () => {
    expect(formatInputMoney('R$ 25,00')).toBe('25,00');
  });

  it('formats large value', () => {
    expect(formatInputMoney('100000')).toBe('1000,00');
  });
});

describe('parseInputMoney', () => {
  it('parses comma-separated value', () => {
    expect(parseInputMoney('10,50')).toBe(10.5);
  });

  it('parses value with dot thousand separator', () => {
    expect(parseInputMoney('1.000,00')).toBe(1000);
  });

  it('returns 0 for empty string', () => {
    expect(parseInputMoney('')).toBe(0);
  });

  it('returns 0 for non-numeric', () => {
    expect(parseInputMoney('abc')).toBe(0);
  });

  it('parses integer value', () => {
    expect(parseInputMoney('100')).toBe(100);
  });
});
