import React from 'react';

const Card = ({ children, title, className = '', style = {}, ...props }) => {
    return (
        <div className={`card ${className}`} style={style} {...props}>
            {title && <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{title}</h2>}
            {children}
        </div>
    );
};

export default Card;
