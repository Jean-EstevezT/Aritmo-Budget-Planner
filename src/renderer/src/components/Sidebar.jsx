import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Wallet, Money, HandCoins, ChartPieSlice, Gear } from '@phosphor-icons/react';

const Sidebar = () => {
    const linkStyle = ({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        margin: '4px 12px',
        borderRadius: 'var(--radius-md)',
        color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
        textDecoration: 'none',
        backgroundColor: isActive ? '#e0e7ff' : 'transparent', // Indigo-50
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.2s',
    });

    return (
        <aside style={{ width: '260px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/logo192.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Aritmo
                </div>
            </div>
            <nav style={{ flex: 1, padding: '0 8px' }}>
                <div style={{ padding: '0 20px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Menu
                </div>
                <NavLink to="/dashboard" style={linkStyle}>
                    <House size={20} weight={({ isActive }) => isActive ? "fill" : "regular"} style={{ marginRight: '12px' }} />
                    Dashboard
                </NavLink>
                <NavLink to="/expenses" style={linkStyle}>
                    <Wallet size={20} weight={({ isActive }) => isActive ? "fill" : "regular"} style={{ marginRight: '12px' }} />
                    Expenses
                </NavLink>
                <NavLink to="/income" style={linkStyle}>
                    <Money size={20} weight={({ isActive }) => isActive ? "fill" : "regular"} style={{ marginRight: '12px' }} />
                    Income
                </NavLink>
                <NavLink to="/budgets" style={linkStyle}>
                    <ChartPieSlice size={20} weight={({ isActive }) => isActive ? "fill" : "regular"} style={{ marginRight: '12px' }} />
                    Budgets
                </NavLink>

                <div style={{ padding: '24px 20px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    System
                </div>
                <NavLink to="/settings" style={linkStyle}>
                    <Gear size={20} weight={({ isActive }) => isActive ? "fill" : "regular"} style={{ marginRight: '12px' }} />
                    Settings
                </NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;
