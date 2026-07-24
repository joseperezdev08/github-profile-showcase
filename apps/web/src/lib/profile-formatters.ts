const numberFormatter = new Intl.NumberFormat('es-MX');
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const periodFormatter = new Intl.DateTimeFormat('es-MX', {
  month: 'short',
  year: 'numeric',
});
const yearFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatPeriod(from: string, to: string): string {
  return `${periodFormatter.format(new Date(from))} — ${periodFormatter.format(new Date(to))}`;
}

export function accountYear(value: string): string {
  return yearFormatter.format(new Date(value));
}
