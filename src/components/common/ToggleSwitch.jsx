import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Premium Luxury Toggle Switch for Cafe 90 Dashboard
 * 
 * Requirements & Specifications:
 * - When OFF (false): Thumb stays on the LEFT, track is glowing RED (Rose/Red).
 * - When ON (true): Thumb glides to the RIGHT, track is glowing GREEN (Emerald/Green).
 * - Physical LTR orientation guaranteed (dir="ltr") regardless of parent RTL context.
 * - Smooth spring-like transition physics with tactile press response.
 * - Micro-indicators inside thumb (Check for ON, X for OFF) for high-end feel.
 */
export const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  id,
  name,
  ariaLabel,
  className = '',
  showIcons = true,
  trackLabels = false,
  onLabel = 'ON',
  offLabel = 'OFF',
  variant = 'default' // 'default' | 'simple' | 'gold' | 'emerald'
}) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (onChange) onChange(!checked);
    }
  };

  // Dimension & Travel configs per size
  const configs = {
    sm: {
      track: 'w-[44px] h-[24px] p-[2.5px]',
      thumb: 'w-[19px] h-[19px]',
      travel: 'translate-x-[20px]',
      icon: 'w-2.5 h-2.5',
      text: 'text-[9px]'
    },
    md: {
      track: 'w-[52px] h-[28px] p-[3px]',
      thumb: 'w-[22px] h-[22px]',
      travel: 'translate-x-[24px]',
      icon: 'w-3 h-3',
      text: 'text-[10px]'
    },
    lg: {
      track: 'w-[62px] h-[34px] p-[3.5px]',
      thumb: 'w-[27px] h-[27px]',
      travel: 'translate-x-[28px]',
      icon: 'w-3.5 h-3.5',
      text: 'text-[11px]'
    }
  };

  const current = configs[size] || configs.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      name={name}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      dir="ltr"
      className={`
        group relative inline-flex shrink-0 cursor-pointer rounded-full items-center
        transition-all duration-300 ease-out select-none outline-none
        ${current.track}
        ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale' : 'active:scale-95 hover:brightness-105'}
        ${
          variant === 'simple' || variant === 'gold'
            ? (checked
                ? 'bg-gradient-to-r from-[#D4A037] to-[#C08625] border border-gold-500/50 shadow-sm shadow-gold-500/25'
                : 'bg-stone-200 border border-stone-300/80')
            : (checked
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 border border-emerald-400/40 shadow-sm shadow-emerald-500/30'
                : 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 border border-rose-400/40 shadow-sm shadow-rose-500/30')
        }
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold-500
        ${className}
      `}
    >
      {/* Optional Track Background Text/Hints */}
      {trackLabels && (
        <span
          className={`absolute font-black tracking-wider transition-opacity duration-200 pointer-events-none text-white/90 ${current.text} ${
            checked ? 'left-2 opacity-100' : 'right-2 opacity-100'
          }`}
        >
          {checked ? onLabel : offLabel}
        </span>
      )}

      {/* Floating White Circular Thumb */}
      <span
        className={`
          pointer-events-none relative flex items-center justify-center rounded-full bg-white
          shadow-[0_2px_5px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.1)]
          transform transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${current.thumb}
          ${checked ? current.travel : 'translate-x-0'}
        `}
      >
        {/* Subtle Micro-Icon inside Thumb */}
        {showIcons && (
          <span
            className={`transition-transform duration-300 flex items-center justify-center ${
              checked 
                ? (variant === 'simple' || variant === 'gold' ? 'scale-100 text-gold-600' : 'scale-100 text-emerald-600')
                : (variant === 'simple' || variant === 'gold' ? 'scale-0 text-stone-400' : 'scale-100 text-rose-600')
            }`}
          >
            {checked ? (
              <Check className={`${current.icon} stroke-[3]`} />
            ) : (
              variant === 'simple' || variant === 'gold' ? null : <X className={`${current.icon} stroke-[3]`} />
            )}
          </span>
        )}
      </span>
    </button>
  );
};
