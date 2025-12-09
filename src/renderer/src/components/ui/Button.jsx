import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    // Variants: 'primary', 'secondary', 'danger', 'ghost'

    let baseStyle = {
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    let variantStyle = {};

    switch (variant) {
        case 'primary':
            variantStyle = {
                backgroundColor: 'var(--primary-color)',
                color: 'white',
            };
            break;
        case 'secondary':
            variantStyle = {
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
            };
            break;
        case 'danger':
            variantStyle = {
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                border: '1px solid #ef4444',
            };
            break;
        case 'ghost':
            variantStyle = {
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                padding: '4px',
            };
            break;
        default:
            break;
    }

    return (
        <button
            className={`${variant === 'primary' ? 'btn-primary' : ''} ${className}`}
            style={{ ...baseStyle, ...variantStyle, ...props.style }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
