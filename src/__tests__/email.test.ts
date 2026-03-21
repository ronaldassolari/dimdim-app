import { describe, it, expect } from 'vitest';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe('Email Validation', () => {
  it('should accept valid emails', () => {
    expect(emailRegex.test('user@email.com')).toBe(true);
    expect(emailRegex.test('user.name@domain.co.br')).toBe(true);
    expect(emailRegex.test('user+tag@gmail.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(emailRegex.test('invalid')).toBe(false);
    expect(emailRegex.test('@domain.com')).toBe(false);
    expect(emailRegex.test('user@')).toBe(false);
    expect(emailRegex.test('user @email.com')).toBe(false);
    expect(emailRegex.test('')).toBe(false);
  });
});
