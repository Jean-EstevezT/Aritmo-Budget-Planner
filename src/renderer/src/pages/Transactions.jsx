import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import { money } from '../utils/format';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Transactions = ({ type }) => {
    const isExpense = type !== 'income';
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [catId, setCatId] = useState('');

    useEffect(() => {
        loadData();
    }, [type]);

    const loadData = async () => {
        try {
            const [txs, cats] = await Promise.all([
                isExpense ? api.getExpenses() : api.getIncome(),
                isExpense ? api.getExpenseCategories() : api.getIncomeCategories()
            ]);
            setTransactions(txs);
            setCategories(cats);

            // Default category
            if (cats.length > 0) setCatId(cats[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!catId) return alert('Please select a category');

        try {
            const payload = {
                date,
                amount: parseFloat(amount),
                category_id: catId,
                notes: '' // Notes field is removed from the form, but backend might still expect it
            };
            if (isExpense) payload.description = desc;
            else payload.source = desc;

            if (isExpense) await api.addExpense(payload);
            else await api.addIncome(payload);

            setDesc('');
            setAmount('');
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.deleteTransaction(isExpense ? 'expenses' : 'income', id);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '24px' }}>{isExpense ? 'Expenses' : 'Income'}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Add Form */}
                <Card title={`Add ${isExpense ? 'Expense' : 'Income'}`}>
                    <form onSubmit={handleAdd}>
                        <Input
                            type="date"
                            label="Date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />

                        <Input
                            label={isExpense ? 'Description' : 'Source'}
                            placeholder={isExpense ? 'e.g. Starbucks' : 'e.g. Salary'}
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            required
                        />

                        <Input
                            type="number"
                            label="Amount"
                            placeholder="0.00"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                        />

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category</label>
                            <select
                                value={catId}
                                onChange={e => setCatId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: '#ffffff',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    fontSize: '0.95rem'
                                }}
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <Button type="submit" style={{ width: '100%', marginTop: '8px' }}>
                            Add Transaction
                        </Button>
                    </form>
                </Card>

                {/* List */}
                <Card title="Recent Transactions">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{isExpense ? 'Description' : 'Source'}</th>
                                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Category</th>
                                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}> </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '14px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{isExpense ? t.description : t.source}</td>
                                    <td style={{ padding: '14px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>{money(t.amount)}</td>
                                    <td style={{ padding: '14px 12px' }}>
                                        <span style={{
                                            backgroundColor: '#f3f4f6', color: '#374151',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem'
                                        }}>
                                            {t.category_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDelete(t.id)}
                                            title="Delete"
                                        >
                                            🗑️
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found. Add one above!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
};

export default Transactions;
