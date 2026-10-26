import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
import { useAdminRealtime } from '../useAdminRealtime';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();
  const { isRtl } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Play synthesized notification chime
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }, []);

  const fetchLockRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Fetch paginated notifications list and unread count
  const fetchNotifications = useCallback(async (page = 1, force = false) => {
    if (!isAuthenticated) return;
    if (fetchLockRef.current && !force) return;
    fetchLockRef.current = true;

    try {
      setLoading(true);
      const [notifsRes, countRes] = await Promise.allSettled([
        api.getNotifications(page),
        api.getUnreadNotificationsCount()
      ]);

      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        const res = notifsRes.value;
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setNotifications(list);
        setCurrentPage(res?.current_page || page);
        setLastPage(res?.last_page || 1);
        setTotalCount(res?.total || list.length);
      }

      if (countRes.status === 'fulfilled') {
        setUnreadCount(Number(countRes.value) || 0);
      }
    } catch (err) {
      console.error('[NotificationContext] fetch error:', err);
    } finally {
      setLoading(false);
      fetchLockRef.current = false;
    }
  }, [isAuthenticated]);

  // Initial load on mount or auth change (guarded against StrictMode double-fire)
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        fetchNotifications(1);
      }
    } else {
      hasLoadedRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchNotifications]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await api.markNotificationAsRead(id);
      return res;
    } catch (err) {
      console.warn('[NotificationContext] markAsRead error:', err);
      // Revert if needed
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const res = await api.markAllNotificationsAsRead();
      toast.success(res?.message || (isRtl ? 'تم تعليم كل الإشعارات كمقروءة' : 'All notifications marked as read'));
      return res;
    } catch (err) {
      console.error('[NotificationContext] markAllAsRead error:', err);
      toast.error(isRtl ? 'فشل تعليم الإشعارات كمقروءة' : 'Failed to mark all as read');
    }
  }, [isRtl, toast]);

  // Send notification (to all or specific user)
  const sendNotification = useCallback(async (payload) => {
    try {
      const res = await api.sendNotification(payload);
      const recipientCount = res?.recipients_count;
      const countMsg = recipientCount ? ` (${recipientCount} ${isRtl ? 'مستلم' : 'recipients'})` : '';
      toast.success((res?.message || (isRtl ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully')) + countMsg);
      await fetchNotifications(1);
      return res;
    } catch (err) {
      const msg = err.message || (isRtl ? 'فشل إرسال الإشعار' : 'Failed to send notification');
      toast.error(msg);
      throw err;
    }
  }, [isRtl, toast, fetchNotifications]);

  // Real-time integration: listen to private 'admin' channel
  const { connectionState } = useAdminRealtime(token, (event) => {
    if (!event) return;
    playNotificationSound();

    const title = (typeof event.title === 'string' ? event.title : (isRtl ? event.title?.ar : (event.title?.en || event.title?.ar)))
      || (typeof event.data?.title === 'string' ? event.data.title : (isRtl ? event.data?.title?.ar : event.data?.title?.en))
      || (isRtl ? 'إشعار جديد' : 'New Notification');

    const body = (typeof event.body === 'string' ? event.body : (isRtl ? event.body?.ar : (event.body?.en || event.body?.ar)))
      || (typeof event.data?.body === 'string' ? event.data.body : (isRtl ? event.data?.body?.ar : event.data?.body?.en))
      || '';

    const newNotification = {
      id: event.id || event.data?.id || (Date.now() + Math.floor(Math.random() * 1000)),
      user_id: event.user_id || event.data?.user_id || null,
      type: event.type || event.data?.type || 'notification',
      title: title,
      body: body,
      data: event.data || {},
      image_url: event.image_url || null,
      created_at: event.created_at || new Date().toISOString(),
      is_read: false
    };

    // Prepend immediately to state, ensuring no duplicate ID
    setNotifications((prev) => {
      if (prev.some((n) => String(n.id) === String(newNotification.id))) {
        return prev;
      }
      return [newNotification, ...prev];
    });

    // Increment unread count & total
    setUnreadCount((prev) => prev + 1);
    setTotalCount((prev) => prev + 1);

    // Show Toast
    toast(title, body);

    // Dispatch custom window event
    window.dispatchEvent(new CustomEvent('notification:received', { detail: newNotification }));
  });

  // Register current device for push notifications
  const registerDevice = useCallback(async (payload = {}) => {
    try {
      const res = await api.registerDevice(payload);
      toast.success(res?.message || (isRtl ? 'تم تسجيل الجهاز للإشعارات' : 'Device registered for notifications'));
      return res;
    } catch (err) {
      console.warn('[NotificationContext] registerDevice error:', err);
      toast.error(err.message || (isRtl ? 'فشل تسجيل الجهاز' : 'Failed to register device'));
      throw err;
    }
  }, [isRtl, toast]);

  // Unregister device
  const unregisterDevice = useCallback(async (payload = {}) => {
    try {
      const res = await api.unregisterDevice(payload);
      toast.success(res?.message || (isRtl ? 'تم إلغاء تسجيل الجهاز من الإشعارات' : 'Device unregistered from notifications'));
      return res;
    } catch (err) {
      console.warn('[NotificationContext] unregisterDevice error:', err);
      toast.error(err.message || (isRtl ? 'فشل إلغاء تسجيل الجهاز' : 'Failed to unregister device'));
      throw err;
    }
  }, [isRtl, toast]);

  // Simulation suite method to trigger local real-time event
  const simulateRealtimeNotification = useCallback((custom = {}) => {
    playNotificationSound();

    const type = custom.type || 'admin_new_order';
    const title = custom.title || (isRtl ? 'طلب جديد على طاولة 1' : 'New Order on Table 1');
    const body = custom.body || (isRtl ? 'كابتشينو مخملي بقيمة 120 ج.م' : 'Velvet Cappuccino for 120 EGP');
    const notifId = Date.now();

    const simNotification = {
      id: notifId,
      user_id: 13,
      type: type,
      title: title,
      body: body,
      data: custom.data || { type, order_id: 9999, round_id: 1 },
      image_url: null,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setNotifications((prev) => [simNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    setTotalCount((prev) => prev + 1);

    toast(title, body);

    window.dispatchEvent(new CustomEvent('notification:received', { detail: simNotification }));
    return simNotification;
  }, [isRtl, playNotificationSound, toast]);

  return (
    <NotificationContext.Provider
      value={{
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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
