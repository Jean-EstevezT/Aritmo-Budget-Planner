export interface ElectronAPI {
    auth: {
        getUsers: () => Promise<Array<{ username: string; avatar?: string }>>;
        login: (username: string, password: string) => Promise<{ success: boolean; user?: { username: string; avatar?: string; language?: 'en' | 'es' } }>;
        register: (username: string, password: string, avatar?: string, language?: string) => Promise<{ success: boolean; message?: string }>;
        deleteUser: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
        updateLanguage: (username: string, language: string) => Promise<{ success: boolean }>;
    };
    db: {
        load: (username: string) => Promise<any>;
        addTransaction: (username: string, transaction: any) => Promise<boolean>;
        updateTransaction: (username: string, transaction: any) => Promise<boolean>;
        deleteTransaction: (username: string, id: string) => Promise<boolean>;
        addCategory: (username: string, category: any) => Promise<boolean>;
        updateCategory: (username: string, category: any) => Promise<boolean>;
        deleteCategory: (username: string, id: string) => Promise<boolean>;
        addBill: (username: string, bill: any) => Promise<boolean>;
        updateBill: (username: string, bill: any) => Promise<boolean>;
        deleteBill: (username: string, id: string) => Promise<boolean>;

        getFinancialSummary: (username: string) => Promise<{ totalIncome: number, totalExpense: number, balance: number }>;
        getCategoryBreakdown: (username: string) => Promise<{ name: string, color: string, value: number }[]>;
        getMonthlyHistory: (username: string) => Promise<{ date: string, type: 'income' | 'expense', amount: number }[]>;

        saveSetting: (username: string, key: string, value: string) => Promise<boolean>;
        getSetting: (username: string, key: string) => Promise<string | null>;

        addDebt: (username: string, debt: any) => Promise<boolean>;
        updateDebt: (username: string, debt: any) => Promise<boolean>;
        deleteDebt: (username: string, id: string) => Promise<boolean>;

        addRecurringRule: (username: string, rule: any) => Promise<boolean>;
        updateRecurringRule: (username: string, rule: any) => Promise<boolean>;
        deleteRecurringRule: (username: string, id: string) => Promise<boolean>;

        addSavingsGoal: (username: string, goal: any) => Promise<boolean>;
        updateSavingsGoal: (username: string, goal: any) => Promise<boolean>;
        deleteSavingsGoal: (username: string, id: string) => Promise<boolean>;

        exportData: (username: string) => Promise<{ success: boolean; filePath?: string; message?: string }>;
        importData: (username: string) => Promise<{ success: boolean; message?: string }>;
    };
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
