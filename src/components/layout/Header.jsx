import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  Menu,
  RotateCcw,
  Coffee,
  DollarSign,
  DoorOpen,
  Languages,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  BellOff
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { findNavItem } from './navConfig';

const iconBtn =
  'relative inline-flex items-center justify-center h-10 w-10 rounded-xl text-stone-600 hover:text-chocolate-900 bg-white border border-stone-200/80 hover:border-stone-300 shadow-2xs transition-colors';

export const Header = ({
  onToggleMobileSidebar,
  currentView,
  onNavigate,
  onGlobalSearch,
  onViewOrder
}) => {
  const toast = useToast();
  const { language, toggleLanguage, isRtl, t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isCashier } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [today, setToday] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const { item: activeItem, group: activeGroup } = findNavItem(currentView);
  const PageIcon = activeItem.icon;
  const Crumb = isRtl ? ChevronLeft : ChevronRight;

  // Date only needs to refresh once a minute
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // "/" focuses the global search, Escape closes the notifications panel
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setShowNotifications(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      apiClient.invalidateCache();
      try {
        localStorage.removeItem('cafe90_simulated_orders');
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('notification:received'));
      toast.success(isRtl ? 'تم تحديث البيانات الحية من السيرفر بنجاح' : 'Live data refreshed from server');
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch {
      toast.error(isRtl ? 'فشل تحديث البيانات' : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch && searchQuery.trim()) {
      onGlobalSearch(searchQuery);
    }
  };

  const formattedDate = today.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="sticky top-0 z-30 w-full bg-canvas/85 backdrop-blur-xl border-b border-stone-200/70 supports-[backdrop-filter]:bg-canvas/75">
      <div className="flex items-center justify-between gap-3 h-[68px] px-4 sm:px-6 lg:px-8">
        {/* Page title + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className={`${iconBtn} lg:hidden`}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="hidden sm:flex w-10 h-10 rounded-xl bg-white border border-stone-200/80 shadow-2xs items-center justify-center text-gold-600 shrink-0">
            <PageIcon className="w-[18px] h-[18px]" />
          </span>

          <div className="min-w-0">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-stone-400 font-medium">
              <button type="button" onClick={() => onNavigate('overview')} className="hover:text-chocolate-800 transition-colors">
                {t('cafeName', 'Cafe 90')}
              </button>
              {activeGroup.groupKey && (
                <>
                  <Crumb className="w-3 h-3" />
                  <span className="truncate">{t(activeGroup.groupKey)}</span>
                </>
              )}
            </div>
            <h1 className="text-[15px] sm:text-[17px] font-bold text-chocolate-900 truncate leading-snug">
              {t(activeItem.labelKey)}
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          {!isCashier && (
          <form onSubmit={handleSearchSubmit} className="relative w-full group" role="search">
            <Search
              className={`w-4 h-4 text-stone-400 group-focus-within:text-gold-600 absolute top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                isRtl ? 'right-3.5' : 'left-3.5'
              }`}
            />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={isRtl ? 'بحث في الأصناف' : 'Search menu items'}
              className={`w-full h-10 text-sm text-chocolate-900 bg-white rounded-xl border border-stone-200/80 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition-all ${
                isRtl ? 'pr-10 pl-12' : 'pl-10 pr-12'
              }`}
            />
            {!searchQuery && (
              <span
                className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-[13px] text-stone-400 ${
                  isRtl ? 'right-10' : 'left-10'
                } group-focus-within:hidden`}
              >
                {isRtl ? 'ابحث عن صنف…' : 'Search menu items…'}
              </span>
            )}
            <kbd
              className={`absolute top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md border border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-500 ${
                isRtl ? 'left-2.5' : 'right-2.5'
              }`}
            >
              /
            </kbd>
          </form>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline-flex items-center gap-2 h-10 px-3 rounded-xl text-[13px] text-stone-600 font-medium">
            <CalendarDays className="w-4 h-4 text-stone-400" />
            {formattedDate}
          </span>

          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            title={isRtl ? 'تحديث ومزامنة البيانات' : 'Refresh live data'}
            aria-label={isRtl ? 'تحديث البيانات' : 'Refresh data'}
            className={`${iconBtn} hidden sm:inline-flex disabled:opacity-50`}
          >
            <RotateCcw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-[13px] font-semibold text-stone-700 hover:text-chocolate-900 bg-white border border-stone-200/80 hover:border-stone-300 shadow-2xs transition-colors"
            title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Languages className="w-4 h-4 text-stone-500" />
            <span>{language === 'en' ? 'عربي' : 'EN'}</span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`${iconBtn} ${showNotifications ? 'border-gold-300 text-chocolate-900 ring-4 ring-gold-400/10' : ''}`}
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white font-semibold text-[10px] flex items-center justify-center ring-2 ring-canvas tabular-nums">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className={`absolute mt-2 w-[calc(100vw-2rem)] max-w-[380px] bg-white rounded-2xl shadow-pop border border-stone-200/80 overflow-hidden z-50 animate-scale-up ${
                  isRtl ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
                }`}
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-chocolate-900">{t('notifications')}</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-semibold tabular-nums">
                        {unreadCount} {t('unreadAlerts')}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-800 px-2 py-1 rounded-lg hover:bg-gold-50 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {t('markAllRead')}
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 px-6 flex flex-col items-center text-center gap-2">
                      <span className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                        <BellOff className="w-5 h-5" />
                      </span>
                      <p className="text-sm font-semibold text-chocolate-900">
                        {isRtl ? 'لا توجد إشعارات جديدة' : "You're all caught up"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {isRtl ? 'ستظهر الطلبات والحجوزات الجديدة هنا' : 'New orders and bookings will show up here'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isBill = notif.type?.includes('bill');
                      const isOrder = notif.type?.includes('order') || notif.type?.includes('round');
                      const isBooking = notif.type?.includes('booking');

                      let Icon = Bell;
                      let iconBg = 'bg-gold-50 text-gold-700';
                      if (isBill) {
                        Icon = DollarSign;
                        iconBg = 'bg-amber-50 text-amber-700';
                      } else if (isOrder) {
                        Icon = Coffee;
                        iconBg = 'bg-emerald-50 text-emerald-700';
                      } else if (isBooking) {
                        Icon = DoorOpen;
                        iconBg = 'bg-sky-50 text-sky-700';
                      }

                      return (
                        <button
                          type="button"
                          key={notif.id}
                          className={`w-full text-start px-4 py-3 flex items-start gap-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0 ${
                            !notif.is_read ? 'bg-gold-50/40' : ''
                          }`}
                          onClick={async () => {
                            if (!notif.is_read) {
                              await markAsRead(notif.id);
                            }
                            if (notif.data?.order_id) {
                              setShowNotifications(false);
                              if (onViewOrder) {
                                onViewOrder({ id: notif.data.order_id });
                              } else if (onNavigate) {
                                onNavigate('orders');
                              }
                            } else if (notif.data?.booking_id) {
                              setShowNotifications(false);
                              if (onNavigate) {
                                onNavigate('facilities-rooms');
                              }
                            }
                          }}
                        >
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-semibold text-chocolate-900 truncate">{notif.title}</span>
                              {!notif.is_read && <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
                            </span>
                            <span className="block text-xs text-stone-500 mt-0.5 leading-relaxed line-clamp-2">
                              {notif.body || notif.message}
                            </span>
                            <span className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-stone-400 tabular-nums">
                                {notif.created_at
                                  ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : notif.time || ''}
                              </span>
                              {notif.data?.order_id && (
                                <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded tabular-nums">
                                  #{notif.data.order_id}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-stone-100 bg-stone-50/60">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('notifications');
                    }}
                    className="w-full h-9 rounded-lg text-xs font-semibold text-chocolate-800 hover:bg-white hover:shadow-2xs transition-all"
                  >
                    {isRtl ? 'عرض كل الإشعارات' : 'View all notifications'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
