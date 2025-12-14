
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SUPPORTED_CURRENCIES, convertAmountSync } from '../services/currencyService';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (code: string) => void;
  formatAmount: (amountInUSD: number) => string;
  convertInputToUSD: (amount: number, fromCurrency: string) => number;
  getCurrencySymbol: (code: string) => string;
  vesRateType: 'oficial' | 'paralelo';
  setVesRateType: (type: 'oficial' | 'paralelo') => void;
  dolarRates: { oficial: number; paralelo: number } | null;
  refreshDolarRates: () => Promise<void>;
  convertAmount: (amount: number, from: string, to: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

import { fetchDolarRates, getStoredRates, saveRates } from '../services/dolarService';
import { fetchGeneralRates } from '../services/currencyService';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [vesRateType, setVesRateType] = useState<'oficial' | 'paralelo'>('oficial');
  const [dolarRates, setDolarRates] = useState<{ oficial: number; paralelo: number } | null>(null);
  const [generalRates, setGeneralRates] = useState<any>(null);

  // Load Dolar Rates & General Rates
  React.useEffect(() => {
    const loadRates = async () => {
      // 1. Try Cache for VES
      const stored = getStoredRates();
      if (stored) {
        processRates(stored);
      }

      // 2. Fetch Fresh
      try {
        const data = await fetchDolarRates();
        saveRates(data);
        processRates(data);
      } catch (e) {
        console.error('Failed to update dolar rates', e);
      }

      // 3. Fetch General Rates
      try {
        const data = await fetchGeneralRates();
        if (data) setGeneralRates(data);
      } catch (e) { console.error('Failed to fetch general rates', e); }
    };

    const processRates = (data: any[]) => {
      const oficial = data.find(r => r.fuente === 'oficial')?.promedio;
      const paralelo = data.find(r => r.fuente === 'paralelo')?.promedio;
      if (oficial && paralelo) {
        setDolarRates({ oficial, paralelo });
      }
    };

    loadRates();
  }, []);

  const refreshDolarRates = async () => {
    try {
      const vesData = await fetchDolarRates();
      saveRates(vesData);
      const oficial = vesData.find(r => r.fuente === 'oficial')?.promedio;
      const paralelo = vesData.find(r => r.fuente === 'paralelo')?.promedio;
      if (oficial && paralelo) setDolarRates({ oficial, paralelo });

      const genData = await fetchGeneralRates();
      if (genData) setGeneralRates(genData);
    } catch (e) {
      console.error('Manual refresh failed', e);
    }
  };

  const getCurrencySymbol = (code: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || '$';
  };

  // Takes an amount in USD (stored in DB) and formats it to the User's selected display currency
  const formatAmount = (amountInUSD: number): string => {
    let rate = 1;

    // Custom logic for VES if available
    if (displayCurrency === 'VES' && dolarRates) {
      rate = dolarRates[vesRateType];
    } else {
      // Dynamic General Rates
      rate = getGeneralRate('USD', displayCurrency);
    }

    const converted = amountInUSD * rate;
    const symbol = getCurrencySymbol(displayCurrency);

    return new Intl.NumberFormat('es-VE', { // Using es-VE for better formatting of VES
      style: 'currency',
      currency: displayCurrency,
      currencyDisplay: 'narrowSymbol'
    }).format(converted);
  };

  // Takes an input from a transaction form (e.g., 500 VES) and converts it to USD for storage
  const convertInputToUSD = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'VES' && dolarRates) {
      // Convert VES to USD using the selected rate type (usually people think in parallel, but let's use the same pref or maybe parallel by default? User said "utiliza tanto el oficial como paralelo")
      // If I am typing 500 VES, how much USD is it? 500 / Rate
      const rate = dolarRates[vesRateType]; // Using the preferred rate for consistency
      return amount / rate;
    }
    // Dynamic General Rates
    const rate = getGeneralRate('USD', fromCurrency); // Rate is USD -> From
    return rate ? amount / rate : convertAmountSync(amount, fromCurrency, 'USD');
  };

  const getGeneralRate = (from: string, to: string) => {
    if (!generalRates) return convertAmountSync(1, from, to); // Fallback to mock

    const getRateFromUSD = (code: string) => {
      if (code === 'USD') return 1;
      const c = code.toLowerCase();
      // FloatRates structure: { "eur": { "rate": 0.95, ... }, ... } relative to USD (base)
      return (generalRates[c] && generalRates[c].rate) ? generalRates[c].rate : 0;
    };

    const rateFrom = getRateFromUSD(from);
    const rateTo = getRateFromUSD(to);

    if (!rateFrom || !rateTo) return convertAmountSync(1, from, to); // Fallback
    return rateTo / rateFrom;
  };

  // Helper for components to convert using live rates
  const convertAmount = (amount: number, from: string, to: string): number => {
    // VES handling
    if (from === 'VES' && dolarRates) return amount / dolarRates[vesRateType] * (to === 'USD' ? 1 : getGeneralRate('USD', to));
    if (to === 'VES' && dolarRates) return convertAmount(amount, from, 'USD') * dolarRates[vesRateType];

    // General handling
    const rate = getGeneralRate(from, to);
    return amount * rate;
  };

  return (
    <CurrencyContext.Provider value={{
      displayCurrency,
      setDisplayCurrency,
      formatAmount,
      convertInputToUSD,
      getCurrencySymbol,
      vesRateType,
      setVesRateType,
      dolarRates,
      refreshDolarRates,
      convertAmount
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
