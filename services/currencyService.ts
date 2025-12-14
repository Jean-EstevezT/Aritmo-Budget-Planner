
// Using a reliable free public API for demo purposes. 
// In a production app, this would likely be a paid service or backend proxy.

const BASE_URL = 'http://www.floatrates.com/daily/usd.json';

// Fallback rates relative to USD (approximate values for demo)
// Used when the public API does not support the specific currency pair (e.g. LATAM currencies)
export const MOCK_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  COP: 3900.50,
  VES: 36.50,
  MXN: 17.05,
  ARS: 850.00,
  BRL: 4.95,
  JPY: 150.10,
  AUD: 1.52,
  CAD: 1.35,
  CHF: 0.88,
  CNY: 7.19,
  INR: 83.12,
};

export const getExchangeRate = async (from: string, to: string): Promise<number | null> => {
  if (from === to) return 1;

  try {
    // using floatrates.com (daily USD rates)
    const response = await fetch(BASE_URL);

    if (!response.ok) {
      throw new Error('Currency pair not supported by public API');
    }

    const data = await response.json();

    // FloatRates structure: { "eur": { "rate": 0.95, ... }, ... } relative to USD (base)
    // To get Rate(From -> To):
    // 1. Get USD -> From rate
    // 2. Get USD -> To rate
    // Rate = (USD -> To) / (USD -> From)

    // Helper to get rate from USD
    const getRateFromUSD = (currency: string): number => {
      if (currency === 'USD') return 1;
      const code = currency.toLowerCase();
      if (data[code] && data[code].rate) {
        return data[code].rate;
      }
      return 0; // Not found
    };

    const rateFrom = getRateFromUSD(from);
    const rateTo = getRateFromUSD(to);

    if (!rateFrom || !rateTo) {
      // Fallback to mock if one is missing in the API response (e.g. sometimes minor ones missing)
      console.warn(`Rate not found for ${from} or ${to} in API response, falling back.`);
      throw new Error('Rate not found');
    }

    return rateTo / rateFrom;

  } catch (error) {
    // Quietly handle the error by falling back to mock rates

    if (MOCK_RATES[from] && MOCK_RATES[to]) {
      // Calculate cross rate via USD
      // Rate = (USD -> To) / (USD -> From)
      const rate = MOCK_RATES[to] / MOCK_RATES[from];
      return parseFloat(rate.toFixed(4));
    }

    return null;
  }
};

// Synchronous helper for instant UI updates using mock rates (since we want the UI to feel snappy)
export const convertAmountSync = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  const rate = (MOCK_RATES[to] || 1) / (MOCK_RATES[from] || 1);
  return amount * rate;
};

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

export const fetchGeneralRates = async (): Promise<any> => {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch general rates');
    return await response.json();
  } catch (error) {
    console.error('Error fetching general rates:', error);
    return null;
  }
};
