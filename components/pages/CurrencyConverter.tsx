import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Coins, TrendingUp } from 'lucide-react';
import { getExchangeRate, SUPPORTED_CURRENCIES, convertAmountSync } from '../../services/currencyService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';




const CurrencyConverter: React.FC = () => {
  const { dolarRates, convertAmount } = useCurrency();
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('EUR');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [vesDualRates, setVesDualRates] = useState<{ bcv: number, par: number } | null>(null);

  // For Rates List
  const [baseRateCurr, setBaseRateCurr] = useState('USD');

  const { t } = useLanguage();

  const fetchRate = async () => {
    setLoading(true);

    // Special handling for VES Dual Display
    if (dolarRates && (fromCurr === 'VES' || toCurr === 'VES')) {
      // We want to calculate BOTH rates for display
      let bcvRate = 0;
      let parRate = 0;

      if (toCurr === 'VES') {
        // Target is VES. 
        // Rate = (Unit of From -> USD) * (USD -> VES)
        // If From is USD: Rate = USD -> VES
        // If From is Other: Rate = (Other -> USD) * (USD -> VES)

        const fromToUsd = convertAmount(1, fromCurr, 'USD');
        bcvRate = fromToUsd * dolarRates.oficial;
        parRate = fromToUsd * dolarRates.paralelo;

        setVesDualRates({ bcv: bcvRate, par: parRate });

        // Set 'rate' to preferred/parallel for the main big number just in case, or we hide it
        setRate(parRate);

      } else if (fromCurr === 'VES') {
        // Source is VES.
        // Rate = (1 VES -> USD) * (USD -> Target)
        // 1 VES (BCV) = 1 / Oficial_USD_VES
        // 1 VES (PAR) = 1 / Paralelo_USD_VES

        const usdToTarget = convertAmount(1, 'USD', toCurr);
        bcvRate = (1 / dolarRates.oficial) * usdToTarget;
        parRate = (1 / dolarRates.paralelo) * usdToTarget;

        setVesDualRates({ bcv: bcvRate, par: parRate });
        setRate(parRate);
      }
      setLoading(false);
      return;
    }

    // Normal handling
    setVesDualRates(null);
    const r = await getExchangeRate(fromCurr, toCurr);
    setRate(r);
    setLoading(false);
  };

  useEffect(() => {
    fetchRate();
  }, [fromCurr, toCurr]);

  const convertedAmount = rate && amount ? (parseFloat(amount) * rate).toFixed(2) : '---';

  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">{t('curr.title')}</h2>
          <p className="text-slate-500">{t('curr.subtitle')}</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-50 opacity-50 z-0 pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">{t('curr.amount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* From Select */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-2">{t('curr.from')}</label>
                <select
                  value={fromCurr}
                  onChange={(e) => setFromCurr(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                className="mt-6 p-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 hover:rotate-180 transition-all duration-300"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>

              {/* To Select */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-2">{t('curr.to')}</label>
                <select
                  value={toCurr}
                  onChange={(e) => setToCurr(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Result Area */}
            <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-slate-400 text-sm mb-1">
                  {amount} {fromCurr} =
                </p>

                {vesDualRates ? (
                  <div className="flex flex-col gap-2 justify-center items-center">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">BCV</span>
                      <h3 className="text-2xl font-bold tracking-tight">
                        {(parseFloat(amount || '0') * vesDualRates.bcv).toFixed(2)} {toCurr}
                      </h3>
                    </div>
                    <div className="w-16 h-px bg-slate-700 my-1"></div>
                    <div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Paralelo</span>
                      <h3 className="text-4xl font-bold tracking-tight">
                        {(parseFloat(amount || '0') * vesDualRates.par).toFixed(2)} {toCurr}
                      </h3>
                    </div>
                  </div>
                ) : (
                  <h3 className="text-4xl font-bold tracking-tight">
                    {loading ? t('curr.calculating') : `${convertedAmount} ${toCurr}`}
                  </h3>
                )}

                {!vesDualRates && rate && !loading && (
                  <p className="text-emerald-400 text-xs mt-2 font-medium">
                    1 {fromCurr} = {rate} {toCurr} • {t('curr.marketRate')}
                  </p>
                )}
              </div>
              <Coins className="absolute bottom-4 right-4 text-emerald-500/20 w-24 h-24 transform rotate-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Exchange Rates Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t('curr.liveRates')}</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">{t('curr.base')}:</span>
            <select
              value={baseRateCurr}
              onChange={(e) => setBaseRateCurr(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Add VES Widget here if relevant or keep below? User asked "en la pestaña de conversion donde esta bs" */}
          {/* I'll put the widget at the bottom and keep this list generic. */}

          {SUPPORTED_CURRENCIES.filter(c => c.code !== baseRateCurr).map(currency => {
            if (currency.code === 'VES' && dolarRates) {
              // Dual display for VES
              // Rel to Base
              const baseToUsd = convertAmount(1, baseRateCurr, 'USD');
              const bcvRate = baseToUsd * dolarRates.oficial;
              const parRate = baseToUsd * dolarRates.paralelo;

              return (
                <div key={currency.code} className="p-4 rounded-xl border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all bg-emerald-50/30 group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700">{currency.code}</span>
                    <span className="text-xs text-slate-400">{currency.symbol}</span>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 mr-2">BCV</span>
                      <span className="text-md font-bold text-emerald-600">{bcvRate.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 mr-2">PAR</span>
                      <span className="text-md font-bold text-amber-600">{parRate.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-2">{currency.name}</p>
                </div>
              );
            }

            // Calculate rate relative to base
            const rate = convertAmount(1, baseRateCurr, currency.code);

            return (
              <div key={currency.code} className="p-4 rounded-xl border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all bg-slate-50/50 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">{currency.code}</span>
                  <span className="text-xs text-slate-400">{currency.symbol}</span>
                </div>
                <p className="text-lg font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">{rate.toFixed(2)}</p>
                <p className="text-xs text-slate-400 truncate">{currency.name}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dolar Widget */}
    </div>
  );
};

export default CurrencyConverter;
