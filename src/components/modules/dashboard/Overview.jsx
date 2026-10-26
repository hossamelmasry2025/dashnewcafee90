import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Coffee,
  Layers,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Star,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../../../services/api';
import { DashboardStatsCards } from './DashboardStatsCards';
import { Badge } from '../../common/Badge';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';

const AR_NAMES = {
  Mon: 'الإثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت', Sun: 'الأحد',
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو',
  Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر'
};

const STATUS_AR = {
  Pending: 'قيد الانتظار',
  Preparing: 'قيد التحضير',
  Confirmed: 'مؤكد',
  Ready: 'جاهز للاستلام',
  Completed: 'مكتمل',
  Open: 'مفتوح',
  Cancelled: 'ملغي',
  Rejected: 'مرفوض'
};

const DIST_AR = {
  Completed: 'مكتمل',
  Preparing: 'جاري التجهيز',
  Confirmed: 'جاري التجهيز',
  Pending: 'قيد الانتظار',
  Ready: 'جاهز للاستلام',
  'Ready for Pickup': 'جاهز للاستلام',
  Cancelled: 'مرفوض / ملغي',
  Rejected: 'مرفوض / ملغي'
};

const DINING_AR = { 'Dine-in': 'صالة', Takeaway: 'تيك أواي', Delivery: 'توصيل' };

const card = 'bg-white rounded-2xl border border-stone-200/70 shadow-card';

const CardHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4">
    <div className="min-w-0">
      <h3 className="text-[15px] font-bold text-chocolate-900">{title}</h3>
      {subtitle && <p className="text-[13px] text-stone-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-2">
    <span className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center">
      <Icon className="w-5 h-5" />
    </span>
    <p className="text-sm font-semibold text-chocolate-900">{title}</p>
    {hint && <p className="text-xs text-stone-500 max-w-xs">{hint}</p>}
  </div>
);

const ChartTooltip = ({ active, payload, label, isRtl }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-chocolate-950 text-white px-3 py-2 shadow-pop text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
      <p className="text-stone-400 mb-0.5">{label}</p>
      <p className="font-semibold tabular-nums text-sm">
        {Number(payload[0].value || 0).toLocaleString()} <span className="text-gold-300 font-medium">{isRtl ? 'ج.م' : 'EGP'}</span>
      </p>
    </div>
  );
};

const greeting = (isRtl) => {
  const h = new Date().getHours();
  if (h < 12) return isRtl ? 'صباح الخير' : 'Good morning';
  if (h < 18) return isRtl ? 'مساء الخير' : 'Good afternoon';
  return isRtl ? 'مساء الخير' : 'Good evening';
};

export const Overview = ({ onNavigate, onViewOrder }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily', 'weekly', 'monthly'

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error(isRtl ? 'فشل تحميل مؤشرات لوحة التحكم' : 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleRealtimeRefresh = () => {
      loadDashboardData();
    };
    window.addEventListener('notification:received', handleRealtimeRefresh);
    return () => {
      window.removeEventListener('notification:received', handleRealtimeRefresh);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 w-full">
        <div className="skeleton h-[188px] rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-[172px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const rawChartData = stats.revenueAnalytics?.[timeframe] || stats.revenueAnalytics?.weekly || [];
  const chartData = isRtl ? rawChartData.map((d) => ({ ...d, name: AR_NAMES[d.name] || d.name })) : rawChartData;
  const periodRevenue = chartData.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);

  const distribution = (stats.orderDistribution || []).map((item) => ({
    ...item,
    name: isRtl ? DIST_AR[item.name] || item.name : item.name
  }));

  const growth = String(stats.revenueGrowth || '0%');
  const growthNegative = growth.trim().startsWith('-');
  const GrowthIcon = growthNegative ? TrendingDown : TrendingUp;

  const currency = isRtl ? 'ج.م' : 'EGP';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const DetailsChevron = isRtl ? ChevronLeft : ChevronRight;
  const firstName = String(user?.name || '').trim().split(/\s+/)[0];

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Welcome banner */}
      <section
        className="relative isolate overflow-hidden rounded-2xl min-h-[188px] flex flex-col lg:flex-row lg:items-end justify-between gap-6 p-6 sm:p-8 shadow-luxury ring-1 ring-black/5"
        style={{ backgroundImage: "url('/banner_cafe90_experience.jpg')", backgroundSize: 'cover', backgroundPosition: 'center 55%' }}
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: isRtl
              ? 'linear-gradient(270deg, rgba(23,15,10,0.96) 0%, rgba(23,15,10,0.86) 45%, rgba(23,15,10,0.35) 100%)'
              : 'linear-gradient(90deg, rgba(23,15,10,0.96) 0%, rgba(23,15,10,0.86) 45%, rgba(23,15,10,0.35) 100%)'
          }}
        />

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/15 text-[12px] font-medium text-stone-200 backdrop-blur">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            {isRtl ? 'متابعة مباشرة • فرع شرق النيل' : 'Live • East Nile Branch'}
          </div>
          <h2 className="mt-3 text-2xl sm:text-[28px] leading-tight font-bold text-white">
            {greeting(isRtl)}{firstName && <span className="text-gold-300">{isRtl ? "، " : ", "}{firstName}</span>}
          </h2>
          <p className="mt-2 text-sm text-stone-300 leading-relaxed max-w-xl">
            {t('overviewDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('orders')}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] ring-1 ring-inset ring-white/15 text-white text-sm font-semibold backdrop-blur transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-gold-300" />
            {t('liveOrdersBtn')}
            {stats.pendingOrdersCount > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-gold-400 text-chocolate-950 text-xs font-bold inline-flex items-center justify-center tabular-nums">
                {stats.pendingOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('menu-items')}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-gradient-to-b from-gold-300 to-gold-400 hover:from-gold-400 hover:to-gold-500 text-chocolate-950 text-sm font-semibold shadow-gold-glow transition-colors"
          >
            <Layers className="w-4 h-4" />
            {t('manageMenuBtn')}
          </button>
        </div>
      </section>

      {/* KPIs (GET /admin/stats) */}
      <DashboardStatsCards onNavigate={onNavigate} />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full">
        {/* Revenue trend */}
        <section className={`${card} xl:col-span-2 flex flex-col`}>
          <CardHeader
            title={t('revenueTrends')}
            subtitle={t('financialPerformance')}
            action={
              <div className="inline-flex items-center p-1 bg-stone-100 rounded-xl shrink-0 self-start" role="tablist">
                {['daily', 'weekly', 'monthly'].map((tf) => (
                  <button
                    key={tf}
                    role="tab"
                    aria-selected={timeframe === tf}
                    onClick={() => setTimeframe(tf)}
                    className={`h-8 px-3 text-[13px] rounded-lg transition-all ${
                      timeframe === tf
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'text-stone-500 hover:text-chocolate-900 font-medium'
                    }`}
                  >
                    {t(tf)}
                  </button>
                ))}
              </div>
            }
          />

          <div className="grid grid-cols-3 mx-5 sm:mx-6 rounded-xl border border-stone-200/70 divide-x divide-stone-200/70 rtl:divide-x-reverse">
            <div className="px-4 py-3">
              <p className="text-xs text-stone-500">{isRtl ? 'مبيعات الفترة' : 'Period revenue'}</p>
              <p className="mt-1 text-lg font-semibold text-chocolate-950 tabular-nums">
                {periodRevenue.toLocaleString()} <span className="text-xs font-medium text-stone-500">{currency}</span>
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-stone-500">{isRtl ? 'متوسط الطلب' : 'Avg. order'}</p>
              <p className="mt-1 text-lg font-semibold text-chocolate-950 tabular-nums">
                {Number(stats.averageOrderValue || 0).toLocaleString()} <span className="text-xs font-medium text-stone-500">{currency}</span>
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-stone-500">{isRtl ? 'النمو الأسبوعي' : 'Weekly growth'}</p>
              <p className={`mt-1 text-lg font-semibold tabular-nums inline-flex items-center gap-1 ${growthNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                <GrowthIcon className="w-4 h-4" />
                <span dir="ltr">{growth}</span>
              </p>
            </div>
          </div>

          <div className="h-72 w-full px-2 sm:px-4 pt-4 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9973A" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#C9973A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#EFEBE6" />
                <XAxis
                  dataKey="name"
                  reversed={isRtl}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: '#8A7A70', fontSize: 12 }}
                />
                <YAxis
                  orientation={isRtl ? 'right' : 'left'}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fill: '#A39389', fontSize: 11 }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : val)}
                />
                <Tooltip
                  cursor={{ stroke: '#C9973A', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={<ChartTooltip isRtl={isRtl} />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B4842F"
                  strokeWidth={2.25}
                  fill="url(#revFill)"
                  activeDot={{ r: 5, fill: '#fff', stroke: '#B4842F', strokeWidth: 2 }}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Order status distribution */}
        <section className={`${card} flex flex-col`}>
          <CardHeader title={t('orderFulfillmentRatio')} subtitle={t('orderDistributionDesc')} />

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.totalOrders > 0 ? distribution : [{ name: isRtl ? 'لا توجد طلبات' : 'No orders', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={66}
                  outerRadius={86}
                  paddingAngle={stats.totalOrders > 0 ? 2 : 0}
                  cornerRadius={4}
                  stroke="none"
                  dataKey="value"
                  animationDuration={800}
                >
                  {stats.totalOrders > 0
                    ? distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                    : <Cell fill="#EFEBE6" />}
                </Pie>
                {stats.totalOrders > 0 && (
                  <Tooltip
                    formatter={(val, name) => [`${val} (${((val / stats.totalOrders) * 100).toFixed(1)}%)`, name]}
                    contentStyle={{
                      backgroundColor: '#140C08',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      direction: isRtl ? 'rtl' : 'ltr'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[28px] font-semibold text-chocolate-950 tabular-nums leading-none">{stats.totalOrders || 0}</span>
              <span className="text-xs text-stone-500 mt-1">{isRtl ? 'إجمالي الطلبات' : 'Total orders'}</span>
            </div>
          </div>

          <ul className="px-5 sm:px-6 pb-5 pt-2 space-y-1">
            {distribution.map((item) => {
              const percent = stats.totalOrders > 0 ? Math.round((item.value / (stats.totalOrders || 1)) * 100) : 0;
              return (
                <li key={item.name} className="flex items-center gap-3 py-1.5 text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-chocolate-800 truncate">{item.name}</span>
                  <span className="font-semibold text-chocolate-950 tabular-nums">{item.value}</span>
                  <span className="w-11 text-end text-xs text-stone-500 tabular-nums">{percent}%</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Recent orders + top items */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full">
        <section className={`${card} xl:col-span-2 overflow-hidden`}>
          <CardHeader
            title={t('liveOrdersTitle')}
            subtitle={t('incomingGuestQueue')}
            action={
              <button
                onClick={() => onNavigate('orders')}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-semibold text-chocolate-800 bg-white border border-stone-200 hover:bg-stone-50 shadow-2xs transition-colors self-start"
              >
                {t('viewAllOrders')}
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
            }
          />

          {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
            <EmptyState
              icon={ShoppingBag}
              title={isRtl ? 'لا توجد طلبات مسجلة حالياً' : 'No orders yet'}
              hint={isRtl ? 'ستظهر الطلبات الجديدة هنا فور استلامها' : 'New orders will appear here automatically'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-[13px] min-w-[640px]">
                <thead>
                  <tr className="bg-stone-50/80 border-y border-stone-200/70 text-xs text-stone-500">
                    <th className="py-2.5 px-5 sm:px-6 text-start font-semibold">{t('orderId')}</th>
                    <th className="py-2.5 px-3 text-start font-semibold">{t('customerInfo')}</th>
                    <th className="py-2.5 px-3 text-start font-semibold">{t('diningType')}</th>
                    <th className="py-2.5 px-3 text-start font-semibold">{t('totalPrice')}</th>
                    <th className="py-2.5 px-3 text-start font-semibold">{t('currentStatus')}</th>
                    <th className="py-2.5 px-5 sm:px-6"><span className="sr-only">{t('actions')}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stats.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="group hover:bg-stone-50/70 transition-colors cursor-pointer"
                      onClick={() => (onViewOrder ? onViewOrder(order) : onNavigate('orders'))}
                    >
                      <td className="py-3 px-5 sm:px-6 font-semibold text-chocolate-900 tabular-nums whitespace-nowrap" dir="ltr">
                        <span className={isRtl ? 'block text-end' : ''}>#{order.orderNumber}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold flex items-center justify-center shrink-0">
                            {String(order.customerName || '?').trim().charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-chocolate-900 truncate">{order.customerName}</p>
                            <p className="text-xs text-stone-400 tabular-nums" dir="ltr">{order.customerPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                        {isRtl ? DINING_AR[order.diningType] || order.diningType : order.diningType}
                      </td>
                      <td className="py-3 px-3 font-semibold text-chocolate-900 tabular-nums whitespace-nowrap">
                        {Number(order.totalPrice || 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">{currency}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={order.status}>
                          {isRtl ? STATUS_AR[order.status] || order.status : order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 sm:px-6 text-end">
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-stone-400 group-hover:text-gold-700 transition-colors">
                          {t('details')}
                          <DetailsChevron className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${card} flex flex-col`}>
          <CardHeader
            title={t('topSignatureItems')}
            subtitle={t('bestSellersDemand')}
          />

          <div className="flex-1 px-3 sm:px-4">
            {(!stats.topSellingItems || stats.topSellingItems.length === 0) ? (
              <EmptyState
                icon={Coffee}
                title={isRtl ? 'لا توجد مبيعات مسجلة بعد' : 'No sales yet'}
                hint={isRtl ? 'سيتم ترتيب الأصناف تلقائياً حسب المبيعات الفعلية' : 'Items are ranked automatically by actual sales'}
              />
            ) : (
              <ol className="space-y-0.5">
                {stats.topSellingItems.map((item, idx) => (
                  <li key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors">
                    <span className="w-5 text-center text-xs font-semibold text-stone-400 tabular-nums shrink-0">{idx + 1}</span>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-black/5 shrink-0"
                      />
                    ) : (
                      <span className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                        <Coffee className="w-5 h-5" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-chocolate-900 truncate">
                        {isRtl && item.nameAr ? item.nameAr : item.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                        <span className="tabular-nums">{Number(item.price || 0).toLocaleString()} {currency}</span>
                        {item.reviewCount > 0 && (
                          <>
                            <span className="text-stone-300">•</span>
                            <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                            <span className="tabular-nums">{item.rating}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-semibold text-chocolate-950 tabular-nums">{item.soldCount || 0}</p>
                      <p className="text-[11px] text-stone-400">{isRtl ? 'مُباع' : 'sold'}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="p-4 sm:px-5 border-t border-stone-100 mt-3">
            <button
              onClick={() => onNavigate('menu-items', { tab: 'best_sellers' })}
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-chocolate-800 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <Receipt className="w-4 h-4 text-stone-500" />
              {t('browseCompleteMenu')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
