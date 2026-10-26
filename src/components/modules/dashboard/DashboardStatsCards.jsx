import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  HeartHandshake,
  Users,
  Calendar,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Sparkles,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { api } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';

// Helper to format Date objects to YYYY-MM-DD
const formatDateToISO = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Calculate predefined date ranges
const getPresetDates = (preset) => {
  const today = new Date();
  const todayStr = formatDateToISO(today);

  switch (preset) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case 'week': {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      return { from: formatDateToISO(past), to: todayStr };
    }
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDateToISO(startOfMonth), to: todayStr };
    }
    case 'all':
    default:
      return { from: '', to: '' };
  }
};

export const DashboardStatsCards = ({ onNavigate }) => {
  const { isRtl } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Stats data matching API Response Payload:
  // { from, to, total_revenue, total_tips, total_orders, orders_by_status, total_users }
  const [stats, setStats] = useState({
    from: null,
    to: null,
    total_revenue: 0,
    total_tips: 0,
    total_orders: 0,
    orders_by_status: {
      open: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0
    },
    total_users: 0
  });

  // Active filter state
  const [activePreset, setActivePreset] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Fetch KPI stats from GET /admin/stats
  const fetchStats = useCallback(async (from = '', to = '', isSilent = false) => {
    try {
      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const data = await api.getAdminStats(params);

      if (data && typeof data === 'object') {
        setStats({
          from: data.from ?? (from || null),
          to: data.to ?? (to || null),
          total_revenue: Number(data.total_revenue || 0),
          total_tips: Number(data.total_tips || 0),
          total_orders: Number(data.total_orders || 0),
          orders_by_status: {
            open: Number(data.orders_by_status?.open || 0),
            pending: Number(data.orders_by_status?.pending || 0),
            confirmed: Number(data.orders_by_status?.confirmed || 0),
            rejected: Number(data.orders_by_status?.rejected || 0)
          },
          total_users: Number(data.total_users || 0)
        });
      }
    } catch (err) {
      console.error('[DashboardStats] Fetch error:', err);
      setError(err?.message || (isRtl ? 'فشل تحميل بيانات الإحصائيات' : 'Failed to fetch stats'));
      toast.error(isRtl ? 'تعذر جلب الإحصائيات العامة من السيرفر' : 'Failed to fetch executive stats');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRtl, toast]);

  // Initial load
  useEffect(() => {
    fetchStats(dateRange.from, dateRange.to);
  }, []); // Run once on mount

  // Auto-refresh when real-time updates arrive
  useEffect(() => {
    const handleRealtimeRefresh = () => {
      fetchStats(dateRange.from, dateRange.to, true);
    };

    window.addEventListener('notification:received', handleRealtimeRefresh);
    window.addEventListener('order:realtime_update', handleRealtimeRefresh);

    return () => {
      window.removeEventListener('notification:received', handleRealtimeRefresh);
      window.removeEventListener('order:realtime_update', handleRealtimeRefresh);
    };
  }, [dateRange, fetchStats]);

  // Handle Preset selection
  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustomPicker(true);
      return;
    }

    setShowCustomPicker(false);
    const { from, to } = getPresetDates(preset);
    setDateRange({ from, to });
    fetchStats(from, to);
  };

  // Handle custom date apply
  const handleApplyCustomDates = (e) => {
    e?.preventDefault();
    if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
      toast.error(isRtl ? 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' : 'Start date must be before end date');
      return;
    }
    setActivePreset('custom');
    fetchStats(dateRange.from, dateRange.to);
  };

  // Preset items config
  const presets = [
    { id: 'all', label: isRtl ? 'الكل' : 'All Time' },
    { id: 'today', label: isRtl ? 'اليوم' : 'Today' },
    { id: 'week', label: isRtl ? 'آخر 7 أيام' : 'Last 7 Days' },
    { id: 'month', label: isRtl ? 'هذا الشهر' : 'This Month' },
    { id: 'custom', label: isRtl ? 'فترة مخصصة 📅' : 'Custom 📅' },
  ];

  // Distribution calculations for the total orders progress bar
  const confirmedCount = stats.orders_by_status.confirmed || 0;
  const pendingCount = stats.orders_by_status.pending || 0;
  const openCount = stats.orders_by_status.open || 0;
  const rejectedCount = stats.orders_by_status.rejected || 0;
  const statusSum = confirmedCount + pendingCount + openCount + rejectedCount;
  const effectiveTotal = stats.total_orders > 0 ? stats.total_orders : (statusSum > 0 ? statusSum : 1);

  const confirmedPct = statusSum > 0 ? (confirmedCount / effectiveTotal) * 100 : 0;
  const pendingPct = statusSum > 0 ? (pendingCount / effectiveTotal) * 100 : 0;
  const openPct = statusSum > 0 ? (openCount / effectiveTotal) * 100 : 0;
  const rejectedPct = statusSum > 0 ? (rejectedCount / effectiveTotal) * 100 : 0;

  const periodLabel = activePreset === 'all'
    ? (isRtl ? 'تراكمي' : 'All time')
    : (isRtl ? 'خلال الفترة المحددة' : 'Selected period');

  const statusRows = [
    { key: 'confirmed', label: isRtl ? 'مؤكدة' : 'Confirmed', count: confirmedCount, pct: confirmedPct, color: 'bg-emerald-500' },
    { key: 'pending', label: isRtl ? 'معلقة' : 'Pending', count: pendingCount, pct: pendingPct, color: 'bg-amber-400' },
    { key: 'open', label: isRtl ? 'مفتوحة' : 'Open', count: openCount, pct: openPct, color: 'bg-indigo-400' },
    { key: 'rejected', label: isRtl ? 'مرفوضة' : 'Rejected', count: rejectedCount, pct: rejectedPct, color: 'bg-rose-400' }
  ];

  const LinkArrow = () => (
    <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-chocolate-700 transition-all rtl:-scale-x-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
  );

  const cardBase =
    'relative bg-white rounded-2xl p-5 border border-stone-200/70 shadow-card flex flex-col transition-all duration-200';

  return (
    <section className="space-y-4 w-full" aria-label={isRtl ? 'المؤشرات العامة' : 'Key metrics'}>
      {/* Section header: title + period filter */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-chocolate-900 flex items-center gap-2">
            {isRtl ? 'المؤشرات الرئيسية' : 'Key metrics'}
            {isRefreshing && <RefreshCw className="w-3.5 h-3.5 text-gold-600 animate-spin" />}
          </h3>
          <p className="text-[13px] text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{isRtl ? 'بيانات مباشرة من النظام' : 'Live data from your store'}</span>
            {(stats.from || stats.to) && (
              <span className="inline-flex items-center gap-1 font-medium text-chocolate-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 text-xs tabular-nums">
                <Calendar className="w-3 h-3 text-stone-400" />
                {stats.from || '—'} → {stats.to || '—'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 bg-stone-200/50 rounded-xl overflow-x-auto max-w-full" role="tablist">
            {presets.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`h-8 px-3 rounded-lg text-[13px] whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                      : 'text-stone-500 hover:text-chocolate-900 font-medium'
                  }`}
                >
                  {p.id === 'custom' && <Calendar className="w-3.5 h-3.5" />}
                  {p.label.replace(' 📅', '')}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => fetchStats(dateRange.from, dateRange.to, true)}
            disabled={loading || isRefreshing}
            className="h-10 w-10 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/80 text-stone-600 shadow-2xs inline-flex items-center justify-center transition-colors disabled:opacity-50"
            title={isRtl ? 'إعادة جلب الإحصائيات' : 'Refresh stats'}
            aria-label={isRtl ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? 'animate-spin text-gold-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom date range */}
      {showCustomPicker && (
        <form
          onSubmit={handleApplyCustomDates}
          className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-chocolate-900 shrink-0">
            <Filter className="w-4 h-4 text-gold-600" />
            <span>{isRtl ? 'فترة زمنية مخصصة' : 'Custom date range'}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-[13px]">
              <span className="text-stone-500">{isRtl ? 'من' : 'From'}</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="h-9 px-2.5 rounded-lg border border-stone-200 bg-white text-chocolate-900 text-[13px] focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <span className="text-stone-500">{isRtl ? 'إلى' : 'To'}</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="h-9 px-2.5 rounded-lg border border-stone-200 bg-white text-chocolate-900 text-[13px] focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 cursor-pointer"
              />
            </label>

            <button
              type="submit"
              disabled={loading || isRefreshing}
              className="h-9 px-4 bg-chocolate-900 hover:bg-chocolate-800 text-white font-semibold text-[13px] rounded-lg transition-colors disabled:opacity-50"
            >
              {isRtl ? 'تطبيق' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDateRange({ from: '', to: '' });
                setActivePreset('all');
                setShowCustomPicker(false);
                fetchStats('', '');
              }}
              className="h-9 px-3 text-stone-500 hover:text-chocolate-900 hover:bg-stone-100 rounded-lg text-[13px] font-medium transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Reset'}
            </button>
          </div>
        </form>
      )}

      {/* Error banner */}
      {error && !loading && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/70 rounded-xl flex items-center justify-between text-[13px] text-rose-800 gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchStats(dateRange.from, dateRange.to)}
            className="h-8 px-3 bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-xs transition-colors"
          >
            {isRtl ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[172px] bg-white rounded-2xl border border-stone-200/70 p-5 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-xl" />
                <div className="skeleton h-3.5 w-24" />
              </div>
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          {/* Revenue — the accent card */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-white flex flex-col shadow-luxury ring-1 ring-inset ring-white/[0.06]"
            style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(201,151,58,0.28) 0%, rgba(201,151,58,0) 55%), linear-gradient(160deg, #2A1B12 0%, #1A110B 100%)' }}
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gold-300/10 ring-1 ring-inset ring-gold-300/20 text-gold-300 flex items-center justify-center shrink-0">
                <DollarSign className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[13px] font-medium text-stone-300">
                {isRtl ? 'إجمالي الإيرادات' : 'Total revenue'}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[30px] leading-none font-semibold tracking-tight tabular-nums">
                {stats.total_revenue.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-gold-300">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-stone-400">
              <span>{isRtl ? 'صافي مبيعات الطلبات' : 'Gross order sales'}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-stone-300">{periodLabel}</span>
            </div>
          </div>

          {/* Orders + status distribution */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('orders')}
            className={`${cardBase} group text-start hover:shadow-luxury hover:border-stone-300/70`}
          >
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-[18px] h-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-stone-500">
                  {isRtl ? 'إجمالي الطلبات' : 'Total orders'}
                </span>
              </div>
              <LinkArrow />
            </div>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[30px] leading-none font-semibold tracking-tight text-chocolate-950 tabular-nums">
                {stats.total_orders.toLocaleString()}
              </span>
              <span className="text-sm text-stone-500">{isRtl ? 'طلب' : 'orders'}</span>
            </div>

            <div className="mt-auto pt-4 w-full space-y-2.5">
              <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden flex gap-0.5">
                {statusSum === 0 ? (
                  <div className="h-full w-full bg-stone-200" />
                ) : (
                  statusRows.map((s) =>
                    s.count > 0 ? (
                      <div key={s.key} style={{ width: `${s.pct}%` }} className={`h-full ${s.color}`} title={`${s.label}: ${s.count}`} />
                    ) : null
                  )
                )}
              </div>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {statusRows.map((s) => (
                  <div key={s.key} className="min-w-0">
                    <div className="flex items-center gap-1 text-stone-500">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.color}`} />
                      <span className="truncate">{s.label}</span>
                    </div>
                    <span className="block font-semibold text-chocolate-900 tabular-nums text-xs mt-0.5">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>

          {/* Tips */}
          <div className={cardBase}>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[13px] font-medium text-stone-500">
                {isRtl ? 'إجمالي الإكراميات' : 'Total tips'}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[30px] leading-none font-semibold tracking-tight text-chocolate-950 tabular-nums">
                {stats.total_tips.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-stone-500">
              <span>{isRtl ? 'مستحقة لطاقم العمل' : 'Earned by staff'}</span>
              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">{periodLabel}</span>
            </div>
          </div>

          {/* Users */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('users')}
            className={`${cardBase} group text-start hover:shadow-luxury hover:border-stone-300/70`}
          >
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60 flex items-center justify-center shrink-0">
                  <Users className="w-[18px] h-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-stone-500">
                  {isRtl ? 'العملاء المسجلين' : 'Registered guests'}
                </span>
              </div>
              <LinkArrow />
            </div>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[30px] leading-none font-semibold tracking-tight text-chocolate-950 tabular-nums">
                {stats.total_users.toLocaleString()}
              </span>
              <span className="text-sm text-stone-500">{isRtl ? 'عميل' : 'guests'}</span>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-stone-500 w-full">
              <span>{isRtl ? 'حسابات تطبيق الموبايل' : 'Mobile app accounts'}</span>
              <span className="text-chocolate-700 font-medium group-hover:underline underline-offset-4">
                {isRtl ? 'عرض العملاء' : 'View guests'}
              </span>
            </div>
          </button>
        </div>
      )}
    </section>
  );
};

export default DashboardStatsCards;
