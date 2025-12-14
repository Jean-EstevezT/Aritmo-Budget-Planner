
import { Transaction, Category } from '../types/index';

export const exportToExcel = (transactions: Transaction[], categories: Category[], filename: string) => {
    // Simple CSV export for now
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Status'];
    const rows = transactions.map(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return [
            t.date,
            `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
            t.amount,
            t.type,
            category ? `"${category.name}"` : 'Unknown',
            t.status
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generatePDFReport = (transactions: Transaction[]) => {
    // Placeholder for PDF generation
    console.log("PDF Report generation not yet implemented");
    alert("PDF generation coming soon!");
};
