import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  Coffee,
  DollarSign,
  DoorOpen,
  Calendar,
  CheckCircle2,
  Check,
  RotateCcw,
  Search,
  Filter,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Smartphone,
  Terminal,
  FlaskConical,
  Trash2,
  Play,
  Sparkles
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotifications } from '../../../context/NotificationContext';

export const NotificationsView = ({ onNavigate, onViewOrder }) => {
  const toast = useToast();
  const { isRtl } = useLanguage();
  const fileInputRef = useRef(null);

  const {
    notifications,
    unreadCount,
    currentPage,
    lastPage,
    totalCount,
    loading,
    connectionState,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification,
    registerDevice,
    unregisterDevice,
    simulateRealtimeNotification
  } = useNotifications();

  // Testing & Simulation Suite State
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [testActionLoading, setTestActionLoading] = useState(null);
  const [testConsoleLogs, setTestConsoleLogs] = useState([]);

  const logTestResult = (action, data, isError = false) => {
    const newLog = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      action,
      data,
      isError
    };
    setTestConsoleLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  const handleTestRegisterDevice = async () => {
    try {
      setTestActionLoading('register');
      const res = await registerDevice();
      logTestResult('POST /notifications/register-device', res);
    } catch (err) {
      logTestResult('POST /notifications/register-device (Error)', { error: err.message }, true);
    } finally {
      setTestActionLoading(null);
    }
  };

  const handleTestUnregisterDevice = async () => {
    try {
      setTestActionLoading('unregister');
      const res = await unregisterDevice();
      logTestResult('POST /notifications/unregister-device', res);
    } catch (err) {
      logTestResult('POST /notifications/unregister-device (Error)', { error: err.message }, true);
    } finally {
      setTestActionLoading(null);
    }
  };

  const handleSimulateNewOrder = () => {
    const orderId = Math.floor(1000 + Math.random() * 90000);
    const res = simulateRealtimeNotification({
      type: 'admin_new_order',
      title: isRtl ? 'أوردر جديد! 🎉' : 'New Order! 🎉',
      body: isRtl ? `طلب رقم ORD-${orderId} بقيمة 180 جنيه` : `Order ORD-${orderId} for 180 EGP`,
      data: { type: 'admin_new_order', order_id: orderId }
    });
    logTestResult('Pusher Event: .notification (admin_new_order)', res);
  };

  const handleSimulateBillRequested = () => {
    const tableNum = Math.floor(1 + Math.random() * 8);
    const orderId = Math.floor(1000 + Math.random() * 90000);
    const res = simulateRealtimeNotification({
      type: 'admin_bill_requested',
      title: isRtl ? `طلب حساب طاولة ${tableNum} 💰` : `Table ${tableNum} Requested Bill 💰`,
      body: isRtl ? `طاولة ${tableNum} طلبت الحساب الفوري - أوردر ORD-${orderId}` : `Table ${tableNum} requested bill - order ORD-${orderId}`,
      data: { type: 'admin_bill_requested', order_id: orderId, table_number: tableNum }
    });
    logTestResult('Pusher Event: .notification (admin_bill_requested)', res);
  };

  const handleSimulateNewRound = () => {
    const tableNum = Math.floor(1 + Math.random() * 8);
    const res = simulateRealtimeNotification({
      type: 'admin_new_round',
      title: isRtl ? `طلب جديد على طاولة ${tableNum} ☕` : `New Round on Table ${tableNum} ☕`,
      body: isRtl ? 'كابتشينو مخملي + سبانش لاتيه' : 'Velvet Cappuccino + Spanish Latte',
      data: { type: 'admin_new_round', order_id: 34, round_id: Date.now() % 1000 }
    });
    logTestResult('Pusher Event: .notification (admin_new_round)', res);
  };

  const handleSimulateNewBooking = () => {
    const bookingId = Math.floor(10 + Math.random() * 90);
    const res = simulateRealtimeNotification({
      type: 'admin_new_booking',
      title: isRtl ? 'حجز جديد لغرفة اجتماعات! 📅' : 'New Room Booking! 📅',
      body: isRtl ? `حجز رقم #${bookingId} لغرفة اجتماعات VIP (ساعتان)` : `Booking #${bookingId} for VIP Room (2 hours)`,
      data: { type: 'admin_new_booking', booking_id: bookingId, room_name: 'VIP Room 1' }
    });
    logTestResult('Pusher Event: .notification (admin_new_booking)', res);
  };

  const handleTestMarkFirstRead = async () => {
    const firstUnread = notifications.find(n => !n.is_read);
    if (!firstUnread) {
      toast.info(isRtl ? 'لا توجد إشعارات غير مقروءة لاختبارها' : 'No unread notifications to test');
      return;
    }
    try {
      setTestActionLoading('markOne');
      const res = await markAsRead(firstUnread.id);
      logTestResult(`POST /notifications/${firstUnread.id}/read`, res || { success: true, id: firstUnread.id });
    } catch (err) {
      logTestResult(`POST /notifications/${firstUnread.id}/read (Error)`, { error: err.message }, true);
    } finally {
      setTestActionLoading(null);
    }
  };

  const handleTestMarkAllRead = async () => {
    try {
      setTestActionLoading('markAll');
      const res = await markAllAsRead();
      logTestResult('POST /notifications/read-all', res || { message: 'تم تعليم كل الإشعارات كمقروءة' });
    } catch (err) {
      logTestResult('POST /notifications/read-all (Error)', { error: err.message }, true);
    } finally {
      setTestActionLoading(null);
    }
  };

  // Available users for specific sending
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'orders' | 'bookings'
  const [searchQuery, setSearchQuery] = useState('');

  // Send Notification Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendAudience, setSendAudience] = useState('all'); // 'all' | 'specific'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [attachedImageFile, setAttachedImageFile] = useState(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState(null);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.getUsers();
      if (Array.isArray(res)) {
        setUsersList(res);
      } else if (Array.isArray(res?.users)) {
        setUsersList(res.users);
      } else if (Array.isArray(res?.data)) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (usersList.length === 0) {
      loadUsers();
    }
    return () => {
      isMounted = false;
    };
  }, [usersList.length]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= lastPage && page !== currentPage) {
      fetchNotifications(page);
    }
  };

  // Mark single as read
  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await markAsRead(notif.id);
      toast.success(isRtl ? 'تم تعليم الإشعار كمقروء' : 'Notification marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  // Image Upload Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImagePreview(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAttachedImageFile(null);
    setAttachedImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open Send Modal
  const handleOpenSendModal = () => {
    setSendAudience('all');
    setSelectedUserId('');
    setTitleAr('');
    setTitleEn('');
    setBodyAr('');
    setBodyEn('');
    setAttachedImageFile(null);
    setAttachedImagePreview(null);
    setIsSendModalOpen(true);
  };

  // Send Notification Handler
  const handleSendNotification = async (e) => {
    e?.preventDefault?.();

    const title = titleAr.trim() || titleEn.trim();
    const body = bodyAr.trim() || bodyEn.trim();

    if (!title || !body) {
      toast.warning(isRtl ? 'يرجى إدخال عنوان ونص الإشعار' : 'Please provide notice title and message body');
      return;
    }

    if (sendAudience === 'specific' && !selectedUserId) {
      toast.warning(isRtl ? 'يرجى اختيار المستخدم المستهدف' : 'Please select the target customer');
      return;
    }

    try {
      setSending(true);
      const payload = {
        title: title,
        title_ar: titleAr.trim() || title,
        title_en: titleEn.trim() || title,
        body: body,
        body_ar: bodyAr.trim() || body,
        body_en: bodyEn.trim() || body,
        audience: sendAudience
      };

      if (sendAudience === 'specific') {
        payload.user_id = selectedUserId;
        payload.user_ids = [selectedUserId];
      }

      if (attachedImageFile instanceof File) {
        payload.image = attachedImageFile;
      }

      await sendNotification(payload);

      setIsSendModalOpen(false);
      handleRemoveImage();
      setTitleAr('');
      setTitleEn('');
      setBodyAr('');
      setBodyEn('');
      setSelectedUserId('');
    } catch (err) {
      console.error('Error sending notification:', err);
    } finally {
      setSending(false);
    }
  };

  // Compute filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Filter tab
      if (activeFilter === 'unread' && n.is_read) return false;
      if (activeFilter === 'orders' && !n.type?.includes('round') && !n.type?.includes('order') && !n.type?.includes('bill')) return false;
      if (activeFilter === 'bookings' && !n.type?.includes('booking')) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (n.title || '').toLowerCase().includes(q);
        const matchBody = (n.body || '').toLowerCase().includes(q);
        if (!matchTitle && !matchBody) return false;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Notification Icon & Accent Helper
  const getNotificationStyle = (type) => {
    if (type?.includes('bill')) {
      return {
        icon: DollarSign,
        color: 'text-amber-700 bg-amber-50 border-amber-200/70',
        badge: isRtl ? 'طلب حساب طاولة 💰' : 'Bill Requested'
      };
    }
    if (type?.includes('round') || type?.includes('order')) {
      return {
        icon: Coffee,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
        badge: isRtl ? 'طلب طاولة جديد ☕' : 'Table Order'
      };
    }
    if (type?.includes('booking')) {
      return {
        icon: DoorOpen,
        color: 'text-sky-700 bg-sky-50 border-sky-200/70',
        badge: isRtl ? 'حجز قاعة اجتماعات 🏠' : 'Room Booking'
      };
    }
    return {
      icon: Bell,
      color: 'text-gold-700 bg-gold-50 border-gold-200/70',
      badge: isRtl ? 'إشعار إداري 🔔' : 'Admin Alert'
    };
  };

  return (
    <div className="space-y-5 animate-fade-in w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/70 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-chocolate-900">
              {isRtl ? 'مركز الإشعارات والتنبيهات' : 'Notifications & Alerts Center'}
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
                {unreadCount} {isRtl ? 'غير مقروء' : 'Unread'}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium border ${
              connectionState === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-amber-50 text-amber-700 border-amber-200/70'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {connectionState === 'connected' ? (isRtl ? 'اتصال لحظي نشط' : 'Live Real-time') : (isRtl ? 'جاري الاتصال...' : 'Connecting...')}
            </span>
          </div>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
            {isRtl
              ? 'إرسال إشعارات فورية لجميع مستخدمي التطبيق أو لمستخدم محدد، ومتابعة تنبيهات الطلبات والحجوزات الحية.'
              : 'Broadcast instant push alerts to all app users or a specific customer, and monitor live table orders and bookings.'}
          </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 2xl:justify-end shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsTestSuiteOpen(!isTestSuiteOpen)}
            icon={FlaskConical}
            className={isTestSuiteOpen ? "!border-gold-400 !bg-gold-50 !text-gold-800 ring-4 ring-gold-400/15" : ""}
          >
            {isRtl ? 'معمل الاختبار والمحاكاة' : 'E2E Testing Suite'}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => fetchNotifications(currentPage)}
            icon={RotateCcw}
          >
            {isRtl ? 'تحديث' : 'Refresh'}
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="md"
              icon={CheckCircle2}
              onClick={handleMarkAllRead}
            >
              {isRtl ? 'تعليم الكل كمقروء' : 'Mark All Read'}
            </Button>
          )}

          <Button
            variant="gold"
            size="md"
            icon={Send}
            onClick={handleOpenSendModal}
          >
            {isRtl ? 'إرسال إشعار جديد' : 'Send Push Notice'}
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* E2E TESTING & SIMULATION SUITE PANEL                     */}
      {/* ======================================================== */}
      {isTestSuiteOpen && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gold-300/70 ring-4 ring-gold-400/10 shadow-card animate-fade-in space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/70">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/70 flex items-center justify-center shrink-0">
                <FlaskConical className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-chocolate-900">
                  {isRtl ? 'معمل اختبار ومحاكاة نظام الإشعارات (Push & Real-time Testing Suite)' : 'Push & Real-time Notification Testing Suite'}
                </h3>
                <p className="text-[13px] text-stone-500 mt-0.5">
                  {isRtl ? 'فحص وتجربة تسجيل الجهاز، استدعاء الـ APIs، ومحاكاة أحداث Pusher الصوتية والمرئية فورياً' : 'Direct tools to test device registration, call APIs, and simulate live Pusher/Echo events'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testConsoleLogs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setTestConsoleLogs([])}
                  className="!text-rose-600 hover:!bg-rose-50"
                >
                  {isRtl ? 'مسح السجل' : 'Clear Log'}
                </Button>
              )}
            </div>
          </div>

          {/* Two Columns Grid: Actions & Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Test Buttons (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Group 1: Device Registration */}
              <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-chocolate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-gold-600" />
                    {isRtl ? 'تسجيل وإلغاء تسجيل جهاز الأدمن (Device Token)' : 'Admin Device Registration'}
                  </span>
                  <span className="text-[11px] text-stone-400" dir="ltr">/notifications/*-device</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={testActionLoading === 'register'}
                    onClick={handleTestRegisterDevice}
                    className=""
                  >
                    {isRtl ? '1. تسجيل الجهاز الآن (Register Device)' : '1. Register Device'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={testActionLoading === 'unregister'}
                    onClick={handleTestUnregisterDevice}
                    className="!text-rose-600 hover:!bg-rose-50 hover:!border-rose-200"
                  >
                    {isRtl ? '2. إلغاء تسجيل الجهاز (Unregister Device)' : '2. Unregister Device'}
                  </Button>
                </div>
              </div>

              {/* Group 2: Real-time Pusher/Echo Simulation */}
              <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-chocolate-900 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-600" />
                    {isRtl ? 'محاكاة وصول إشعار لحظي (Real-time Simulation)' : 'Simulate Live Notification Event'}
                  </span>
                  <span className="inline-flex items-center h-5 px-1.5 rounded-full text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70">
                    Chime + Toast + Badge
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateNewOrder}
                    className="hover:!bg-emerald-50 hover:!border-emerald-200"
                  >
                    {isRtl ? 'أوردر جديد 🎉 (admin_new_order)' : 'New Order 🎉'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateBillRequested}
                    className="hover:!bg-amber-50 hover:!border-amber-200"
                  >
                    {isRtl ? 'طلب حساب طاولة 💰 (admin_bill_requested)' : 'Bill Requested 💰'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateNewRound}
                    className="hover:!bg-sky-50 hover:!border-sky-200"
                  >
                    {isRtl ? 'جولة طاولة جديدة ☕ (admin_new_round)' : 'New Round ☕'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateNewBooking}
                    className="hover:!bg-violet-50 hover:!border-violet-200"
                  >
                    {isRtl ? 'حجز غرفة جديد 📅 (admin_new_booking)' : 'New Room Booking 📅'}
                  </Button>
                </div>
              </div>

              {/* Group 3: Optimistic Read & Read All */}
              <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-chocolate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    {isRtl ? 'اختبار تعليم الإشعارات كمقروءة (Mark as Read)' : 'Mark as Read Tests'}
                  </span>
                  <span className="text-[11px] text-stone-400">Optimistic UI</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={testActionLoading === 'markOne'}
                    onClick={handleTestMarkFirstRead}
                    className=""
                  >
                    {isRtl ? 'تعليم أول إشعار كمقروء' : 'Mark First Unread'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={testActionLoading === 'markAll'}
                    onClick={handleTestMarkAllRead}
                    className=""
                  >
                    {isRtl ? 'تعليم الكل كمقروء (Read All)' : 'Mark All Read'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Terminal Console (5 cols) */}
            <div className="lg:col-span-5 bg-chocolate-950 text-stone-200 rounded-xl p-4 text-xs ring-1 ring-inset ring-white/10 flex flex-col justify-between max-h-80 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-2 text-xs text-gold-300 font-semibold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'سجل استجابات الـ API (Live Console)' : 'API Live Output'}</span>
                </div>
                <span className="text-[11px] text-stone-400 tabular-nums">
                  {testConsoleLogs.length} {isRtl ? 'عملية' : 'events'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {testConsoleLogs.length === 0 ? (
                  <div className="text-stone-500 text-center py-10 text-[11px]">
                    {isRtl ? 'انقر على أي زر اختبار بالأعلى لرؤية الاستجابة المباشرة هنا...' : 'Click any test action above to see live JSON output...'}
                  </div>
                ) : (
                  testConsoleLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-lg text-[11px] border ${
                        log.isError
                          ? 'bg-rose-950/50 border-rose-700/50 text-rose-300'
                          : 'bg-white/5 border-white/10 text-gold-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400 mb-1">
                        <span className="font-semibold text-stone-300 break-all">{log.action}</span>
                        <span>{log.time}</span>
                      </div>
                      <pre className="text-[11px] whitespace-pre-wrap break-all leading-snug text-stone-200 font-mono" dir="ltr">
                        {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Total */}
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col group ${
            activeFilter === 'all'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/70">
              <Bell className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[13px] font-medium text-stone-500 leading-snug line-clamp-2">
              {isRtl ? 'إجمالي الإشعارات المسجلة' : 'Total Notifications'}
            </span>
            {activeFilter === 'all' && <span className="ms-auto w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
          </div>
          <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {totalCount}
          </div>
          <div className={`mt-2 text-xs ${activeFilter === 'all' ? 'text-gold-700 font-medium' : 'text-stone-500'}`}>
            {activeFilter === 'all' ? (isRtl ? 'معروضة حالياً' : 'Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
          </div>
        </div>

        {/* Unread */}
        <div
          onClick={() => setActiveFilter('unread')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col group ${
            activeFilter === 'unread'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-200/60">
              <AlertCircle className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[13px] font-medium text-stone-500 leading-snug line-clamp-2">
              {isRtl ? 'إشعارات غير مقروءة' : 'Unread Alerts'}
            </span>
            {activeFilter === 'unread' && <span className="ms-auto w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
          </div>
          <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {unreadCount}
          </div>
          <div className={`mt-2 text-xs ${activeFilter === 'unread' ? 'text-gold-700 font-medium' : 'text-stone-500'}`}>
            {activeFilter === 'unread' ? (isRtl ? 'معروضة حالياً' : 'Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
          </div>
        </div>

        {/* Table Orders & Bills */}
        <div
          onClick={() => setActiveFilter('orders')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col group ${
            activeFilter === 'orders'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200/60">
              <Coffee className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[13px] font-medium text-stone-500 leading-snug line-clamp-2">
              {isRtl ? 'طلبات وحسابات الطاولات' : 'Table Orders & Bills'}
            </span>
            {activeFilter === 'orders' && <span className="ms-auto w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
          </div>
          <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {notifications.filter(n => n.type?.includes('round') || n.type?.includes('bill')).length}
          </div>
          <div className={`mt-2 text-xs ${activeFilter === 'orders' ? 'text-gold-700 font-medium' : 'text-stone-500'}`}>
            {activeFilter === 'orders' ? (isRtl ? 'معروضة حالياً' : 'Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
          </div>
        </div>

        {/* Room Bookings */}
        <div
          onClick={() => setActiveFilter('bookings')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col group ${
            activeFilter === 'bookings'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200/60">
              <DoorOpen className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[13px] font-medium text-stone-500 leading-snug line-clamp-2">
              {isRtl ? 'حجوزات غرف VIP' : 'VIP Room Bookings'}
            </span>
            {activeFilter === 'bookings' && <span className="ms-auto w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
          </div>
          <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {notifications.filter(n => n.type?.includes('booking')).length}
          </div>
          <div className={`mt-2 text-xs ${activeFilter === 'bookings' ? 'text-gold-700 font-medium' : 'text-stone-500'}`}>
            {activeFilter === 'bookings' ? (isRtl ? 'معروضة حالياً' : 'Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/50 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: isRtl ? 'الكل' : 'All' },
            { id: 'unread', label: isRtl ? 'غير المقروءة' : 'Unread' },
            { id: 'orders', label: isRtl ? 'طلبات الطاولات' : 'Orders' },
            { id: 'bookings', label: isRtl ? 'حجوزات القاعات' : 'Bookings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`h-8 px-3 rounded-lg text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                  : 'font-medium text-stone-500 hover:text-chocolate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث في عنوان أو نص الإشعار..." : "Search notification title or body..."}
            className="w-full h-10 ps-10 pe-3 text-sm text-chocolate-900 bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition placeholder:text-stone-400"
          />
          <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Notifications List Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-stone-200/70 shadow-card animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200/70 text-center space-y-3 shadow-card">
          <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-chocolate-900">
            {isRtl ? 'لا توجد إشعارات مطابقة' : 'No notifications found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {isRtl ? 'يمكنك التبديل إلى "الكل" أو إرسال إشعار جديد لمستخدمي التطبيق.' : 'Switch to "All" or broadcast a new notification.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
          >
            {isRtl ? 'عرض كافة الإشعارات' : 'View All Notifications'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const style = getNotificationStyle(notif.type);
            const Icon = style.icon;
            const timeAgo = notif.created_at
              ? new Date(notif.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '';

            return (
              <div
                key={notif.id}
                onClick={async () => {
                  if (!notif.is_read) {
                    await handleMarkAsRead(notif);
                  }
                  if (notif.data?.order_id) {
                    if (onViewOrder) {
                      onViewOrder({ id: notif.data.order_id });
                    } else if (onNavigate) {
                      onNavigate('orders');
                    }
                  } else if (notif.data?.booking_id && onNavigate) {
                    onNavigate('facilities-rooms');
                  }
                }}
                className={`relative bg-white rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer shadow-card hover:shadow-luxury hover:border-stone-300/70 group ${
                  !notif.is_read
                    ? 'border-gold-300/70 bg-gold-50/30'
                    : 'border-stone-200/70'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-chocolate-900">
                        {notif.title}
                      </h4>
                      <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200/70">
                        {style.badge}
                      </span>
                      {!notif.is_read && (
                        <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold bg-gold-50 text-gold-800 border border-gold-200/70">
                          {isRtl ? 'جديد' : 'New'}
                        </span>
                      )}
                    </div>

                    <p className="text-[13px] text-stone-600 leading-relaxed">
                      {notif.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 pt-0.5 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{timeAgo}</span>
                      </span>
                      <span className="text-stone-400">#{notif.id}</span>
                      {notif.data?.order_id && (
                        <span className="font-semibold text-chocolate-800">
                          {isRtl ? `طلب #${notif.data.order_id}` : `Order #${notif.data.order_id}`}
                        </span>
                      )}
                      {notif.data?.booking_id && (
                        <span className="font-semibold text-sky-700">
                          {isRtl ? `حجز #${notif.data.booking_id}` : `Booking #${notif.data.booking_id}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!notif.is_read ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Check}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif);
                      }}
                    >
                      {isRtl ? 'تعليم كمقروء' : 'Mark Read'}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center h-8 px-2 text-xs text-stone-400 font-medium">
                      {isRtl ? 'تمت القراءة ✓' : 'Read ✓'}
                    </span>
                  )}

                  {notif.data?.order_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ShoppingBag}
                      className="text-chocolate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!notif.is_read) handleMarkAsRead(notif);
                        if (onViewOrder) {
                          onViewOrder({ id: notif.data.order_id });
                        } else if (onNavigate) {
                          onNavigate('orders');
                        }
                      }}
                    >
                      {isRtl ? 'فتح الطلب' : 'View Order'}
                    </Button>
                  )}

                  {notif.data?.booking_id && onNavigate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={DoorOpen}
                      className="!text-sky-700 hover:!bg-sky-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!notif.is_read) handleMarkAsRead(notif);
                        onNavigate('facilities-rooms');
                      }}
                    >
                      {isRtl ? 'فتح الحجز' : 'View Booking'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-200/70">
              <span className="text-xs text-stone-500 font-medium tabular-nums">
                {isRtl ? `صفحة ${currentPage} من ${lastPage}` : `Page ${currentPage} of ${lastPage}`}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  icon={isRtl ? ChevronRight : ChevronLeft}
                >
                  {isRtl ? 'السابق' : 'Previous'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= lastPage}
                  onClick={() => handlePageChange(currentPage + 1)}
                  icon={isRtl ? ChevronLeft : ChevronRight}
                >
                  {isRtl ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SEND NOTIFICATION MODAL (POST /admin/notifications)     */}
      {/* ======================================================== */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title={isRtl ? "إرسال إشعار فوري جديد (Push Notification)" : "Send Push Notification"}
        subtitle={isRtl ? "إرسال إشعار عام لكل مستخدمي التطبيق أو إشعار مخصص لمستخدم محدد" : "Broadcast notification to all users or send to a specific customer"}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSendModalOpen(false)}
              disabled={sending}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              icon={Send}
              loading={sending}
              onClick={handleSendNotification}
            >
              {isRtl ? 'إرسال الإشعار الآن' : 'Send Notification'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendNotification} className="space-y-4 text-sm">
          {/* Audience Selector: All vs Specific */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'المستهدفون بالإشعار (Audience) *' : 'Target Audience *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSendAudience('all')}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-3 ${
                  sendAudience === 'all'
                    ? 'border-gold-400 bg-gold-50/40 ring-4 ring-gold-400/15 text-chocolate-900'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  sendAudience === 'all' ? 'bg-gold-100 text-gold-800 ring-1 ring-inset ring-gold-200/70' : 'bg-stone-100 text-stone-500'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{isRtl ? 'جميع المستخدمين' : 'All App Users'}</div>
                  <div className="text-[11px] text-stone-500 font-normal">{isRtl ? 'إرسال عام لكل الأجهزة' : 'Broadcast to all'}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendAudience('specific')}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-3 ${
                  sendAudience === 'specific'
                    ? 'border-gold-400 bg-gold-50/40 ring-4 ring-gold-400/15 text-chocolate-900'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  sendAudience === 'specific' ? 'bg-gold-100 text-gold-800 ring-1 ring-inset ring-gold-200/70' : 'bg-stone-100 text-stone-500'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{isRtl ? 'مستخدم محدد' : 'Specific User'}</div>
                  <div className="text-[11px] text-stone-500 font-normal">{isRtl ? 'تحديد عميل بالاسم أو الهاتف' : 'Single customer'}</div>
                </div>
              </button>
            </div>
          </div>

          {/* User Selection if Specific */}
          {sendAudience === 'specific' && (
            <div className="p-4 rounded-xl border border-stone-200/70 space-y-2">
              <label className="block text-[13px] font-semibold text-chocolate-800">
                {isRtl ? 'اختر المستخدم المستهدف *' : 'Select Target Customer *'}
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                required
              >
                <option value="">{isRtl ? '-- اختر عميل من القائمة --' : '-- Select a Customer --'}</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phone || u.email || `#${u.id}`}) - #{u.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Titles: Arabic & English */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'عنوان الإشعار (بالعربية) *' : 'Notice Title (Arabic) *'}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: خصم 20% اليوم"
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'عنوان الإشعار (بالإنجليزية) *' : 'Notice Title (English) *'}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. 20% Off Today"
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Body: Arabic & English */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'نص الإشعار (بالعربية) *' : 'Notice Body (Arabic) *'}
              </label>
              <textarea
                rows={2}
                value={bodyAr}
                onChange={(e) => setBodyAr(e.target.value)}
                placeholder="استمتع بخصم خاص على جميع مشروبات الإسبريسو..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'نص الإشعار (بالإنجليزية) *' : 'Notice Body (English) *'}
              </label>
              <textarea
                rows={2}
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                placeholder="Enjoy special discount on all espresso drinks..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition resize-none"
                required
              />
            </div>
          </div>

          {/* Image Attachment (Optional) */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'صورة الإشعار (اختياري)' : 'Attached Banner/Image (Optional)'}
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs text-stone-500 file:me-3 file:h-8 file:px-3 file:rounded-lg file:border file:border-solid file:border-stone-200 file:text-xs file:font-semibold file:bg-white file:text-chocolate-800 hover:file:bg-stone-50 cursor-pointer"
              />
            </div>

            {attachedImagePreview && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200/70 mt-2 group">
                <img src={attachedImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/55 hover:bg-rose-600 backdrop-blur text-white flex items-center justify-center text-[11px] cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
