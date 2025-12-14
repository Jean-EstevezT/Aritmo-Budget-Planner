const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    auth: {
        getUsers: () => ipcRenderer.invoke('auth:getUsers'),
        login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
        register: (username, password, avatar, language) => ipcRenderer.invoke('auth:register', { username, password, avatar, language }),
        deleteUser: (username, password) => ipcRenderer.invoke('auth:deleteUser', { username, password }),
        updateLanguage: (username, language) => ipcRenderer.invoke('auth:updateLanguage', { username, language }),
    },
    db: {
        load: (username) => ipcRenderer.invoke('db:load', username),
        addTransaction: (username, transaction) => ipcRenderer.invoke('db:addTransaction', { username, transaction }),
        updateTransaction: (username, transaction) => ipcRenderer.invoke('db:updateTransaction', { username, transaction }),
        deleteTransaction: (username, id) => ipcRenderer.invoke('db:deleteTransaction', { username, id }),
        addCategory: (username, category) => ipcRenderer.invoke('db:addCategory', { username, category }),
        updateCategory: (username, category) => ipcRenderer.invoke('db:updateCategory', { username, category }),
        deleteCategory: (username, id) => ipcRenderer.invoke('db:deleteCategory', { username, id }),
        addBill: (username, bill) => ipcRenderer.invoke('db:addBill', { username, bill }),
        updateBill: (username, bill) => ipcRenderer.invoke('db:updateBill', { username, bill }),
        deleteBill: (username, id) => ipcRenderer.invoke('db:deleteBill', { username, id }),
        // Analytics
        getFinancialSummary: (username) => ipcRenderer.invoke('db:getFinancialSummary', username),
        getCategoryBreakdown: (username) => ipcRenderer.invoke('db:getCategoryBreakdown', username),
        getMonthlyHistory: (username) => ipcRenderer.invoke('db:getMonthlyHistory', username),
        // Settings
        saveSetting: (username, key, value) => ipcRenderer.invoke('db:saveSetting', { username, key, value }),
        getSetting: (username, key) => ipcRenderer.invoke('db:getSetting', { username, key }),
        // Debts
        addDebt: (username, debt) => ipcRenderer.invoke('db:addDebt', { username, debt }),
        updateDebt: (username, debt) => ipcRenderer.invoke('db:updateDebt', { username, debt }),
        deleteDebt: (username, id) => ipcRenderer.invoke('db:deleteDebt', { username, id }),
        // Recurring Rules
        addRecurringRule: (username, rule) => ipcRenderer.invoke('db:addRecurringRule', { username, rule }),
        updateRecurringRule: (username, rule) => ipcRenderer.invoke('db:updateRecurringRule', { username, rule }),
        deleteRecurringRule: (username, id) => ipcRenderer.invoke('db:deleteRecurringRule', { username, id }),
        // Savings Goals
        addSavingsGoal: (username, goal) => ipcRenderer.invoke('db:addSavingsGoal', { username, goal }),
        updateSavingsGoal: (username, goal) => ipcRenderer.invoke('db:updateSavingsGoal', { username, goal }),
        deleteSavingsGoal: (username, id) => ipcRenderer.invoke('db:deleteSavingsGoal', { username, id }),
        // Backup
        exportData: (username) => ipcRenderer.invoke('db:exportData', username),
        importData: (username) => ipcRenderer.invoke('db:importData', username),
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})
