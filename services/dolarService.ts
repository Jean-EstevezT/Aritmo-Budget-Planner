export interface DolarRate {
    fuente: string;
    nombre: string;
    compra: number | null;
    venta: number | null;
    promedio: number;
    fechaActualizacion: string;
}

const API_URL = 'https://ve.dolarapi.com/v1/dolares';
const STORAGE_KEY = 'dolar_api_rates';

export const fetchDolarRates = async (): Promise<DolarRate[]> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch rates');
        }
        const data: DolarRate[] = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

export const getStoredRates = (): DolarRate[] | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse stored rates', e);
            return null;
        }
    }
    return null;
};

export const saveRates = (rates: DolarRate[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
};
