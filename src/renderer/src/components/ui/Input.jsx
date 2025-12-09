import React from 'react';

const Input = ({ label, style = {}, ...props }) => {
    const defaultStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: '#ffffff',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        outline: 'none',
    };

    return (
        <div style={{ marginBottom: label ? '15px' : '0', width: style.width || '100%', flex: style.flex }}>
            {label && (
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {label}
                </label>
            )}
            <input
                style={{ ...defaultStyle, ...style, width: '100%', marginBottom: 0 }}
                {...props}
            />
        </div>
    );
};

export default Input;
