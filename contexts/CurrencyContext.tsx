
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

  React.useEffect(() => {
    const loadRates = async () => {
      const stored = getStoredRates();
      if (stored) {
        processRates(stored);
      }
      try {
        const data = await fetchDolarRates();
        saveRates(data);
        processRates(data);
      } catch (e) {
        console.error('Failed to update dolar rates', e);
      }
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
  const formatAmount = (amountInUSD: number): string => {
    let rate = 1;
    if (displayCurrency === 'VES' && dolarRates) {
      rate = dolarRates[vesRateType];
    } else {
      rate = getGeneralRate('USD', displayCurrency);
    }

    const converted = amountInUSD * rate;
    const symbol = getCurrencySymbol(displayCurrency);

    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: displayCurrency,
      currencyDisplay: 'narrowSymbol'
    }).format(converted);
  };
  const convertInputToUSD = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'VES' && dolarRates) {
      const rate = dolarRates[vesRateType]; 
      return amount / rate;
    }
    const rate = getGeneralRate('USD', fromCurrency);
    return rate ? amount / rate : convertAmountSync(amount, fromCurrency, 'USD');
  };

  const getGeneralRate = (from: string, to: string) => {
    if (!generalRates) return convertAmountSync(1, from, to);

    const getRateFromUSD = (code: string) => {
      if (code === 'USD') return 1;
      const c = code.toLowerCase();
      return (generalRates[c] && generalRates[c].rate) ? generalRates[c].rate : 0;
    };

    const rateFrom = getRateFromUSD(from);
    const rateTo = getRateFromUSD(to);

    if (!rateFrom || !rateTo) return convertAmountSync(1, from, to);
    return rateTo / rateFrom;
  };
  const convertAmount = (amount: number, from: string, to: string): number => {
    if (from === 'VES' && dolarRates) return amount / dolarRates[vesRateType] * (to === 'USD' ? 1 : getGeneralRate('USD', to));
    if (to === 'VES' && dolarRates) return convertAmount(amount, from, 'USD') * dolarRates[vesRateType];
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
