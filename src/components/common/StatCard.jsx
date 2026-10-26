import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  unit = '',
  icon: Icon,
  growth,
  growthPositive = true,
  description,
  variant = 'gold', // 'gold', 'chocolate', 'cream', 'rose'
  onClick,
  className = ''
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-2xl p-6 border border-stone-200/80 shadow-card hover:shadow-luxury transition-all duration-300 group ${
        isClickable ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {/* Background soft gold glow highlight */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-gold-400/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-chocolate-600/80">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-chocolate-900 tracking-tight font-sans">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-semibold text-chocolate-500 uppercase">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cream-100 to-gold-50 border border-gold-300/40 text-gold-600 shadow-sm group-hover:scale-110 group-hover:border-gold-400 transition-all duration-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(growth || description) && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          {growth && (
            <div
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
                growthPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {growthPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{growth}</span>
            </div>
          )}
          {description && (
            <span className="text-stone-500 text-[11px] font-normal truncate ml-auto">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
