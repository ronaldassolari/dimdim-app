import { describe, it, expect } from 'vitest';
import { validateString, validateNumber, validateEnum, ValidationError } from '@/lib/validators';

describe('validateString', () => {
  it('accepts valid string', () => {
    expect(validateString('hello', 'name')).toBe('hello');
  });

  it('trims whitespace', () => {
    expect(validateString('  hello  ', 'name')).toBe('hello');
  });

  it('rejects empty string', () => {
    expect(() => validateString('', 'name')).toThrow(ValidationError);
  });

  it('rejects null', () => {
    expect(() => validateString(null, 'name')).toThrow(ValidationError);
  });

  it('rejects undefined', () => {
    expect(() => validateString(undefined, 'name')).toThrow(ValidationError);
  });

  it('rejects too long', () => {
    expect(() => validateString('a'.repeat(501), 'name')).toThrow(ValidationError);
  });

  it('accepts string at max length', () => {
    expect(validateString('a'.repeat(500), 'name')).toBe('a'.repeat(500));
  });

  it('rejects whitespace-only string', () => {
    expect(() => validateString('   ', 'name')).toThrow(ValidationError);
  });

  it('rejects number type', () => {
    expect(() => validateString(123, 'name')).toThrow(ValidationError);
  });

  it('respects custom maxLen', () => {
    expect(() => validateString('abcdef', 'name', 5)).toThrow(ValidationError);
  });
});

describe('validateNumber', () => {
  it('accepts valid number', () => {
    expect(validateNumber(42, 'valor')).toBe(42);
  });

  it('accepts string number', () => {
    expect(validateNumber('42', 'valor')).toBe(42);
  });

  it('rejects NaN', () => {
    expect(() => validateNumber('abc', 'valor')).toThrow(ValidationError);
  });

  it('rejects below min', () => {
    expect(() => validateNumber(-1, 'valor', 0)).toThrow(ValidationError);
  });

  it('rejects above max', () => {
    expect(() => validateNumber(1000000, 'valor', 0, 999999)).toThrow(ValidationError);
  });

  it('accepts zero when min is zero', () => {
    expect(validateNumber(0, 'valor', 0)).toBe(0);
  });

  it('accepts boundary max value', () => {
    expect(validateNumber(999999, 'valor', 0, 999999)).toBe(999999);
  });

  it('accepts decimal', () => {
    expect(validateNumber(3.14, 'valor')).toBeCloseTo(3.14);
  });
});

describe('validateEnum', () => {
  it('accepts valid enum', () => {
    expect(validateEnum('GASTO', 'tipo', ['GASTO', 'RECEITA'])).toBe('GASTO');
  });

  it('rejects invalid enum', () => {
    expect(() => validateEnum('INVALID', 'tipo', ['GASTO', 'RECEITA'])).toThrow(ValidationError);
  });

  it('rejects empty string', () => {
    expect(() => validateEnum('', 'tipo', ['GASTO', 'RECEITA'])).toThrow(ValidationError);
  });

  it('is case sensitive', () => {
    expect(() => validateEnum('gasto', 'tipo', ['GASTO', 'RECEITA'])).toThrow(ValidationError);
  });

  it('accepts second enum value', () => {
    expect(validateEnum('RECEITA', 'tipo', ['GASTO', 'RECEITA'])).toBe('RECEITA');
  });
});

describe('ValidationError', () => {
  it('is an instance of Error', () => {
    const err = new ValidationError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('has correct name', () => {
    const err = new ValidationError('test');
    expect(err.name).toBe('ValidationError');
  });

  it('has correct message', () => {
    const err = new ValidationError('campo obrigatório');
    expect(err.message).toBe('campo obrigatório');
  });
});
