import Handlebars from 'handlebars';

let helpersRegistered = false;

function formatDateBR(value: unknown): string {
  if (!value || typeof value !== 'string') {
    return '-';
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('pt-BR');
}

function formatCurrency(value: unknown, currencyValue?: unknown): string {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  const currency = typeof currencyValue === 'string' && currencyValue.length > 0 ? currencyValue : 'BRL';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function registerHandlebarsHelpers(): void {
  if (helpersRegistered) {
    return;
  }

  Handlebars.registerHelper('formatCurrency', (value: unknown, currency: unknown) =>
    formatCurrency(value, currency),
  );
  Handlebars.registerHelper('formatDateBR', (value: unknown) => formatDateBR(value));
  Handlebars.registerHelper('default', (value: unknown, fallback: unknown) => {
    if (value === null || value === undefined || value === '') {
      return fallback ?? '';
    }

    return value;
  });
  Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value ?? null));
  Handlebars.registerHelper('concat', (...args: unknown[]) => {
    return args
      .slice(0, -1)
      .filter((item) => item !== null && item !== undefined)
      .join('');
  });

  helpersRegistered = true;
}
