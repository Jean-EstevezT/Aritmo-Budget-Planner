import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';

const App = () => {
    return (
        <Router>
            <div style={{ display: 'flex', height: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: 'var(--bg-color)' }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/expenses" element={<Transactions type="expense" />} />
                        <Route path="/income" element={<Transactions type="income" />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
