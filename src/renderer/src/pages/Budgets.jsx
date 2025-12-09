import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import { money } from '../utils/format';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Budgets = () => {
    const [expenseBudgets, setExpenseBudgets] = useState([]);
    const [incomeBudgets, setIncomeBudgets] = useState([]);
    const [editing, setEditing] = useState(null); // { type: 'expense'|'income', categoryId, currentTarget, categoryName }

    useEffect(() => {
        loadBudgets();
    }, []);

    const loadBudgets = async () => {
        try {
            const [ex, inc] = await Promise.all([
                api.getExpenseBudgetData(),
                api.getIncomeBudgetData()
            ]);
            setExpenseBudgets(ex);
            setIncomeBudgets(inc);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (item, type) => {
        setEditing({
            type,
            categoryId: item.id,
            currentTarget: item.budget_target,
            categoryName: item.name
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.updateBudgetTarget(editing.type, editing.categoryId, parseFloat(editing.currentTarget));
            setEditing(null);
            await loadBudgets();
        } catch (err) {
            console.error(err);
        }
    };

    const renderTable = (data, type) => (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
            <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Budget Target</th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actual Monthly Avg.</th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Difference</th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => {
                    const monthlyAvg = item.monthly_avg || 0;
                    const diff = type === 'expense'
                        ? item.budget_target - monthlyAvg
                        : monthlyAvg - item.budget_target;
                    const diffColor = diff > 0 ? 'var(--success-color)' : (diff < 0 ? 'var(--danger-color)' : 'var(--text-secondary)');

                    return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</td>
                            <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{money(item.budget_target)}</td>
                            <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{money(monthlyAvg)}</td>
                            <td style={{ padding: '12px', color: diffColor, fontWeight: 'bold' }}>{money(diff)}</td>
                            <td style={{ padding: '12px' }}>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleEdit(item, type)}
                                    title="Edit Budget"
                                >
                                    ✏️
                                </Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div>
            <h1 style={{ marginBottom: '24px' }}>Budgets</h1>

            <Card title="Expense Budget Targets" style={{ marginBottom: '24px' }}>
                {renderTable(expenseBudgets, 'expense')}
            </Card>

            <Card title="Income Budget Targets">
                {renderTable(incomeBudgets, 'income')}
            </Card>

            {/* Edit Modal */}
            {editing && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card title={`Edit Budget for ${editing.categoryName}`} style={{ width: '400px', boxShadow: 'var(--shadow-lg)' }}>
                        <form onSubmit={handleSave}>
                            <Input
                                type="number"
                                label="Target Amount"
                                autoFocus
                                value={editing.currentTarget || ''}
                                onChange={e => setEditing({ ...editing, currentTarget: e.target.value })}
                                step="0.01"
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setEditing(null)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Budgets;
