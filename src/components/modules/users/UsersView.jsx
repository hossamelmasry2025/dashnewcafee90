import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Shield,
  Award,
  Calendar,
  Clock,
  ShoppingBag,
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  ExternalLink,
  Sparkles,
  UserCheck,
  DoorOpen,
  Star,
  MapPin,
  Hash,
  Activity,
  Layers,
  Coffee
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';

// Icon tints for the role filter cards
const USER_STAT_TINTS = {
  all: 'bg-gold-50 text-gold-700 ring-gold-200/70',
  user: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  admin: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  guest: 'bg-sky-50 text-sky-700 ring-sky-200/60'
};

export const UsersView = ({ onNavigate, onViewOrder }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();

  // Query & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Data & Loading States
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20
  });
  const [countsByRole, setCountsByRole] = useState({
    all: 0,
    user: 0,
    admin: 0,
    guest: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Selected User & Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState('profile'); // 'profile' | 'orders' | 'bookings' | 'reviews'

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState(null);

  // Debounce search input (350ms)
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
      setCurrentPage(1); // Reset to first page on search change
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      toast.success(isRtl ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard');
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      toast.error(isRtl ? 'تعذر النسخ' : 'Failed to copy');
    }
  };

  // Fetch Users
  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setFetchError(null);

      const params = {
        search: appliedSearch,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        per_page: perPage,
        page: currentPage
      };

      const res = await api.getUsers(params);

      // Parse payload robustly supporting { users: [...], pagination: { ... } }
      let list = [];
      let totalCount = 0;
      let lastPageNum = 1;
      let curPage = currentPage;

      if (Array.isArray(res)) {
        list = res;
        totalCount = res.length;
      } else if (res && typeof res === 'object') {
        const dataObj = res.data !== undefined && res.data !== null && typeof res.data === 'object' && !Array.isArray(res.users)
          ? res.data
          : res;

        if (Array.isArray(dataObj)) {
          list = dataObj;
          totalCount = res.total || dataObj.length;
        } else if (dataObj && typeof dataObj === 'object') {
          if (Array.isArray(res.users)) {
            list = res.users;
          } else if (Array.isArray(dataObj.users)) {
            list = dataObj.users;
          } else if (Array.isArray(dataObj.data)) {
            list = dataObj.data;
          }

          const pag = res.pagination || dataObj.pagination;
          if (pag && typeof pag === 'object') {
            totalCount = Number(pag.total ?? list.length);
            lastPageNum = Number(pag.last_page ?? 1);
            curPage = Number(pag.current_page ?? currentPage);
          } else {
            totalCount = dataObj.total !== undefined ? Number(dataObj.total) : (res.total !== undefined ? Number(res.total) : list.length);
            lastPageNum = dataObj.last_page || res.last_page || (Math.ceil(totalCount / perPage) || 1);
            curPage = dataObj.current_page || res.current_page || currentPage;
          }
        }
      }

      setUsers(list);
      setPagination({
        currentPage: curPage,
        lastPage: Math.max(lastPageNum, 1),
        total: totalCount,
        perPage: perPage
      });

      // Update role counts
      setCountsByRole(prev => {
        const next = { ...prev };
        if (selectedRole === 'all') {
          next.all = totalCount;
          if (!next.user || next.user === 0) {
            next.user = list.filter(u => !u.role || u.role === 'user' || u.role === 'customer').length;
          }
          if (!next.admin || next.admin === 0) {
            next.admin = list.filter(u => u.role === 'admin' || u.role === 'superadmin' || u.role === 'manager').length;
          }
          if (!next.guest || next.guest === 0) {
            next.guest = list.filter(u => u.role === 'guest' || u.is_guest).length;
          }
        } else {
          next[selectedRole] = totalCount;
        }
        return next;
      });
    } catch (err) {
      console.error('[UsersView] Error fetching users:', err);
      setFetchError(err.message || (isRtl ? 'تعذر جلب قائمة المستخدمين' : 'Failed to load users list'));
      toast.error(isRtl ? 'حدث خطأ أثناء تحميل بيانات المستخدمين' : 'Error loading users list');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [appliedSearch, selectedRole, currentPage, perPage, isRtl, toast]);

  // Initial & Filter change trigger
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch single user details & open modal
  const handleOpenUserDetails = async (user) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    setLoadingDetails(true);
    setUserDetails(null);
    setActiveDetailsTab('profile');

    try {
      const details = await api.getUserDetails(user.id);
      setUserDetails(details);
    } catch (err) {
      console.error('[UsersView] Error fetching user details:', err);
      toast.error(isRtl ? 'تعذر جلب تفاصيل المستخدم والنشاط' : 'Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return isRtl ? 'غير محدد' : 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return isRtl ? 'غير محدد' : 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Role Badge Styling
  const renderRoleBadge = (role) => {
    const r = (role || 'user').toLowerCase();
    if (r === 'admin' || r === 'super admin' || r === 'manager') {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 whitespace-nowrap">
          <Shield className="w-3 h-3 text-amber-600" />
          {isRtl ? 'مسؤول (Admin)' : 'Admin'}
        </span>
      );
    }
    if (r === 'guest') {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200/70 whitespace-nowrap">
          <Users className="w-3 h-3 text-stone-500" />
          {isRtl ? 'زائر (Guest)' : 'Guest'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 whitespace-nowrap">
        <UserCheck className="w-3 h-3 text-emerald-600" />
        {isRtl ? 'عميل (User)' : 'User'}
      </span>
    );
  };

  // Status Badge for Orders
  const renderOrderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
      case 'complete':
        return <Badge variant="green">{isRtl ? 'مكتمل' : 'Completed'}</Badge>;
      case 'confirmed':
        return <Badge variant="blue">{isRtl ? 'مؤكد' : 'Confirmed'}</Badge>;
      case 'pending':
        return <Badge variant="yellow">{isRtl ? 'قيد الانتظار' : 'Pending'}</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge variant="red">{isRtl ? 'ملغي' : 'Cancelled'}</Badge>;
      default:
        return <Badge variant="gray">{status || (isRtl ? 'غير محدد' : 'N/A')}</Badge>;
    }
  };

  // Extract resolved user fields from user details or selectedUser
  const resolvedUser = userDetails?.user || (userDetails?.id ? userDetails : selectedUser) || {};
  const userOrders = userDetails?.orders || userDetails?.recent_orders || userDetails?.user?.orders || [];
  const userBookings = userDetails?.bookings || userDetails?.recent_bookings || userDetails?.user?.bookings || [];
  const userReviews = userDetails?.reviews || userDetails?.recent_reviews || userDetails?.user?.reviews || [];

  return (
    <div className="space-y-5 animate-fade-in w-full pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/70 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-chocolate-900">
                  {isRtl ? 'دليل المستخدمين والعملاء' : 'Users & Customers Directory'}
                </h1>
                <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
                  {pagination.total} {isRtl ? 'مستخدم مسجل' : 'Registered'}
                </span>
              </div>
              <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
                {isRtl
                  ? 'عرض وإدارة جميع المستخدمين المسجلين في التطبيق، البحث الفوري بالاسم أو الهاتف، ومراجعة تفاصيل الحساب والطلبات.'
                  : 'Manage registered users, instant search by name, phone or email, and review profiles with recent activity.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            loading={isRefreshing}
            onClick={() => fetchUsers(true)}
          >
            {isRtl ? 'تحديث البيانات' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* 4 Top Cards (Sidebar Dark Espresso Theme with White Text & Gold Accents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            id: 'all',
            label: isRtl ? 'جميع المستخدمين' : 'All Users',
            subtitle: isRtl ? 'إجمالي الحسابات المسجلة' : 'Total Registered Accounts',
            count: countsByRole.all || pagination.total,
            icon: Users,
            badge: isRtl ? 'الكل' : 'All',
            activeColor: 'text-gold-400',
            bgGlow: 'from-gold-500/15'
          },
          {
            id: 'user',
            label: isRtl ? 'العملاء' : 'Customers',
            subtitle: isRtl ? 'حسابات العملاء النشطة' : 'Active Customer Accounts',
            count: countsByRole.user,
            icon: UserCheck,
            badge: isRtl ? 'عميل' : 'User',
            activeColor: 'text-emerald-400',
            bgGlow: 'from-emerald-500/15'
          },
          {
            id: 'admin',
            label: isRtl ? 'المشرفين' : 'Admins',
            subtitle: isRtl ? 'الإدارة وصلاحيات النظام' : 'Managers & Admins',
            count: countsByRole.admin,
            icon: Shield,
            badge: isRtl ? 'مشرف' : 'Admin',
            activeColor: 'text-amber-400',
            bgGlow: 'from-amber-500/15'
          },
          {
            id: 'guest',
            label: isRtl ? 'الزوار' : 'Guests',
            subtitle: isRtl ? 'طلبات بدون تسجيل' : 'Unregistered Guests',
            count: countsByRole.guest,
            icon: Coffee,
            badge: isRtl ? 'زائر' : 'Guest',
            activeColor: 'text-blue-400',
            bgGlow: 'from-blue-500/15'
          }
        ].map((card) => {
          const isActive = selectedRole === card.id;
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setSelectedRole(card.id);
                setCurrentPage(1);
              }}
              aria-pressed={isActive}
              className={`relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-start w-full group ${
                isActive
                  ? 'bg-white border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
                  : 'bg-white border-stone-200/70 shadow-card hover:border-stone-300 hover:shadow-luxury'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ${USER_STAT_TINTS[card.id] || USER_STAT_TINTS.all}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-stone-500 truncate">{card.label}</span>
                {isActive && <span className="ms-auto w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
              </div>
              <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                {card.count}
              </div>
              <div className="mt-2 text-xs text-stone-500 truncate">{card.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input (Live debounced backend & client search) */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                isRtl
                  ? 'ابحث بالاسم، البريد الإلكتروني، رقم الهاتف، أو اسم المستخدم...'
                  : 'Search by name, email, phone number, or username...'
              }
              className="w-full h-10 ps-10 pe-10 text-sm text-chocolate-900 bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition placeholder:text-stone-400"
            />
            <Search
              className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(appliedSearch || selectedRole !== 'all') && (
          <div className="flex items-center gap-2 pt-3 border-t border-stone-100 flex-wrap text-xs">
            <span className="text-stone-500 font-medium">
              {isRtl ? 'عوامل التصفية النشطة:' : 'Active filters:'}
            </span>
            {appliedSearch && (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-gold-50 text-gold-800 border border-gold-200/70 font-medium">
                <span>{isRtl ? 'بحث:' : 'Search:'}</span>
                <span className="font-semibold">"{appliedSearch}"</span>
                <button
                  onClick={() => setSearchInput('')}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRole !== 'all' && (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-stone-100 text-stone-700 border border-stone-200/70 font-medium">
                <span>{isRtl ? 'الدور:' : 'Role:'}</span>
                <span className="font-semibold">{selectedRole}</span>
                <button
                  onClick={() => setSelectedRole('all')}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchInput('');
                setSelectedRole('all');
                setCurrentPage(1);
              }}
              className="text-gold-700 hover:text-gold-800 hover:underline font-semibold text-xs ms-auto"
            >
              {isRtl ? 'إعادة ضبط الكل' : 'Reset all'}
            </button>
          </div>
        )}
      </div>

      {/* Users Table / Content */}
      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card overflow-hidden">
        {loading ? (
          /* Loading Skeletons */
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-16 bg-stone-100/70 rounded-xl animate-pulse flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-200" />
                  <div className="space-y-2">
                    <div className="w-32 h-3.5 bg-stone-200 rounded" />
                    <div className="w-20 h-2.5 bg-stone-200 rounded" />
                  </div>
                </div>
                <div className="w-24 h-6 bg-stone-200 rounded-full hidden sm:block" />
                <div className="w-24 h-8 bg-stone-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          /* Error State */
          <div className="p-12 text-center space-y-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200/60 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-chocolate-900">
              {isRtl ? 'فشل تحميل المستخدمين' : 'Failed to Load Users'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchUsers(true)}
              className="mt-2"
            >
              {isRtl ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
          </div>
        ) : users.length === 0 ? (
          /* Empty State */
          <div className="p-14 text-center space-y-4">
            <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-chocolate-900">
                {isRtl ? 'لم يتم العثور على أي مستخدمين' : 'No Users Found'}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                {appliedSearch
                  ? isRtl
                    ? `لا توجد نتائج تطابق بحثك عن "${appliedSearch}". جرب البحث باسم أو رقم هاتف آخر.`
                    : `No results matching "${appliedSearch}". Try searching with a different name or phone.`
                  : isRtl
                  ? 'لا يوجد أي مستخدمين مسجلين في النظام حالياً.'
                  : 'There are currently no registered users in the system.'}
              </p>
            </div>
            {(appliedSearch || selectedRole !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setSelectedRole('all');
                  setCurrentPage(1);
                }}
              >
                {isRtl ? 'مسح عوامل التصفية' : 'Clear Filters'}
              </Button>
            )}
          </div>
        ) : (
          /* Responsive Table */
          <div className="overflow-x-auto">
            <table className="w-full text-start text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-stone-200/70 bg-stone-50/80 text-stone-500 text-xs">
                  <th className="py-2.5 px-4 sm:px-5 font-semibold text-start whitespace-nowrap">
                    {isRtl ? 'المستخدم' : 'User'}
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-start whitespace-nowrap">
                    {isRtl ? 'بيانات التواصل' : 'Contact Info'}
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">
                    {isRtl ? 'الدور' : 'Role'}
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-center hidden md:table-cell whitespace-nowrap">
                    {isRtl ? 'نقاط الولاء' : 'Points'}
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-start hidden lg:table-cell whitespace-nowrap">
                    {isRtl ? 'تاريخ التسجيل' : 'Joined Date'}
                  </th>
                  <th className="py-2.5 px-4 sm:px-5 font-semibold text-end whitespace-nowrap">
                    {isRtl ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => {
                  const initial = (user.name || user.username || 'U')
                    .charAt(0)
                    .toUpperCase();
                  const roleStr = user.role || 'user';
                  const userPoints = user.points ?? user.loyalty_points ?? user.points_balance ?? 0;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => handleOpenUserDetails(user)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                    >
                      {/* User Info (Avatar + Name + Username + ID) */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {user.avatar_url || user.image || user.avatar ? (
                              <img
                                src={user.avatar_url || user.image || user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-stone-200/70"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 font-semibold flex items-center justify-center text-sm">
                                {initial}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-chocolate-900 text-[13px] sm:text-sm whitespace-nowrap group-hover:text-gold-700 transition-colors">
                                {user.name || (isRtl ? 'بدون اسم' : 'Unnamed User')}
                              </span>
                              <span className="tabular-nums text-[11px] px-1.5 h-5 inline-flex items-center rounded-md bg-stone-100 text-stone-500 font-medium">
                                #{user.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {user.username && (
                                <span className="text-xs text-stone-500">
                                  @{user.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Phone & Email) */}
                      <td
                        className="py-3 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-0.5">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5 text-[13px] text-chocolate-800 tabular-nums">
                              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span dir="ltr">{user.phone}</span>
                              <button
                                type="button"
                                title={isRtl ? 'نسخ رقم الهاتف' : 'Copy phone'}
                                onClick={() => handleCopy(user.phone, `phone-${user.id}`)}
                                className="p-1 text-stone-400 hover:text-chocolate-900 rounded hover:bg-stone-100 transition-colors"
                              >
                                {copiedKey === `phone-${user.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-stone-400 text-xs italic">
                              {isRtl ? 'لا يوجد هاتف' : 'No phone'}
                            </span>
                          )}

                          {user.email && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-500">
                              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[160px] sm:max-w-[200px]" title={user.email}>
                                {user.email}
                              </span>
                              <button
                                type="button"
                                title={isRtl ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                                onClick={() => handleCopy(user.email, `email-${user.id}`)}
                                className="p-1 text-stone-400 hover:text-chocolate-900 rounded hover:bg-stone-100 transition-colors"
                              >
                                {copiedKey === `email-${user.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {renderRoleBadge(roleStr)}
                      </td>

                      {/* Points / Balance */}
                      <td className="py-3 px-4 text-center hidden md:table-cell whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-gold-50 text-gold-800 font-semibold tabular-nums text-xs border border-gold-200/70">
                          <Award className="w-3.5 h-3.5 text-gold-600" />
                          {userPoints} {isRtl ? 'نقطة' : 'pts'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 hidden lg:table-cell text-[13px] text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 sm:px-5 text-end whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenUserDetails(user)}
                        >
                          {isRtl ? 'عرض التفاصيل' : 'View Details'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && users.length > 0 && (
          <div className="px-4 sm:px-5 py-3 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-stone-500 tabular-nums">
              {isRtl ? (
                <>
                  عرض{' '}
                  <span className="font-semibold text-chocolate-900">
                    {Math.min((currentPage - 1) * perPage + 1, pagination.total)}
                  </span>{' '}
                  إلى{' '}
                  <span className="font-semibold text-chocolate-900">
                    {Math.min(currentPage * perPage, pagination.total)}
                  </span>{' '}
                  من إجمالي{' '}
                  <span className="font-semibold text-chocolate-900">{pagination.total}</span> مستخدم
                </>
              ) : (
                <>
                  Showing{' '}
                  <span className="font-semibold text-chocolate-900">
                    {Math.min((currentPage - 1) * perPage + 1, pagination.total)}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-chocolate-900">
                    {Math.min(currentPage * perPage, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-chocolate-900">{pagination.total}</span> users
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={isRtl ? ChevronRight : ChevronLeft}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                {isRtl ? 'السابق' : 'Previous'}
              </Button>

              <span className="inline-flex items-center h-8 px-3 rounded-lg bg-stone-100 text-chocolate-900 text-xs font-semibold tabular-nums">
                {currentPage} / {pagination.lastPage}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={isRtl ? ChevronLeft : ChevronRight}
                disabled={currentPage >= pagination.lastPage}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.lastPage))}
              >
                {isRtl ? 'التالي' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* USER DETAILS & RECENT ACTIVITY MODAL (GET /admin/users/{id}) */}
      {/* ============================================================ */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedUser(null);
          setUserDetails(null);
        }}
        maxWidth="max-w-4xl"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60 flex items-center justify-center">
              <Users className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="font-bold text-chocolate-900 text-[15px]">
                {isRtl ? 'الملف الشخصي والنشاط' : 'User Profile & Activity'}
              </div>
              <div className="text-xs text-stone-500 font-normal tabular-nums">
                {resolvedUser.name || (isRtl ? 'تفاصيل المستخدم' : 'User Details')} #{resolvedUser.id}
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {loadingDetails ? (
            /* Modal Loading State */
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-stone-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="w-48 h-5 bg-stone-200 rounded animate-pulse" />
                  <div className="w-32 h-3 bg-stone-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
                <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
                <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {/* Profile Header Banner */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Big Avatar */}
                    {resolvedUser.avatar_url || resolvedUser.image || resolvedUser.avatar ? (
                      <img
                        src={resolvedUser.avatar_url || resolvedUser.image || resolvedUser.avatar}
                        alt={resolvedUser.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-1 ring-stone-200/70 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 font-bold text-xl flex items-center justify-center shrink-0">
                        {(resolvedUser.name || resolvedUser.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-chocolate-900">
                          {resolvedUser.name || (isRtl ? 'بدون اسم' : 'Unnamed User')}
                        </h2>
                        {renderRoleBadge(resolvedUser.role)}
                      </div>

                      <div className="flex items-center gap-2.5 text-stone-500 text-xs mt-1.5 flex-wrap">
                        {resolvedUser.username && (
                          <span className="text-gold-700 font-medium">
                            @{resolvedUser.username}
                          </span>
                        )}
                        <span className="tabular-nums inline-flex items-center h-5 px-1.5 rounded-md bg-stone-100 text-stone-600 font-medium text-[11px]">
                          ID: #{resolvedUser.id}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {isRtl ? 'انضم في:' : 'Joined:'} {formatDate(resolvedUser.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {resolvedUser.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(resolvedUser.phone, 'modal-phone')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-xs font-semibold shadow-2xs tabular-nums transition-colors"
                      >
                        {copiedKey === 'modal-phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span dir="ltr">{resolvedUser.phone}</span>
                      </button>
                    )}
                    {resolvedUser.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy(resolvedUser.email, 'modal-email')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-xs font-semibold shadow-2xs transition-colors truncate max-w-[220px]"
                        title={resolvedUser.email}
                      >
                        {copiedKey === 'modal-email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span className="truncate">{resolvedUser.email}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Loyalty Points */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-card">
                  <div className="flex items-center justify-between gap-2 text-stone-500">
                    <span className="text-[13px] font-medium">
                      {isRtl ? 'نقاط الولاء' : 'Loyalty Points'}
                    </span>
                    <Award className="w-4 h-4 text-gold-600" />
                  </div>
                  <div className="mt-3 text-2xl leading-none font-semibold text-chocolate-950 tabular-nums">
                    {resolvedUser.points ?? resolvedUser.loyalty_points ?? resolvedUser.points_balance ?? 0}
                  </div>
                </div>

                {/* Orders Count */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-card">
                  <div className="flex items-center justify-between gap-2 text-stone-500">
                    <span className="text-[13px] font-medium">
                      {isRtl ? 'الطلبات المسجلة' : 'Total Orders'}
                    </span>
                    <ShoppingBag className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="mt-3 text-2xl leading-none font-semibold text-chocolate-950 tabular-nums">
                    {userOrders.length || resolvedUser.orders_count || 0}
                  </div>
                </div>

                {/* Bookings Count */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-card">
                  <div className="flex items-center justify-between gap-2 text-stone-500">
                    <span className="text-[13px] font-medium">
                      {isRtl ? 'الحجوزات' : 'Bookings'}
                    </span>
                    <DoorOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="mt-3 text-2xl leading-none font-semibold text-chocolate-950 tabular-nums">
                    {userBookings.length || resolvedUser.bookings_count || 0}
                  </div>
                </div>

                {/* Reviews Count */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-card">
                  <div className="flex items-center justify-between gap-2 text-stone-500">
                    <span className="text-[13px] font-medium">
                      {isRtl ? 'التقييمات' : 'Reviews'}
                    </span>
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-3 text-2xl leading-none font-semibold text-chocolate-950 tabular-nums">
                    {userReviews.length || resolvedUser.reviews_count || 0}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs inside Modal */}
              <div className="flex items-center gap-1 p-1 bg-stone-200/50 rounded-xl overflow-x-auto w-full sm:w-fit">
                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('profile')}
                  className={`h-8 px-3 rounded-lg text-[13px] flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    activeDetailsTab === 'profile'
                      ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                      : 'font-medium text-stone-500 hover:text-chocolate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {isRtl ? 'البيانات الشخصية' : 'Profile Details'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailsTab('orders')}
                  className={`h-8 px-3 rounded-lg text-[13px] flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    activeDetailsTab === 'orders'
                      ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                      : 'font-medium text-stone-500 hover:text-chocolate-900'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isRtl ? 'سجل الطلبات الأخيرة' : 'Recent Orders'}
                  {userOrders.length > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-stone-200/70 text-stone-600 text-[11px] font-semibold tabular-nums">
                      {userOrders.length}
                    </span>
                  )}
                </button>

                {userBookings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveDetailsTab('bookings')}
                    className={`h-8 px-3 rounded-lg text-[13px] flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeDetailsTab === 'bookings'
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'font-medium text-stone-500 hover:text-chocolate-900'
                    }`}
                  >
                    <DoorOpen className="w-4 h-4" />
                    {isRtl ? 'الحجوزات' : 'Bookings'}
                    <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-stone-200/70 text-stone-600 text-[11px] font-semibold tabular-nums">
                      {userBookings.length}
                    </span>
                  </button>
                )}

                {userReviews.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveDetailsTab('reviews')}
                    className={`h-8 px-3 rounded-lg text-[13px] flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeDetailsTab === 'reviews'
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'font-medium text-stone-500 hover:text-chocolate-900'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    {isRtl ? 'التقييمات' : 'Reviews'}
                    <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-stone-200/70 text-stone-600 text-[11px] font-semibold tabular-nums">
                      {userReviews.length}
                    </span>
                  </button>
                )}
              </div>

              {/* Tab 1: Profile Details */}
              {activeDetailsTab === 'profile' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1 min-w-0">
                    <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-stone-400" />
                      {isRtl ? 'معرف المستخدم (ID)' : 'User ID'}
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-chocolate-900">
                      #{resolvedUser.id}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1 min-w-0">
                    <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      {isRtl ? 'الاسم بالكامل' : 'Full Name'}
                    </div>
                    <div className="text-sm font-semibold text-chocolate-900">
                      {resolvedUser.name || (isRtl ? 'غير متوفر' : 'N/A')}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1 min-w-0">
                    <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-chocolate-900 flex items-center justify-between gap-2">
                      <span dir="ltr">{resolvedUser.phone || (isRtl ? 'غير محدد' : 'N/A')}</span>
                      {resolvedUser.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(resolvedUser.phone, 'tab-phone')}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-stone-400 hover:text-chocolate-900 hover:bg-stone-100 shrink-0"
                        >
                          {copiedKey === 'tab-phone' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1 min-w-0">
                    <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                    </div>
                    <div className="text-sm font-semibold text-chocolate-900 flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate">{resolvedUser.email || (isRtl ? 'غير محدد' : 'N/A')}</span>
                      {resolvedUser.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(resolvedUser.email, 'tab-email')}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-stone-400 hover:text-chocolate-900 hover:bg-stone-100 shrink-0"
                        >
                          {copiedKey === 'tab-email' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1 min-w-0">
                    <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {isRtl ? 'تاريخ الإنشاء والتسجيل' : 'Registered At'}
                    </div>
                    <div className="text-[13px] font-medium text-chocolate-900">
                      {formatDateTime(resolvedUser.created_at)}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1 min-w-0">
                    <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-stone-400" />
                      {isRtl ? 'آخر تحديث للحساب' : 'Last Updated'}
                    </div>
                    <div className="text-[13px] font-medium text-chocolate-900">
                      {formatDateTime(resolvedUser.updated_at || resolvedUser.created_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Recent Orders */}
              {activeDetailsTab === 'orders' && (
                <div className="space-y-3 animate-fade-in">
                  {userOrders.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl border border-dashed border-stone-200">
                      <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-semibold text-chocolate-900">
                        {isRtl ? 'لا توجد طلبات مسجلة لهذا المستخدم' : 'No orders found for this user'}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {isRtl
                          ? 'لم يقم هذا المستخدم بإنشاء أي طلبات قهوة أو تيك أواي بعد.'
                          : 'This customer has not placed any orders yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {userOrders.map((order) => {
                        const orderNum = order.order_number || order.id;
                        const total = order.total || order.grand_total || order.total_amount || 0;
                        const itemsCount = Array.isArray(order.items)
                          ? order.items.length
                          : (order.items_count || 1);

                        return (
                          <div
                            key={order.id || orderNum}
                            className="p-4 bg-white hover:bg-stone-50/70 rounded-xl border border-stone-200/70 hover:border-stone-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="min-w-[40px] h-10 px-2 rounded-xl bg-stone-100 text-chocolate-800 flex items-center justify-center font-semibold text-xs tabular-nums shrink-0">
                                #{orderNum}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-chocolate-900 text-sm">
                                    {order.order_type === 'takeaway'
                                      ? (isRtl ? 'طلب تيك أواي' : 'Takeaway Order')
                                      : order.order_type === 'dine_in'
                                      ? (isRtl ? 'طلب صالة' : 'Dine-In Order')
                                      : (isRtl ? 'طلب' : 'Order')}
                                  </span>
                                  {renderOrderStatusBadge(order.status)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 tabular-nums">
                                  <span>{formatDateTime(order.created_at)}</span>
                                  <span className="text-stone-300">•</span>
                                  <span>
                                    {itemsCount} {isRtl ? 'أصناف' : 'items'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                              <div className="text-start sm:text-end">
                                <div className="text-[11px] text-stone-500 font-medium">
                                  {isRtl ? 'الإجمالي' : 'Total'}
                                </div>
                                <div className="text-[15px] font-semibold text-chocolate-950 tabular-nums">
                                  {Number(total).toLocaleString()} <span className="text-xs font-medium text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span>
                                </div>
                              </div>

                              {onViewOrder && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={ExternalLink}
                                  onClick={() => {
                                    setIsDetailsOpen(false);
                                    onViewOrder(order);
                                  }}
                                  className="text-xs"
                                >
                                  {isRtl ? 'عرض الطلب' : 'View'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Recent Bookings */}
              {activeDetailsTab === 'bookings' && (
                <div className="space-y-3 animate-fade-in">
                  {userBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-white rounded-xl border border-stone-200/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60 flex items-center justify-center shrink-0">
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-chocolate-900 text-sm">
                            {b.room_name || b.facility_name || (isRtl ? 'حجز قاعة' : 'Room Booking')}
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            {formatDate(b.booking_date || b.date)} • {b.start_time || ''} - {b.end_time || ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant="blue">{b.status || (isRtl ? 'مؤكد' : 'Confirmed')}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Recent Reviews */}
              {activeDetailsTab === 'reviews' && (
                <div className="space-y-3 animate-fade-in">
                  {userReviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (r.rating || 5) ? 'fill-amber-500' : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-stone-400">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      <p className="text-[13px] text-stone-700 leading-relaxed">
                        {r.comment || r.review || (isRtl ? 'لا يوجد تعليق' : 'No comment provided')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
