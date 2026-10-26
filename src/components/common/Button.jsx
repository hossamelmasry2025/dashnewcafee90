import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' (chocolate), 'gold', 'outline', 'ghost', 'danger', 'secondary'
  size = 'md', // 'sm', 'md', 'lg', 'icon'
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs font-semibold rounded-lg gap-1.5',
    md: 'h-10 px-4 text-sm font-semibold rounded-xl gap-2',
    lg: 'h-12 px-6 text-[15px] font-semibold rounded-xl gap-2.5',
    icon: 'h-10 w-10 rounded-xl justify-center items-center'
  }[size] || 'h-10 px-4 text-sm font-semibold rounded-xl gap-2';

  const variantClasses = {
    primary:
      'bg-chocolate-900 hover:bg-chocolate-800 text-white shadow-xs ring-1 ring-inset ring-white/10',
    gold:
      'bg-gradient-to-b from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-chocolate-950 shadow-gold-glow ring-1 ring-inset ring-gold-600/20',
    outline:
      'bg-white hover:bg-stone-50 text-chocolate-800 border border-stone-200 hover:border-stone-300 shadow-2xs',
    ghost:
      'bg-transparent hover:bg-stone-100 text-chocolate-700',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs ring-1 ring-inset ring-black/5',
    secondary:
      'bg-stone-100 hover:bg-stone-200/80 text-chocolate-900'
  }[variant] || 'bg-chocolate-900 text-white';

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center whitespace-nowrap select-none transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className={`animate-spin ${iconSize} text-current`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        Icon && iconPosition === 'left' && <Icon className={iconSize} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className={iconSize} />}
    </button>
  );
};
