import React from 'react';
import logoImg from '../../assets/logo.png';

export const Logo = ({ size = 'default', showTagline = false, variant = 'dark', className = '' }) => {
  // size: 'small', 'default', 'large'
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className={`flex flex-col items-center justify-center select-none bg-transparent ${className}`}>
      <div className="flex items-center justify-center relative bg-transparent">
        <img
          src={logoImg}
          alt="Cafe 90"
          className={`${
            isSmall
              ? 'w-12 h-12 object-contain'
              : isLarge
              ? 'w-60 max-h-40 object-contain'
              : 'w-48 max-h-32 object-contain'
          } bg-transparent transition-transform duration-300 hover:scale-105 filter drop-shadow-md`}
          onError={(e) => {
            e.target.src = '/logo.png';
          }}
        />
      </div>
    </div>
  );
};

