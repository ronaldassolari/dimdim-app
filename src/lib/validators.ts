export function validateString(value: unknown, field: string, maxLen = 500): string {
  if (!value || typeof value !== 'string') throw new ValidationError(`${field} é obrigatório`);
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new ValidationError(`${field} não pode ser vazio`);
  if (trimmed.length > maxLen) throw new ValidationError(`${field} muito longo (máximo ${maxLen} caracteres)`);
  return trimmed;
}

export function validateNumber(value: unknown, field: string, min = 0, max = 999999): number {
  const num = Number(value);
  if (isNaN(num)) throw new ValidationError(`${field} deve ser um número`);
  if (num < min) throw new ValidationError(`${field} deve ser maior que ${min}`);
  if (num > max) throw new ValidationError(`${field} deve ser menor que ${max}`);
  return num;
}

export function validateEnum<T extends string>(value: unknown, field: string, allowed: T[]): T {
  if (!allowed.includes(value as T)) throw new ValidationError(`${field} deve ser: ${allowed.join(', ')}`);
  return value as T;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
