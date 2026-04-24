import React from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F9E27E', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8A6612', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      <path d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z" 
            stroke="url(#goldGrad)" 
            strokeWidth="3" 
            fill="none"/>

      <text x="50" y="62" 
            fontFamily="Serif, 'Times New Roman'" 
            fontSize="38" 
            fill="url(#goldGrad)" 
            textAnchor="middle" 
            fontWeight="bold"
            style={{ letterSpacing: '-2px' }}>
        PJ
      </text>

      <rect x="47" y="82" width="6" height="6" transform="rotate(45 50 85)" fill="url(#goldGrad)" />
    </svg>
  );
};
