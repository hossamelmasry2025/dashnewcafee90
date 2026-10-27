// Dashboard roles & what each one can open.
// admin   -> everything
// cashier -> orders + room bookings + notifications only (no menu, prices, banners, rooms, users...)

export const STAFF_ROLES = ['admin', 'cashier'];

export const CASHIER_VIEWS = ['orders', 'bookings', 'notifications'];

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const canAccessView = (role, viewId) => {
  if (role === 'cashier') return CASHIER_VIEWS.includes(viewId);
  return true; // admin (and older sessions saved without a role)
};

export const defaultViewFor = (role) => (role === 'cashier' ? 'orders' : 'overview');
