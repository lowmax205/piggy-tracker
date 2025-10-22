import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(weekOfYear);

type CurrencyFormatterOptions = {
  currency?: string;
  locale?: string;
};

export type CurrencyConfig = {
  code: string;
  symbol: string;
  name: string;
  locale?: string;
};

// Popular currency configurations
export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
];

const DEFAULT_CURRENCY = 'USD';

export const getCurrencyConfig = (code: string): CurrencyConfig | undefined => {
  return CURRENCIES.find((c) => c.code === code);
};

export const formatCurrency = (
  amountCents: number,
  { currency = DEFAULT_CURRENCY, locale }: CurrencyFormatterOptions = {},
) => {
  const currencyConfig = getCurrencyConfig(currency);
  const effectiveLocale = locale || currencyConfig?.locale || 'en-US';
  
  return new Intl.NumberFormat(effectiveLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
};

export const formatNumber = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);

export const formatDateTime = (value: Date | string, formatTemplate = 'LLL', locale?: string) => {
  const date = dayjs(value);
  return locale ? date.locale(locale).format(formatTemplate) : date.format(formatTemplate);
};

export const formatDate = (value: Date | string, locale?: string) => formatDateTime(value, 'L', locale);

export const formatRelativeTime = (value: Date | string, locale?: string) => {
  const date = dayjs(value);
  return locale ? date.locale(locale).fromNow() : date.fromNow();
};

export const getMonthToDateRange = (reference = new Date()) => {
  const start = dayjs(reference).startOf('month').toDate();
  const end = dayjs(reference).endOf('day').toDate();
  return { start, end };
};

export const isSameWeek = (a: Date, b: Date) => dayjs(a).week() === dayjs(b).week();
