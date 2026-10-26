import React from 'react';

export const Badge = ({ variant = 'default', children, size = 'sm', className = '', withDot = true }) => {
  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[11px]' 
    : size === 'md' 
    ? 'px-3 py-1 text-sm' 
    : 'px-2.5 py-0.5 text-xs';

  let variantClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  let dotColor = 'bg-stone-400';

  // Order Statuses
  if (variant === 'Pending' || variant === 'pending' || variant === 'new') {
    variantClasses = 'bg-amber-50 text-amber-800 border-amber-200/70 font-semibold';
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (variant === 'Confirmed' || variant === 'confirmed' || variant === 'Preparing' || variant === 'preparing') {
    variantClasses = 'bg-orange-50 text-orange-800 border-orange-200/70 font-semibold';
    dotColor = 'bg-orange-500';
  } else if (variant === 'Ready' || variant === 'ready') {
    variantClasses = 'bg-blue-50 text-blue-700 border-blue-200/70 font-semibold';
    dotColor = 'bg-blue-500';
  } else if (variant === 'Completed' || variant === 'completed') {
    variantClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/70 font-semibold';
    dotColor = 'bg-emerald-500';
  } else if (variant === 'Received' || variant === 'received') {
    variantClasses = 'bg-sky-50 text-sky-700 border-sky-200/70 font-medium';
    dotColor = 'bg-sky-500';
  } else if (variant === 'Cancelled' || variant === 'cancelled' || variant === 'Rejected' || variant === 'rejected') {
    variantClasses = 'bg-rose-50 text-rose-700 border-rose-200/70 font-medium';
    dotColor = 'bg-rose-500';
  } else if (variant === 'Open' || variant === 'open') {
    variantClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/70 font-medium';
    dotColor = 'bg-indigo-500';
  } 
  // Stock Statuses
  else if (variant === 'in_stock') {
    variantClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/70 font-medium';
    dotColor = 'bg-emerald-500';
  } else if (variant === 'low_stock') {
    variantClasses = 'bg-amber-50 text-amber-700 border-amber-200/70 font-medium';
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (variant === 'out_of_stock') {
    variantClasses = 'bg-rose-50 text-rose-700 border-rose-200/70 font-medium';
    dotColor = 'bg-rose-500';
  }
  // Room Statuses
  else if (variant === 'available') {
    variantClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/70 font-medium';
    dotColor = 'bg-emerald-500';
  } else if (variant === 'booked') {
    variantClasses = 'bg-purple-50 text-purple-700 border-purple-200/70 font-medium';
    dotColor = 'bg-purple-500';
  } else if (variant === 'maintenance') {
    variantClasses = 'bg-stone-100 text-stone-600 border-stone-300 font-medium';
    dotColor = 'bg-stone-400';
  }
  // Brand variants
  else if (variant === 'gold') {
    variantClasses = 'bg-gold-100/80 text-gold-900 border-gold-300 font-semibold';
    dotColor = 'bg-gold-500';
  } else if (variant === 'chocolate') {
    variantClasses = 'bg-chocolate-800 text-gold-300 border-chocolate-700 font-semibold';
    dotColor = 'bg-gold-400';
  } else if (variant === 'active') {
    variantClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/70 font-medium';
    dotColor = 'bg-emerald-500';
  } else if (variant === 'inactive') {
    variantClasses = 'bg-stone-100 text-stone-500 border-stone-200 font-medium';
    dotColor = 'bg-stone-400';
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 font-sans whitespace-nowrap leading-5 rounded-full border select-none transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{children}</span>
    </span>
  );
};
