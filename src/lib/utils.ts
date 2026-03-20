export function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatInputMoney(value: string): string {
  const num = value.replace(/\D/g, '');
  const cents = parseInt(num || '0', 10);
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function parseInputMoney(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}
