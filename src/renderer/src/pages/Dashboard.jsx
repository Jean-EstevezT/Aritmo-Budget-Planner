import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Chart } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import * as api from '../services/api';
import { money } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Light Theme Chart Defaults
Chart.defaults.color = '#6b7280';
Chart.defaults.scale.grid.color = '#f3f4f6';
Chart.defaults.font.family = "'Inter', sans-serif";

const Dashboard = () => {
    const [timePeriod, setTimePeriod] = useState('all');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [drilldownCategory, setDrilldownCategory] = useState('');
    const [drilldownData, setDrilldownData] = useState(null);
    const [expenseCategories, setExpenseCategories] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, [timePeriod]);

    useEffect(() => {
        loadExpenseCategories();
    }, []);

    useEffect(() => {
        if (drilldownCategory) {
            loadDrilldownData(drilldownCategory);
        } else {
            setDrilldownData(null);
        }
    }, [drilldownCategory]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const res = await api.getDashboardData(timePeriod);
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadExpenseCategories = async () => {
        const cats = await api.getExpenseCategories();
        setExpenseCategories(cats);
    };

    const loadDrilldownData = async (catId) => {
        const res = await api.getMonthlyExpensesForCategory(catId);
        setDrilldownData(res);
    };

    if (loading || !data) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>
        </div>
    );

    const { summary, expensesByCategory, incomeByCategory } = data;
    const monthCount = summary.monthCount > 0 ? summary.monthCount : 1;

    // Pie Charts Data
    const createPieData = (items, label) => ({
        labels: items.map(i => i.name),
        datasets: [{
            label,
            data: items.map(i => i.total),
            backgroundColor: [
                '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#94a3b8'
            ],
            borderWidth: 1,
            borderColor: '#ffffff'
        }]
    });

    const expensePieData = createPieData(expensesByCategory, 'Expenses');
    const incomePieData = createPieData(incomeByCategory, 'Income');

    // Waterfall/Cashflow Chart Data
    const waterfallData = {
        labels: ['Income', 'Expenses', 'Savings'],
        datasets: [{
            label: 'Cash Flow',
            data: [summary.totalIncome, -summary.totalExpenses, summary.totalSavings],
            backgroundColor: [
                '#10b981', // Income (Green)
                '#ef4444', // Expense (Red)
                '#6366f1'  // Savings (Primary)
            ],
            borderRadius: 6,
        }]
    };

    // Drilldown Chart
    const drillChartData = drilldownData ? {
        labels: drilldownData.labels,
        datasets: [{
            label: 'Monthly Spending',
            data: drilldownData.values,
            backgroundColor: '#6366f1',
            borderRadius: 4
        }]
    } : null;

    const StatItem = ({ label, value, color }) => (
        <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color || 'var(--text-primary)' }}>{money(value)}</div>
        </div>
    );

    const inputStyle = {
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none'
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ marginBottom: '4px', fontSize: '1.75rem' }}>Dashboard</h1>
                    <div style={{ color: 'var(--text-secondary)' }}>Welcome back to your financial overview</div>
                </div>
                <div>
                    <select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="all">All Time</option>
                        <option value="7">Last 7 days</option>
                        <option value="15">Last 15 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 3 months</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
            </header>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Totals</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <StatItem label="Income" value={summary.totalIncome} color="var(--success-color)" />
                        <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
                        <StatItem label="Expenses" value={summary.totalExpenses} color="var(--danger-color)" />
                        <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
                        <StatItem label="Savings" value={summary.totalSavings} color="var(--primary-color)" />
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Monthly Averages</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <StatItem label="Avg Income" value={summary.totalIncome / monthCount} />
                        <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
                        <StatItem label="Avg Expenses" value={summary.totalExpenses / monthCount} />
                        <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
                        <StatItem label="Avg Savings" value={summary.totalSavings / monthCount} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Cash Flow */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Cash Flow</h3>
                    <div style={{ height: '300px' }}>
                        <Bar
                            data={waterfallData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } }
                            }}
                        />
                    </div>
                </div>

                {/* Expenses Pie */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Expenses Breakdown</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={expensePieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* Expense Drilldown */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Expense Settings</h3>
                        <select
                            value={drilldownCategory}
                            onChange={(e) => setDrilldownCategory(e.target.value)}
                            style={{ ...inputStyle, width: '200px' }}
                        >
                            <option value="">Select Category</option>
                            {expenseCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ height: '250px' }}>
                        {drillChartData ? (
                            <Bar
                                data={drillChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                Select a category to view monthly details
                            </div>
                        )}
                    </div>
                </div>

                {/* Income Pie */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Income Breakdown</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={incomePieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
