import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Settings = () => {
    const [expenseCats, setExpenseCats] = useState([]);
    const [incomeCats, setIncomeCats] = useState([]);
    const [newExpenseCat, setNewExpenseCat] = useState('');
    const [newIncomeCat, setNewIncomeCat] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const [ex, inc] = await Promise.all([
            api.getExpenseCategories(),
            api.getIncomeCategories()
        ]);
        setExpenseCats(ex);
        setIncomeCats(inc);
    };

    const handleAdd = async (type, name) => {
        if (!name.trim()) return;
        try {
            if (type === 'expense') await api.addExpenseCategory(name);
            else await api.addIncomeCategory(name);

            if (type === 'expense') setNewExpenseCat('');
            else setNewIncomeCat('');

            loadCategories();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Delete this category? Transactions associated with it might lose their category reference.')) return;
        try {
            if (type === 'expense') await api.deleteExpenseCategory(id);
            else await api.deleteIncomeCategory(id);
            loadCategories();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm('ARE YOU SURE? This will wipe ALL transactions, budgets and settings!')) return;
        try {
            await api.clearDatabase();
            alert('Database cleared!');
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const renderCategoryList = (list, type) => (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
            {list.map(c => (
                <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 8px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</span>
                    <Button
                        variant="ghost"
                        onClick={() => handleDelete(type, c.id)}
                        title="Delete Category"
                    >
                        🗑️
                    </Button>
                </li>
            ))}
        </ul>
    );

    return (
        <div>
            <h1 style={{ marginBottom: '24px' }}>Settings</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <Card title="Expense Categories">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <Input
                            placeholder="New category..."
                            value={newExpenseCat}
                            onChange={e => setNewExpenseCat(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button onClick={() => handleAdd('expense', newExpenseCat)}>Add</Button>
                    </div>
                    {renderCategoryList(expenseCats, 'expense')}
                </Card>

                <Card title="Income Categories">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <Input
                            placeholder="New category..."
                            value={newIncomeCat}
                            onChange={e => setNewIncomeCat(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button onClick={() => handleAdd('income', newIncomeCat)}>Add</Button>
                    </div>
                    {renderCategoryList(incomeCats, 'income')}
                </Card>
            </div>

            <Card
                title="Danger Zone"
                style={{ borderColor: 'var(--danger-color)' }}
            >
                <div style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Delete all data in the local database. This action is irreversible.
                </div>
                <Button
                    variant="danger"
                    onClick={handleClearDatabase}
                >
                    🗑️ Clear entire database
                </Button>
            </Card>

            <Card title="About Developer" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Jean Estevez</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            <a href="https://github.com/Jean-EstevezT" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                                https://github.com/Jean-EstevezT
                            </a>
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>ctarriba9@gmail.com</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Settings;
