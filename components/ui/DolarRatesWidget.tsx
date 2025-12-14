import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { TrendingUp, RefreshCw, WifiOff, Building2, Users } from 'lucide-react';

const DolarRatesWidget: React.FC = () => {
    const { dolarRates } = useCurrency();

    if (!dolarRates) return null;

    return (
        <div className="w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Tasas del Día (Venezuela)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Oficial */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Oficial (BCV)</p>
                            <p className="text-xl font-bold text-slate-800">Bs {dolarRates.oficial.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-5">
                        <Building2 size={60} />
                    </div>
                </div>

                {/* Paralelo */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paralelo</p>
                            <p className="text-xl font-bold text-slate-800">Bs {dolarRates.paralelo.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-5">
                        <Users size={60} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DolarRatesWidget;
