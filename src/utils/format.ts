// utils/format.ts

/**
 * Formate un prix en FCFA (XAF) pour le Cameroun
 * Ex: 1500 → "1 500 FCFA"
 */
export const formatPrice = (
  amount: number | string | undefined,
  options: { currency?: string; locale?: string } = {}
): string => {
  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return '—';
  }

  const { currency = 'XAF', locale = 'fr-CM' } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(numericAmount)
    .replace('FCFA', 'FCFA'); // Garde le format local
};

/**
 * Formate une date courte pour l'affichage
 * Ex: "2024-01-15T12:00:00Z" → "15 janv. 2024"
 */
export const formatDate = (
  date: string | Date | undefined,
  locale: string = 'fr-CM'
): string => {
  if (!date) return '—';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

/**
 * Formate une heure
 * Ex: "14:30" → "14h30"
 */
export const formatTime = (time: string | undefined): string => {
  if (!time) return '—';
  return time.replace(':', 'h') + (time.length === 5 ? '' : '0');
};

/**
 * Tronque un texte avec ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Formate un nombre avec séparateur de milliers (sans devise).
 * Fallback sûr si toLocaleString() crash (certains Android WebView).
 * Ex: 1500 → "1 500"
 */
export const safeFormatNumber = (n: number | null | undefined): string => {
  const value = n ?? 0;
  try {
    return value.toLocaleString('fr-FR');
  } catch {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
};