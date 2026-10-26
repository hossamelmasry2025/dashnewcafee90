import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Coffee,
  AlertCircle,
  FileText,
  CreditCard,
  Sparkles,
  XCircle,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  Volume2,
  Trash2,
  Copy,
  Check,
  Flame,
  ShoppingBag,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useAdminRealtime } from '../../../useAdminRealtime';

// Icon tints for the status filter cards
const STAT_TINTS = {
  all: 'bg-gold-50 text-gold-700 ring-gold-200/70',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  received: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  confirmed: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  rejected: 'bg-rose-50 text-rose-600 ring-rose-200/60'
};
export const OrdersView = ({ selectedOrderToView = null, onClearSelectedOrder }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const { token } = useAuth();
  const [rawOrders, setRawOrders] = useState([]);
  const setOrders = useCallback((updater) => {
    setRawOrders(updater);
  }, []);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeState, setRealtimeState] = useState('connecting');
  const [lastNewOrderId, setLastNewOrderId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [hasSimulatedOrders, setHasSimulatedOrders] = useState(() => {
    try {
      return Boolean(localStorage.getItem('cafe90_simulated_orders'));
    } catch {
      return false;
    }
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, confirmed, rejected, open, preparing, ready, completed
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // all, cash, points
  const [diningFilter, setDiningFilter] = useState('all'); // all, dine-in, takeaway, room
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Details Modal
  const [viewingOrder, setViewingOrder] = useState(null);
  // Receipt Print Preview Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  // Transfer Receipt Image Lightbox Preview
  const [previewReceiptImage, setPreviewReceiptImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Dialog State
  const [rejectDialogOrder, setRejectDialogOrder] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const formatDiningType = (type) => {
    if (!type) return isRtl ? 'تيك اواي' : 'Takeaway';
    const lower = String(type).toLowerCase();
    if (lower === 'dine-in' || lower === 'dine_in' || lower === 'dinein' || lower.includes('dine') || lower.includes('صالة') || lower.includes('صاله') || lower.includes('طاولة')) {
      return isRtl ? 'صاله (طاولة)' : 'Dine-in (Table)';
    }
    if (lower === 'room' || lower.includes('vip') || lower.includes('غرفة') || lower.includes('غرفه')) {
      return isRtl ? 'غرفة VIP' : 'VIP Room';
    }
    if (lower === 'takeaway' || lower.includes('سفري') || lower.includes('تيك') || lower.includes('كاونتر')) {
      return isRtl ? 'تيك اواي (سفري)' : 'Takeaway';
    }
    return type;
  };

  const isTakeawayOrder = (order) => {
    if (!order) return false;
    const rawType = String(order.type || order.order_type || order.orderType || order.diningType || order.raw?.type || order.raw?.order_type || '').toLowerCase();
    const hasTable = Boolean(order.tableNumber || order.table_number || order.raw?.table_number);
    if (hasTable) return false;
    if (rawType.includes('dine') || rawType.includes('صالة') || rawType.includes('صاله') || rawType.includes('room') || rawType.includes('غرف')) {
      return false;
    }
    if (rawType === 'takeaway' || rawType.includes('سفري') || rawType.includes('تيك')) {
      return true;
    }
    return order.isTakeaway !== undefined ? Boolean(order.isTakeaway) : false;
  };

  const formatOrderStatus = (status, order = null) => {
    if (!status) return isRtl ? 'غير محدد' : 'Unknown';
    const s = String(status).toLowerCase();
    const isTakeaway = order ? isTakeawayOrder(order) : true;

    if (s === 'pending' || s === 'new') {
      return isRtl ? 'قيد الانتظار' : 'Pending';
    }
    if (s === 'confirmed') {
      if (isTakeaway) {
        return isRtl ? 'جاري التجهيز' : 'Preparing';
      }
      return isRtl ? 'تم الاستلام' : 'Received';
    }
    if (s === 'ready') {
      return isRtl ? 'منتظر الاستلام' : 'Ready for Pickup';
    }
    if (s === 'completed' || s === 'delivered' || s === 'served') {
      if (isTakeaway) {
        return isRtl ? 'تم الاستلام' : 'Completed';
      }
      return isRtl ? 'مكتمل' : 'Completed';
    }
    if (s === 'received') {
      return isRtl ? 'تم الاستلام' : 'Received';
    }
    if (s === 'preparing' || s === 'in_kitchen' || s === 'in_preparation') {
      return isRtl ? 'جاري التجهيز' : 'Preparing';
    }
    if (s === 'open') {
      return isRtl ? 'طاولة مفتوحة' : 'Open Tab';
    }
    if (s === 'rejected' || s === 'cancelled') {
      return isRtl ? 'مرفوض' : 'Rejected';
    }
    return status;
  };

  const formatPaymentMethod = (method) => {
    if (!method) return isRtl ? 'نقداً (كاش)' : 'Cash';
    const m = String(method).toLowerCase();
    if (m.includes('vodafone')) return isRtl ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash';
    if (m.includes('insta')) return isRtl ? 'انستاباي (InstaPay)' : 'InstaPay';
    if (m.includes('orange')) return isRtl ? 'أورنج كاش (Orange Cash)' : 'Orange Cash';
    if (m.includes('etisalat')) return isRtl ? 'اتصالات كاش (Etisalat Cash)' : 'Etisalat Cash';
    if (m.includes('we')) return isRtl ? 'وي باي (WE Pay)' : 'WE Pay';
    if (m.includes('card') || m.includes('visa') || m.includes('credit')) return isRtl ? 'بطاقة بنكية / فيزا' : 'Credit / Debit Card';
    if (m.includes('point')) return isRtl ? 'نقاط الولاء' : 'Loyalty Points';
    if (m === 'cash' || m.includes('نقدا') || m.includes('كاش')) return isRtl ? 'كاش (نقداً)' : 'Cash';
    return method;
  };

  const normalizeOrder = (o) => {
    if (!o) return null;

    // Collect all items from rounds if available, or fallback to root items
    let rawItems = [];
    if (Array.isArray(o.rounds) && o.rounds.length > 0) {
      o.rounds.forEach((r) => {
        if (Array.isArray(r.items)) {
          r.items.forEach((it) => {
            rawItems.push({
              ...it,
              roundId: r.id,
              roundStatus: r.status
            });
          });
        }
      });
    }

    if (rawItems.length === 0) {
      if (Array.isArray(o.items) && o.items.length > 0) {
        rawItems = o.items;
      } else if (Array.isArray(o.order_items) && o.order_items.length > 0) {
        rawItems = o.order_items;
      } else if (Array.isArray(o.cart_items) && o.cart_items.length > 0) {
        rawItems = o.cart_items;
      }
    }

    const items = rawItems.map((i) => ({
      id: i.id || Math.random(),
      itemId: i.item_id || i.itemId,
      name: (isRtl ? (i.item?.name_ar || i.name_ar || i.name || i.item?.name) : (i.item?.name_en || i.name_en || i.name || i.item?.name)) || (isRtl ? 'منتج كافيه 90' : 'Cafe 90 Item'),
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.price || i.unit_price || 0),
      totalPrice: Number(i.total_price || (Number(i.price || i.unit_price || 0) * (Number(i.quantity) || 1))),
      imageUrl: i.image_url || i.item?.image_url || null,
      note: i.note || '',
      customizations: Array.isArray(i.customizations) ? i.customizations : [],
      roundId: i.roundId,
      roundStatus: i.roundStatus
    }));

    const rawType = String(o.order_type || o.orderType || o.type || o.diningType || (o.table_number || o.tableNumber ? 'dine-in' : 'takeaway')).toLowerCase();
    let diningType = 'takeaway';
    if (rawType.includes('dine') || rawType.includes('صالة') || rawType.includes('صاله') || rawType.includes('طاولة')) {
      diningType = 'dine-in';
    } else if (rawType.includes('room') || rawType.includes('vip') || rawType.includes('غرف')) {
      diningType = 'room';
    }

    const isTakeaway = diningType === 'takeaway' && !o.table_number && !o.tableNumber;

    // Handle receipt image URL (ensure full URL if relative)
    let receiptImage = o.receipt_image || o.receipt_image_url || o.transfer_receipt || null;
    if (receiptImage && typeof receiptImage === 'string') {
      if (!receiptImage.startsWith('http') && !receiptImage.startsWith('data:')) {
        const clean = receiptImage.startsWith('/') ? receiptImage.slice(1) : receiptImage;
        if (clean.startsWith('storage/')) {
          receiptImage = `https://backend.ninety90degree.com/public/${clean}`;
        } else {
          receiptImage = `https://backend.ninety90degree.com/public/storage/${clean}`;
        }
      }
    }

    const source = (o.order && typeof o.order === 'object') ? o.order : o;
    // Transferred From Number: explicitly prioritize transferred_from_number entered in form
    const transferredFromNumber = source.transferred_from_number || 
                                  source.transferred_from_phone || 
                                  source.sender_phone || 
                                  source.sender_number || 
                                  source.transfer_phone || 
                                  o.transferred_from_number || 
                                  o.transferred_from_phone || '';
    const senderName = source.sender_name || source.transferred_from_name || source.transfer_sender_name || source.user?.name || o.sender_name || '';
    const customerPhone = source.user_phone || source.customer_phone || source.user?.phone || source.customerPhone || o.user_phone || '—';
    const customerName = source.user?.name || source.user_name || source.customer_name || source.customerName || (isRtl ? 'عميل كافيه 90' : 'Cafe 90 Guest');

    return {
      id: o.id,
      orderNumber: o.order_number || o.id,
      customerName,
      customerPhone,
      customerEmail: source.user?.email || source.user_email || source.customerEmail || o.user?.email || '—',
      customerAvatar: source.user?.avatar_url || o.user?.avatar_url || null,
      senderName,
      senderPhone: transferredFromNumber,
      transferredFromNumber,
      orderType: o.order_type || o.orderType || o.type || diningType,
      diningType,
      isTakeaway,
      tableNumber: o.table_number || o.tableNumber || '',
      paymentMethod: o.payment_method || o.paymentMethod || 'cash',
      paymentType: o.payment_type || o.paymentType || 'cash',
      paymentStatus: o.payment_status || (o.status === 'completed' ? 'paid' : 'pending'),
      totalPrice: (() => {
        return Number(o.total || o.total_price || o.totalPrice || source.total || source.total_price || 0);
      })(),
      subtotal: (() => {
        const itemsTotal = items.reduce((acc, it) => acc + (it.totalPrice || (it.unitPrice * it.quantity)), 0);
        if (itemsTotal > 0) return itemsTotal;
        return Number(o.subtotal || source.subtotal || o.total || o.total_price || 0);
      })(),
      discount: Number(o.discount || source.discount || 0),
      tip: (() => {
        const rawTip = source.tips ?? source.tip ?? source.tip_amount ?? source.tips_amount ?? source.tips_value ?? source.tip_value ?? source.gratuity ??
                       o.tips ?? o.tip ?? o.tip_amount ?? o.tips_amount ?? o.tips_value ?? o.tip_value ?? o.gratuity;
        if (rawTip !== null && rawTip !== undefined && !isNaN(Number(rawTip))) {
          return Number(rawTip);
        }
        // Dynamic deduction if total exceeds subtotal - discount + serviceFee
        const tot = Number(o.total || o.total_price || o.totalPrice || source.total || 0);
        const sub = items.reduce((acc, it) => acc + (it.totalPrice || (it.unitPrice * it.quantity)), 0) || Number(o.subtotal || source.subtotal || 0);
        const disc = Number(o.discount || source.discount || 0);
        const serv = Number(o.service_fee || source.service_fee || 0);
        const diff = tot - (sub - disc + serv);
        return diff > 0 ? Number(diff.toFixed(2)) : 0;
      })(),
      tax: 0,
      serviceFee: Number(o.service_fee || source.service_fee || 0),
      couponCode: o.coupon_code || '',
      pointsEarned: o.points_earned || 0,
      pointsUsed: o.points_used || 0,
      status: (o.status || 'pending').toLowerCase(),
      adminNote: o.admin_note || o.adminNote || o.rejection_reason || o.reason || '',
      needsAttention: Boolean(o.needs_attention),
      itemsSummary: o.items_summary || (items.length > 0 ? items.map(it => `${it.quantity}x ${it.name}`).join('، ') : '—'),
      itemsCount: o.items_count || items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      confirmedAt: source.confirmed_at || o.confirmed_at || null,
      readyAt: source.ready_at || o.ready_at || null,
      completedAt: source.completed_at || o.completed_at || null,
      reviewedBy: o.reviewed_by || o.reviewedBy || null,
      notes: o.note || o.special_requests || o.notes || '',
      estimatedReadyTime: o.estimated_ready_time || '',
      receiptImage,
      createdAt: o.created_at || o.createdAt || new Date().toISOString(),
      updatedAt: o.updated_at || null,
      rounds: Array.isArray(o.rounds) ? o.rounds : [],
      items,
      raw: o
    };
  };

  // Synthesized chime audio for new real-time orders
  const playOrderChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }, []);

  const copyToClipboard = (text, id, label = '') => {
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      const msg = label
        ? (isRtl ? `تم نسخ ${label}: ${text}` : `Copied ${label}: ${text}`)
        : (isRtl ? `تم النسخ: ${text}` : `Copied: ${text}`);
      toast.success(msg);
    } catch (e) {}
  };

  const handleClearSimulatedOrders = () => {
    try {
      localStorage.removeItem('cafe90_simulated_orders');
      setHasSimulatedOrders(false);
      toast.success(isRtl ? 'تم مسح الطلبات التجريبية والاعتماد على السيرفر الفعلي' : 'Cleared simulated orders');
      loadOrders(false);
    } catch (e) {}
  };

  // Load orders dynamically from backend API
  const loadOrders = async (isInitial = false, force = false, targetStatus = statusFilter) => {
    try {
      if (isInitial || rawOrders.length === 0) setLoading(true);
      setIsRefreshing(true);
      const params = { per_page: 100, force: force || isInitial };
      if (paymentTypeFilter !== 'all') params.payment_type = paymentTypeFilter;
      
      let data = [];
      try {
        if (targetStatus === 'pending') {
          data = await api.getPendingOrders(params);
        } else if (targetStatus === 'open') {
          data = await api.getOpenOrders(params);
        } else {
          const queryParams = { ...params };
          if (targetStatus && targetStatus !== 'all') {
            queryParams.status = targetStatus;
          }
          data = await api.getOrders(queryParams);
        }
      } catch (err) {
        console.warn('Orders fetch error:', err);
        data = [];
      }

      const list = Array.isArray(data) ? data : (data.orders || data.data || []);
      
      // Load user simulated test orders if created
      let localOrders = [];
      try {
        const stored = localStorage.getItem('cafe90_simulated_orders');
        if (stored) {
          localOrders = JSON.parse(stored);
          setHasSimulatedOrders(localOrders.length > 0);
        } else {
          setHasSimulatedOrders(false);
        }
      } catch (e) {}

      const combined = [...localOrders, ...list.filter(o => !localOrders.some(lo => lo.id === o.id))];
      const normalized = combined.map(normalizeOrder).filter(Boolean);

      // Sort strictly newest first (by createdAt timestamp) so any new order is row #1!
      normalized.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setRawOrders(prev => {
        if (targetStatus === 'all' || prev.length === 0) {
          return normalized;
        }
        // Merge so stats counters for all other tabs stay populated
        const map = new Map(prev.map(o => [String(o.id), o]));
        normalized.forEach(o => map.set(String(o.id), o));
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return merged;
      });
    } catch (e) {
      toast.error(isRtl ? 'فشل تحميل الطلبات' : 'Failed to load orders');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAcknowledgeRound = async (orderId, roundId) => {
    try {
      setActionLoading(true);
      const res = await api.acknowledgeRound(orderId, roundId);
      toast.success(res?.message || (isRtl ? 'تم تأكيد استلام الجولة بالمطبخ وبدء التحضير' : 'Round acknowledged in kitchen'));
      
      if (viewingOrder && String(viewingOrder.id) === String(orderId)) {
        const updatedRounds = (viewingOrder.rounds || []).map(r => 
          String(r.id) === String(roundId) ? { ...r, status: 'preparing', acknowledged_at: new Date().toISOString() } : r
        );
        setViewingOrder(prev => ({ ...prev, rounds: updatedRounds }));
      }
      await loadOrders(false);
    } catch (err) {
      if (err?.status === 409 || (err?.message && err.message.includes('بالفعل'))) {
        toast.info(err.message || (isRtl ? 'الجولة دي اتأكدت بالفعل' : 'Round already acknowledged'));
      } else {
        toast.error(err.message || (isRtl ? 'فشل تأكيد استلام الجولة' : 'Failed to acknowledge round'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleServeRound = async (orderId, roundId) => {
    try {
      setActionLoading(true);
      const res = await api.serveRound(orderId, roundId);
      toast.success(res?.message || (isRtl ? 'تم تقديم ونزول الجولة للعميل على الطاولة بنجاح' : 'Round served to customer table'));
      
      if (viewingOrder && String(viewingOrder.id) === String(orderId)) {
        const updatedRounds = (viewingOrder.rounds || []).map(r => 
          String(r.id) === String(roundId) ? { ...r, status: 'served', served_at: new Date().toISOString() } : r
        );
        setViewingOrder(prev => ({ ...prev, rounds: updatedRounds }));
      }
      await loadOrders(false);
    } catch (err) {
      if (err?.status === 409 || (err?.message && err.message.includes('بالفعل'))) {
        toast.info(err.message || (isRtl ? 'الجولة دي اتقدمت بالفعل' : 'Round already served'));
      } else {
        toast.error(err.message || (isRtl ? 'فشل تقديم الجولة' : 'Failed to serve round'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadOrders(rawOrders.length === 0, false, statusFilter);
    return () => {
      isMounted = false;
    };
  }, [paymentTypeFilter, statusFilter]);

  // Real-time events subscription via Pusher & Laravel Echo (Shared Singleton)
  const { reconnect } = useAdminRealtime(
    token,
    (event) => {
      if (!event) return;
      const evType = String(event.type || event.data?.type || '').toLowerCase();
      if (evType.includes('booking')) return;

      playOrderChime();

      const affectedOrderId = event.data?.order_id || event.order_id || Date.now();
      setLastNewOrderId(affectedOrderId);

      // 1. Immediately refetch orders list without full-page loading spinner
      loadOrders(false, true);

      // 2. If the active viewing order was updated, refresh details
      if (viewingOrder && affectedOrderId && String(viewingOrder.id) === String(affectedOrderId)) {
        handleOpenOrderDetails({ id: affectedOrderId });
      }

      // 3. Show Toast notification using event.title.ar and event.body.ar
      const title = (isRtl ? event?.title?.ar : (event?.title?.en || event?.title?.ar)) || event?.title?.ar || (isRtl ? '🔔 وصول طلب / تحديث جديد' : 'New Order Alert');
      const body = (isRtl ? event?.body?.ar : (event?.body?.en || event?.body?.ar)) || event?.body?.ar || '';

      toast(title, body);
    },
    setRealtimeState
  );

  const handleManualReconnect = async () => {
    toast.info(isRtl ? 'جاري إعادة الاتصال بالبث المباشر وتحديث الطلبات...' : 'Reconnecting to real-time and refreshing orders...');
    if (reconnect) reconnect();
    await loadOrders(false, true);
  };

  // External order select
  useEffect(() => {
    if (selectedOrderToView) {
      setViewingOrder(normalizeOrder(selectedOrderToView));
      if (onClearSelectedOrder) onClearSelectedOrder();
    }
  }, [selectedOrderToView]);

  const updateLocalOrderStatus = (orderId, newStatus) => {
    try {
      const stored = localStorage.getItem('cafe90_simulated_orders');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        localStorage.setItem('cafe90_simulated_orders', JSON.stringify(updated));
      }
    } catch (e) {}
  };

  const handleOpenOrderDetails = async (order) => {
    setViewingOrder(order);
    try {
      const res = await api.getOrderDetails(order.id);
      if (res) {
        const fullOrder = normalizeOrder(res?.order || res);
        if (fullOrder) {
          setViewingOrder(fullOrder);
          setOrders(prev => prev.map(o => String(o.id) === String(order.id) ? fullOrder : o));
        }
      }
    } catch (err) {
      console.warn('Live order details fetch error:', err);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setActionLoading(true);
      const res = await api.confirmOrder(orderId);
      toast.success(res?.message || (isRtl ? 'تم تأكيد واستلام الطلب بنجاح' : 'Order confirmed successfully'));

      // Extract the updated order returned from server response payload
      const updatedOrderData = res?.order || (res?.id ? res : null);
      const newStatus = updatedOrderData?.status ? String(updatedOrderData.status).toLowerCase() : 'confirmed';

      setOrders(prev => prev.map(o => {
        if (String(o.id) === String(orderId)) {
          return updatedOrderData
            ? { ...o, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...o, status: newStatus };
        }
        return o;
      }));

      if (viewingOrder && String(viewingOrder.id) === String(orderId)) {
        setViewingOrder(prev => (
          updatedOrderData
            ? { ...prev, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...prev, status: newStatus }
        ));
      }

      updateLocalOrderStatus(orderId, newStatus);
      await loadOrders(false, true);
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تأكيد الطلب' : 'Failed to confirm order'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      setActionLoading(true);
      const res = await api.markOrderReady(orderId);
      toast.success(res?.message || (isRtl ? 'الطلب جاهز للاستلام وتم إشعار العميل' : 'Order marked ready for pickup'));

      const updatedOrderData = res?.order || (res?.id ? res : null);
      const newStatus = updatedOrderData?.status ? String(updatedOrderData.status).toLowerCase() : 'ready';

      setOrders(prev => prev.map(o => {
        if (String(o.id) === String(orderId)) {
          return updatedOrderData
            ? { ...o, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...o, status: newStatus };
        }
        return o;
      }));

      if (viewingOrder && String(viewingOrder.id) === String(orderId)) {
        setViewingOrder(prev => (
          updatedOrderData
            ? { ...prev, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...prev, status: newStatus }
        ));
      }

      updateLocalOrderStatus(orderId, newStatus);
      await loadOrders(false, true);
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تحويل حالة الطلب إلى جاهز' : 'Failed to mark order ready'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoading(true);
      const currentOrder = rawOrders.find(o => String(o.id) === String(orderId)) || viewingOrder;
      const isTakeaway = isTakeawayOrder(currentOrder);

      const res = await api.completeOrder(orderId);
      toast.success(res?.message || (isRtl ? 'تم إكمال الطلب بنجاح' : 'Order completed successfully'));

      const updatedOrderData = res?.order || (res?.id ? res : null);
      const newStatus = updatedOrderData?.status ? String(updatedOrderData.status).toLowerCase() : 'completed';

      setOrders(prev => prev.map(o => {
        if (String(o.id) === String(orderId)) {
          return updatedOrderData
            ? { ...o, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...o, status: newStatus };
        }
        return o;
      }));

      if (viewingOrder && String(viewingOrder.id) === String(orderId)) {
        setViewingOrder(prev => (
          updatedOrderData
            ? { ...prev, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...prev, status: newStatus }
        ));
      }

      updateLocalOrderStatus(orderId, newStatus);
      await loadOrders(false, true);
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل إكمال واستلام الطلب' : 'Failed to complete order'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectDialogOrder) return;
    const orderId = rejectDialogOrder.id;

    try {
      setActionLoading(true);
      const res = await api.rejectOrder(orderId, rejectNote);
      toast.success(res?.message || (isRtl ? 'تم رفض الطلب بنجاح' : 'Order rejected successfully'));

      const updatedOrderData = res?.order || (res?.id ? res : null);
      const newStatus = updatedOrderData?.status ? String(updatedOrderData.status).toLowerCase() : 'rejected';

      setOrders(prev => prev.map(o => {
        if (String(o.id) === String(orderId)) {
          return updatedOrderData
            ? { ...o, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...o, status: newStatus, adminNote: rejectNote };
        }
        return o;
      }));

      if (viewingOrder && String(viewingOrder.id) === String(orderId)) {
        setViewingOrder(prev => (
          updatedOrderData
            ? { ...prev, ...normalizeOrder(updatedOrderData), status: newStatus }
            : { ...prev, status: newStatus, adminNote: rejectNote }
        ));
      }

      updateLocalOrderStatus(orderId, newStatus);
      setRejectDialogOrder(null);
      setRejectNote('');
      await loadOrders(false, true);
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل رفض الطلب' : 'Failed to reject order'));
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate incoming live mobile order from guest
  const handleSimulateAppOrder = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const simulatedOrder = {
      id: randomId,
      order_number: `ORD-90-${randomId}`,
      customer_name: 'سارة المنصور',
      customer_phone: '01023456789',
      type: 'takeaway',
      payment_method: 'نقداً عند الاستلام (Cash)',
      payment_status: 'pending',
      total_price: 60,
      subtotal: 60,
      status: 'pending',
      special_requests: 'يرجى تسخين الحليب جيداً ووضع قرفة خفيفة على الوجه مع منديل إضافي',
      note: 'يرجى تسخين الحليب جيداً ووضع قرفة خفيفة على الوجه مع منديل إضافي',
      created_at: new Date().toISOString(),
      order_items: [
        {
          id: 1,
          name: 'كابتشينو مخملي',
          quantity: 1,
          price: 45,
          total_price: 60,
          customizations: [
            'الحجم: متوسط (Medium)',
            'درجة السكر: سكر وسط (Medium)',
            'نوع الحليب: حليب الشوفان (+15 ج.م)',
            'إضافات: شوت إسبريسو إضافي'
          ],
          note: 'الحجم: متوسط • حليب شوفان • سكر وسط'
        }
      ]
    };

    try {
      const stored = localStorage.getItem('cafe90_simulated_orders');
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem('cafe90_simulated_orders', JSON.stringify([simulatedOrder, ...list]));
    } catch (e) {}

    // Try to post to backend API too
    api.createOrder(simulatedOrder).catch(() => {});

    toast.success(
      isRtl
        ? '🔔 تم استلام طلب جديد من تطبيق الموبايل (العميلة: سارة المنصور - كابتشينو مخملي)!'
        : '🔔 New mobile app order received from Sarah Al-Mansour!'
    );

    setStatusFilter('all');
    loadOrders(false);
  };

  // Dynamic client-side filtered orders for the table view
  const orders = useMemo(() => {
    let list = rawOrders;

    if (statusFilter === 'pending') {
      list = list.filter(o => o.status === 'pending' || o.status === 'new');
    } else if (statusFilter === 'confirmed') {
      list = list.filter(o => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'received');
    } else if (statusFilter === 'ready') {
      list = list.filter(o => o.status === 'ready');
    } else if (statusFilter === 'open') {
      list = list.filter(o => o.status === 'open' || (o.diningType === 'dine-in' && o.status !== 'completed' && o.status !== 'rejected'));
    } else if (statusFilter === 'completed') {
      list = list.filter(o => o.status === 'completed');
    } else if (statusFilter === 'rejected') {
      list = list.filter(o => o.status === 'rejected' || o.status === 'cancelled');
    }

    if (diningFilter !== 'all') {
      list = list.filter(o => {
        if (diningFilter === 'dine-in') return o.diningType === 'dine-in' || o.diningType.includes('صالة') || o.diningType.includes('صاله');
        if (diningFilter === 'room') return o.diningType === 'room' || o.diningType.includes('vip') || o.diningType.includes('غرفة') || o.diningType.includes('غرفه');
        if (diningFilter === 'takeaway') return o.diningType === 'takeaway' || o.diningType.includes('سفري') || o.diningType.includes('تيك');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(o => 
        String(o.orderNumber).toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.tableNumber && String(o.tableNumber).toLowerCase().includes(q))
      );
    }

    return list;
  }, [rawOrders, statusFilter, diningFilter, searchQuery]);

  const stats = useMemo(() => {
    const pending = rawOrders.filter(o => o.status === 'pending' || o.status === 'new').length;
    const confirmed = rawOrders.filter(o => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'received').length;
    const ready = rawOrders.filter(o => o.status === 'ready').length;
    const openTabs = rawOrders.filter(o => o.status === 'open' || (o.diningType === 'dine-in' && o.status !== 'completed' && o.status !== 'rejected')).length;
    const completed = rawOrders.filter(o => o.status === 'completed').length;
    const rejected = rawOrders.filter(o => o.status === 'rejected' || o.status === 'cancelled').length;
    return {
      total: rawOrders.length,
      pending,
      confirmed,
      ready,
      openTabs,
      completed,
      rejected
    };
  }, [rawOrders]);

  const statusTabs = [
    { id: 'all', label: isRtl ? 'جميع الطلبات' : 'All Orders', count: stats.total, color: 'text-stone-700 bg-stone-100' },
    { id: 'pending', label: isRtl ? 'قيد الانتظار' : 'Pending', count: stats.pending, color: 'text-amber-700 bg-amber-100' },
    { id: 'confirmed', label: isRtl ? 'جاري التجهيز' : 'In Preparation', count: stats.confirmed, color: 'text-orange-700 bg-orange-100' },
    { id: 'ready', label: isRtl ? 'منتظر الاستلام' : 'Ready', count: stats.ready, color: 'text-blue-700 bg-blue-100' },
    { id: 'open', label: isRtl ? 'طاولات مفتوحة' : 'Open Tabs', count: stats.openTabs, color: 'text-indigo-700 bg-indigo-100' },
    { id: 'completed', label: isRtl ? 'تم الاستلام' : 'Completed', count: stats.completed, color: 'text-emerald-700 bg-emerald-100' },
    { id: 'rejected', label: isRtl ? 'مرفوض' : 'Rejected', count: stats.rejected, color: 'text-rose-700 bg-rose-100' }
  ];

  // Dedicated thermal POS receipt printer (targets 80mm roll without blank pages)
  const handlePrintReceipt = (order) => {
    if (!order) return;

    // Remove any previous print iframe
    const oldFrame = document.getElementById('print-receipt-iframe');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-receipt-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const itemsHtml = (order.items || []).map((i) => {
      const qty = i.quantity || 1;
      const unit = Number(i.unitPrice || 0);
      const total = Number(i.totalPrice || (unit * qty) || 0);
      return `
        <div style="margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px dotted #ccc;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; font-weight: 700; font-size: 12px;">
            <span style="flex: 1; text-align: right;">${qty}x ${i.name || ''}</span>
            <span style="font-family: monospace; white-space: nowrap; margin-right: 8px;">${total.toFixed(2)} EGP</span>
          </div>
          ${qty > 1 ? `<div style="font-size: 10px; color: #555; text-align: right;">(${unit.toFixed(2)} EGP للواحد)</div>` : ''}
          ${i.notes ? `<div style="font-size: 10px; color: #666; text-align: right; margin-top: 1px;">* ملاحظات: ${i.notes}</div>` : ''}
        </div>
      `;
    }).join('');

    const dateObj = new Date(order.createdAt);
    const orderDateStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '';
    const orderTimeStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      : '';

    const diningTypeStr = formatDiningType(order.diningType);
    const tableStr = order.tableNumber ? `(طاولة ${order.tableNumber})` : '';

    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const tip = Number(order.tip || 0);
    const serviceFee = Number(order.serviceFee || 0);
    const total = Number(order.totalPrice || 0);
    const points = Number(order.pointsEarned || 0);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة حساب - ${order.orderNumber || ''}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 2mm 3mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', 'Cairo', Tahoma, sans-serif;
            background: #ffffff;
            color: #000000;
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 3mm 0;
            font-size: 11px;
            line-height: 1.4;
            direction: rtl;
            text-align: right;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .bolder { font-weight: 900; }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
          }
          .double-divider {
            border-bottom: 2px dashed #000;
            margin: 7px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
          }
          .total-box {
            border: 2px solid #000;
            border-radius: 4px;
            padding: 6px 8px;
            margin: 7px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: 900;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="center">
          <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 2px;">CAFE 90</div>
          <div style="font-size: 11px; font-weight: bold;">القهوة • اللحظات • بارتقاء</div>
          <div style="font-size: 10px; margin-top: 2px; color: #222;">شرق النيل، بني سويف الجديدة</div>
          <div style="font-size: 10px; direction: ltr;">Hotline: +20 100 909 0900</div>
        </div>

        <div class="divider"></div>

        <!-- Order Meta -->
        <div>
          <div class="row">
            <span class="bold">فاتورة طلب:</span>
            <span class="bolder" style="font-size: 12px; font-family: monospace;" dir="ltr">#${order.orderNumber || ''}</span>
          </div>
          <div class="row">
            <span>التاريخ والوقت:</span>
            <span dir="ltr" style="font-size: 10px;">${orderDateStr} - ${orderTimeStr}</span>
          </div>
          <div class="row">
            <span>اسم العميل:</span>
            <span class="bold">${order.customerName || 'عميل نقدي'}</span>
          </div>
          <div class="row">
            <span>نوع الخدمة:</span>
            <span class="bold">${diningTypeStr} ${tableStr}</span>
          </div>
          ${order.paymentMethod ? `
          <div class="row">
            <span>طريقة الدفع:</span>
            <span>${order.paymentMethod === 'cash' ? 'نقداً (كاش)' : (order.paymentMethod === 'points' ? 'خصم نقاط' : order.paymentMethod)}</span>
          </div>` : ''}
        </div>

        <div class="divider"></div>

        <!-- Items Header -->
        <div class="row" style="font-size: 10px; font-weight: 900; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px;">
          <span>الصنف والكمية</span>
          <span>الإجمالي</span>
        </div>

        <!-- Items List -->
        <div>
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <!-- Financial Summary -->
        <div>
          <div class="row">
            <span>المجموع الفرعي:</span>
            <span style="font-family: monospace;">${subtotal.toFixed(2)} EGP</span>
          </div>

          ${discount > 0 ? `
          <div class="row">
            <span>خصم كوبون / عرض:</span>
            <span style="font-family: monospace;">- ${discount.toFixed(2)} EGP</span>
          </div>` : ''}

          ${tip > 0 ? `
          <div class="row" style="font-weight: bold;">
            <span>إكرامية الضيافة (تيبس):</span>
            <span style="font-family: monospace;">${tip.toFixed(2)} EGP</span>
          </div>` : ''}

          ${serviceFee > 0 ? `
          <div class="row">
            <span>رسوم خدمة (12%):</span>
            <span style="font-family: monospace;">${serviceFee.toFixed(2)} EGP</span>
          </div>` : ''}

          <!-- Grand Total Box -->
          <div class="total-box">
            <span>الإجمــــالي:</span>
            <span style="font-family: monospace;">${total.toFixed(2)} EGP</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Loyalty & Footer -->
        <div class="center" style="font-size: 10px;">
          ${points > 0 ? `<div style="font-weight: bold; margin-bottom: 3px;">النقاط المضافة للعميل: +${points} نقطة</div>` : ''}
          <div style="font-weight: bold; font-size: 11px; margin-top: 5px;">شكراً لزيارتكم كافيه 90! ☕</div>
          <div style="color: #333; margin-top: 2px;">نتمنى لكم يوماً سعيداً ولحظات مميزة</div>
          <div style="font-size: 9px; margin-top: 5px; color: #555;">www.cafe90egypt.com</div>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    // Trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      }
    }, 250);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in w-full">
      {/* Top 4 Orders Status Cards (Sidebar Dark Espresso Theme with White Text & Gold Accents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            id: 'all',
            label: isRtl ? 'جميع الطلبات' : 'All Orders',
            subtitle: isRtl ? 'إجمالي كافة الطلبات المسجلة' : 'Total Orders in System',
            count: stats.total,
            icon: ShoppingBag,
            badge: isRtl ? 'الكل' : 'All',
            activeGlow: 'from-gold-500/15'
          },
          {
            id: 'completed',
            label: isRtl ? 'تم الاستلام' : 'Completed / Received',
            subtitle: isRtl ? 'طلبات تم تسليمها بنجاح' : 'Delivered & Completed',
            count: stats.completed,
            icon: CheckCircle2,
            badge: isRtl ? 'تم الاستلام' : 'Received',
            activeGlow: 'from-emerald-500/15'
          },
          {
            id: 'confirmed',
            label: isRtl ? 'جاري التجهيز' : 'In Preparation',
            subtitle: isRtl ? 'قيد التحضير والتجهيز بالبار' : 'Preparing at Bar',
            count: stats.confirmed,
            icon: Clock,
            badge: isRtl ? 'تجهيز' : 'Prep',
            activeGlow: 'from-amber-500/15'
          },
          {
            id: 'rejected',
            label: isRtl ? 'مرفوض' : 'Rejected',
            subtitle: isRtl ? 'طلبات ملغاة أو مرفوضة' : 'Rejected / Cancelled',
            count: stats.rejected,
            icon: XCircle,
            badge: isRtl ? 'مرفوض' : 'Rejected',
            activeGlow: 'from-rose-500/15'
          }
        ].map((card) => {
          const isActive = statusFilter === card.id;
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setStatusFilter(card.id)}
              aria-pressed={isActive}
              className={`relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-start w-full group ${
                isActive
                  ? 'bg-white border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
                  : 'bg-white border-stone-200/70 shadow-card hover:border-stone-300 hover:shadow-luxury'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ${STAT_TINTS[card.id] || STAT_TINTS.all}`}>
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

      {/* Main Unified Orders Card */}
      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card overflow-hidden w-full">
        {/* Top Header Strip: Title, Live Status & Quick Refresh */}
        <div className="px-4 py-4 sm:px-5 border-b border-stone-200/70 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[15px] sm:text-base font-bold text-chocolate-900 truncate">
              {isRtl ? 'إدارة وتجهيز الطلبات' : 'Orders Management'}
            </h2>
            <span className="inline-flex items-center h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums shrink-0">
              {orders.length}
            </span>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadOrders(false)}
              disabled={isRefreshing || loading}
              className="h-9 px-3 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 text-chocolate-800 text-[13px] font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={isRtl ? 'تحديث فوري لقائمة الطلبات' : 'Refresh Orders'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin text-gold-600' : 'text-stone-500'}`} />
              <span>{isRefreshing ? (isRtl ? 'جاري التحديث...' : 'Updating...') : (isRtl ? 'تحديث الطلبات' : 'Refresh')}</span>
            </button>
          </div>
        </div>

        {/* Filter Pipeline Tabs Bar */}
        <div className="px-4 py-3.5 sm:px-5 bg-white border-b border-stone-200/70 space-y-3">
          <div className="w-full overflow-x-auto">
            <div className="inline-flex items-center gap-0.5 p-1 bg-stone-100 rounded-xl">
              {statusTabs.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`h-8 px-3 rounded-lg text-[13px] transition-colors duration-150 whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'font-medium text-stone-500 hover:text-chocolate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                      isActive ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Channel Filters Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث برقم الطلب، العميل، الهاتف، الطاولة..." : "Search Order #, Guest, Phone, Table..."}
                className="w-full h-10 ps-10 pe-9 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
              />
              <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-md text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto md:justify-end flex-wrap">
              <select
                value={diningFilter}
                onChange={(e) => setDiningFilter(e.target.value)}
                className="h-10 ps-3 pe-8 flex-1 md:flex-none rounded-xl bg-white border border-stone-200 text-[13px] font-medium text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع الأماكن والقنوات' : 'All Channels'}</option>
                <option value="dine-in">{isRtl ? 'صالة داخلية' : 'Dine-in'}</option>
                <option value="room">{isRtl ? 'غرفة VIP' : 'VIP Room'}</option>
                <option value="takeaway">{isRtl ? 'سفري / تيك اواي' : 'Takeaway'}</option>
              </select>

              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="h-10 ps-3 pe-8 flex-1 md:flex-none rounded-xl bg-white border border-stone-200 text-[13px] font-medium text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع طرق الدفع' : 'All Payment Types'}</option>
                <option value="cash">{isRtl ? 'نقدي (Cash)' : 'Cash'}</option>
                <option value="points">{isRtl ? 'نقاط الولاء (Points)' : 'Points'}</option>
              </select>

              {(searchQuery || diningFilter !== 'all' || paymentTypeFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => { setStatusFilter('all'); setPaymentTypeFilter('all'); setDiningFilter('all'); setSearchQuery(''); }}
                  className="h-10 px-3 text-[13px] text-stone-500 hover:text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  {isRtl ? 'إعادة ضبط' : 'Reset'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table Container */}
        {loading ? (
          <div className="p-5 sm:p-6 animate-pulse space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-xl w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-2">
            <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-chocolate-900">
              {isRtl ? 'لا توجد طلبات في هذا القسم حالياً' : 'No orders found in this view'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {isRtl
                ? 'بمجرد إرسال أي أوردر جديد، سيظهر هنا فوراً في أول سطر مع تحديث فوري.'
                : 'As soon as an order is placed, it will appear here in real time.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStatusFilter('all'); setPaymentTypeFilter('all'); setDiningFilter('all'); setSearchQuery(''); }}
              >
                {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => loadOrders(false)}
              >
                {isRtl ? 'تحديث فوري' : 'Fetch Now'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-[13px]">
              <thead className="bg-stone-50/80 border-b border-stone-200/70 text-xs text-stone-500">
                <tr>
                  <th className="py-2.5 pe-3 ps-4 sm:ps-5 font-semibold text-start whitespace-nowrap">{isRtl ? 'رقم الطلب والوقت' : 'Order & Time'}</th>
                  <th className="py-2.5 px-3 font-semibold text-start whitespace-nowrap">{isRtl ? 'العميل' : 'Guest'}</th>
                  <th className="py-2.5 px-3 font-semibold text-start whitespace-nowrap">{isRtl ? 'نوع الطلب' : 'Channel'}</th>
                  <th className="py-2.5 px-3 font-semibold text-start whitespace-nowrap">{isRtl ? 'الأصناف المطلوبة' : 'Items'}</th>
                  <th className="py-2.5 px-3 font-semibold text-start whitespace-nowrap">{isRtl ? 'طريقة الدفع' : 'Payment'}</th>
                  <th className="py-2.5 px-3 font-semibold text-start whitespace-nowrap">{isRtl ? 'المبلغ' : 'Total'}</th>
                  <th className="py-2.5 px-3 font-semibold text-start whitespace-nowrap">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 ps-3 pe-4 sm:pe-5 font-semibold text-end whitespace-nowrap">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => {
                  const formattedTime = new Date(order.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isNewOrder = lastNewOrderId && String(lastNewOrderId) === String(order.id);
                  const isPending = order.status === 'pending' || order.status === 'new';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenOrderDetails(order)}
                      className={`transition-colors group cursor-pointer ${
                        isPending
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : isNewOrder
                          ? 'bg-gold-50/40 hover:bg-gold-50/70'
                          : 'bg-white hover:bg-stone-50/70'
                      }`}
                    >
                      {/* Order ID & Time */}
                      <td className={`py-3 pe-3 ps-4 sm:ps-5 align-middle border-s-[3px] ${isPending ? 'border-s-amber-400' : isNewOrder ? 'border-s-gold-500' : 'border-s-transparent'}`}>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className="font-semibold text-chocolate-900 tabular-nums" dir="ltr">
                              #{order.orderNumber}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(order.orderNumber, order.id);
                              }}
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-chocolate-900 hover:bg-stone-100 transition ${copiedId === order.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                              title={isRtl ? 'نسخ رقم الطلب' : 'Copy Order ID'}
                            >
                              {copiedId === order.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {isNewOrder && (
                              <span className="inline-flex items-center h-5 px-1.5 rounded-full text-[11px] font-semibold bg-gold-100 text-gold-800 ring-1 ring-inset ring-gold-200/70">
                                {isRtl ? 'جديد ✨' : 'New ✨'}
                              </span>
                            )}
                          </div>
                          <span className="self-start text-xs text-stone-500 tabular-nums whitespace-nowrap" dir="ltr">
                            {formattedTime}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stone-100 ring-1 ring-inset ring-stone-200/70 text-chocolate-800 font-semibold flex items-center justify-center text-xs shrink-0">
                            {order.customerName ? order.customerName.charAt(0).toUpperCase() : '؟'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-chocolate-900 leading-tight truncate max-w-[140px]">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-stone-500 tabular-nums mt-0.5 whitespace-nowrap">
                              {order.customerPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Dining Channel & Table */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center h-6 px-2 rounded-full text-xs font-medium whitespace-nowrap border ${
                            order.diningType === 'dine-in' || order.diningType.includes('صالة') || order.diningType.includes('صاله')
                              ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                              : order.diningType === 'room' || order.diningType.includes('vip') || order.diningType.includes('غرفة')
                              ? 'bg-violet-50 text-violet-700 border-violet-200/70'
                              : 'bg-sky-50 text-sky-700 border-sky-200/70'
                          }`}>
                            {formatDiningType(order.diningType)}
                          </span>
                          {order.tableNumber && (
                            <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap ps-1">
                              {isRtl ? `طاولة ${order.tableNumber}` : `Table ${order.tableNumber}`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3 px-3 align-middle max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-chocolate-900 font-medium truncate max-w-[190px]" title={order.itemsSummary}>
                            {order.items && order.items.length > 0
                              ? `${order.items[0].quantity}× ${order.items[0].name}${order.items.length > 1 ? ` (+${order.items.length - 1} ${isRtl ? 'آخرين' : 'more'})` : ''}`
                              : order.itemsSummary || '—'}
                          </p>
                          <span className="text-xs text-stone-500 whitespace-nowrap">
                            {order.itemsCount} {isRtl ? (order.itemsCount === 1 ? 'صنف واحد' : order.itemsCount === 2 ? 'صنفان' : 'أصناف') : 'items'}
                          </span>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[13px] text-stone-700 inline-flex items-center gap-1.5 whitespace-nowrap">
                            <CreditCard className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{formatPaymentMethod(order.paymentMethod)}</span>
                          </span>
                          {order.receiptImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptImage(order.receiptImage)}
                              className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white hover:bg-gold-50 text-stone-600 hover:text-gold-800 border border-stone-200 hover:border-gold-300 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                            >
                              <span>🧾 {isRtl ? 'عرض الإيصال' : 'Proof'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <span className="font-semibold text-chocolate-900 tabular-nums">{Number(order.totalPrice || 0).toLocaleString()}</span>{' '}
                        <span className="text-xs font-normal text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 items-start whitespace-nowrap">
                          <Badge variant={order.status}>
                            {formatOrderStatus(order.status, order)}
                          </Badge>
                          {order.adminNote && (order.status === 'rejected' || order.status === 'cancelled') && (
                            <span className="text-[11px] text-rose-600 truncate max-w-[140px]" title={order.adminNote}>
                              {order.adminNote}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 ps-3 pe-4 sm:pe-5 align-middle text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {isTakeawayOrder(order) ? (
                            /* Takeaway Actions */
                            <>
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmOrder(order.id)}
                                    disabled={actionLoading}
                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                    title={isRtl ? 'تأكيد واستلام الطلب' : 'Confirm Order'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'تأكيد' : 'Confirm'}</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectDialogOrder(order)}
                                    disabled={actionLoading}
                                    className="h-8 w-8 bg-white text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200/80 hover:border-rose-300 transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-60"
                                    title={isRtl ? 'رفض الطلب' : 'Reject Order'}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {(order.status === 'confirmed' || order.status === 'preparing') && (
                                <button
                                  onClick={() => handleMarkReady(order.id)}
                                  disabled={actionLoading}
                                  className="h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                  title={isRtl ? 'تحويل الحالة إلى جاهز للاستلام وإشعار العميل تلقائياً' : 'Mark as Ready'}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{isRtl ? 'جاهز' : 'Ready'}</span>
                                </button>
                              )}

                              {order.status === 'ready' && (
                                <button
                                  onClick={() => handleCompleteOrder(order.id)}
                                  disabled={actionLoading}
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                  title={isRtl ? 'تسليم الطلب للعميل (تم الاستلام)' : 'Mark Picked Up / Completed'}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isRtl ? 'تم الاستلام' : 'Completed'}</span>
                                </button>
                              )}
                            </>
                          ) : (
                            /* Dine-in Actions */
                            <>
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmOrder(order.id)}
                                    disabled={actionLoading}
                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                    title={isRtl ? 'تأكيد واستلام الطلب' : 'Confirm Order'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'تأكيد' : 'Confirm'}</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectDialogOrder(order)}
                                    disabled={actionLoading}
                                    className="h-8 w-8 bg-white text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200/80 hover:border-rose-300 transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-60"
                                    title={isRtl ? 'رفض الطلب' : 'Reject Order'}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* زر التفاصيل */}
                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetails(order)}
                            className="h-8 w-8 2xl:w-auto 2xl:px-3 bg-white hover:bg-stone-50 text-chocolate-800 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-1.5 border border-stone-200 hover:border-stone-300 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                            title={isRtl ? 'عرض تفاصيل الطلب والفاتورة' : 'View Details'}
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-500" />
                            <span className="hidden 2xl:inline">{isRtl ? 'التفاصيل' : 'Details'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Order View Modal */}
      {viewingOrder && (
        <Modal
          isOpen={Boolean(viewingOrder)}
          onClose={() => setViewingOrder(null)}
          title={isRtl ? `تفاصيل الطلب #${viewingOrder.orderNumber}` : `Order #${viewingOrder.orderNumber} Details`}
          subtitle={isRtl
            ? `تم إنشاؤه بتاريخ ${new Date(viewingOrder.createdAt).toLocaleDateString()} الساعة ${new Date(viewingOrder.createdAt).toLocaleTimeString()}`
            : `Placed on ${new Date(viewingOrder.createdAt).toLocaleDateString()} at ${new Date(viewingOrder.createdAt).toLocaleTimeString()}`
          }
          maxWidth="max-w-3xl"
          footer={
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => setIsReceiptOpen(true)}
                className="w-full sm:w-auto"
              >
                {isRtl ? 'طباعة فاتورة العميل' : 'Print Guest Receipt'}
              </Button>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {viewingOrder.status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={XCircle}
                      className="bg-white text-rose-600 hover:bg-rose-50 border border-rose-200/80 hover:border-rose-300 font-semibold"
                      loading={actionLoading}
                      onClick={() => setRejectDialogOrder(viewingOrder)}
                    >
                      {isRtl ? 'رفض الطلب' : 'Reject Order'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-semibold"
                      loading={actionLoading}
                      onClick={() => handleConfirmOrder(viewingOrder.id)}
                    >
                      {isRtl ? 'تأكيد واستلام الطلب' : 'Confirm & Accept'}
                    </Button>
                  </>
                )}

                {/* Takeaway: In preparation -> Mark Ready */}
                {(viewingOrder.status === 'confirmed' || viewingOrder.status === 'received' || viewingOrder.status === 'preparing') && isTakeawayOrder(viewingOrder) && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Clock}
                    className="bg-sky-600 hover:bg-sky-700 text-white shadow-2xs font-semibold"
                    loading={actionLoading}
                    onClick={() => handleMarkReady(viewingOrder.id)}
                  >
                    {isRtl ? 'جاهز للاستلام' : 'Mark Ready for Pickup'}
                  </Button>
                )}

                {/* Takeaway: Ready -> Completed */}
                {viewingOrder.status === 'ready' && isTakeawayOrder(viewingOrder) && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-semibold"
                    loading={actionLoading}
                    onClick={() => handleCompleteOrder(viewingOrder.id)}
                  >
                    {isRtl ? 'تم الاستلام' : 'Complete & Deliver'}
                  </Button>
                )}

                {viewingOrder.status === 'completed' && (
                  <Badge variant="completed" size="md">
                    {isRtl ? 'تم الاستلام ✓' : 'Order Completed ✓'}
                  </Badge>
                )}

                {viewingOrder.status === 'rejected' && (
                  <Badge variant="cancelled" size="md">
                    {isRtl ? 'الطلب مرفوض' : 'Order Rejected'}
                  </Badge>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Top Guest & Order Info Bar */}
            <div className="bg-white p-4 rounded-xl border border-stone-200/70 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-100">
                {/* Guest Identity */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 font-semibold text-sm flex items-center justify-center shrink-0">
                    {viewingOrder.customerName ? viewingOrder.customerName.charAt(0).toUpperCase() : '؟'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-chocolate-900 text-sm sm:text-[15px] leading-tight">
                        {viewingOrder.customerName}
                      </h3>
                      <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium text-stone-600 bg-stone-100 ring-1 ring-inset ring-stone-200/70">
                        {isRtl ? 'حساب العميل' : 'Customer Account'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-600 mt-1 flex-wrap">
                      <span className="tabular-nums flex items-center gap-1 font-medium text-chocolate-900">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {viewingOrder.customerPhone}
                      </span>
                      {viewingOrder.customerPhone && viewingOrder.customerPhone !== '—' && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingOrder.customerPhone, 'cust_phone', isRtl ? 'رقم حساب العميل' : 'customer phone')}
                          className="h-6 px-1.5 rounded-md text-[11px] text-stone-500 hover:text-chocolate-900 hover:bg-stone-100 flex items-center gap-1 transition-colors cursor-pointer"
                          title={isRtl ? 'نسخ رقم الهاتف' : 'Copy phone'}
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isRtl ? 'نسخ' : 'Copy'}</span>
                        </button>
                      )}
                      {viewingOrder.customerEmail && viewingOrder.customerEmail !== '—' && (
                        <span className="text-stone-400 flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-stone-400" />
                          {viewingOrder.customerEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Time */}
                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-500 hidden sm:inline">
                      {isRtl ? 'الحالة الحالية:' : 'Status:'}
                    </span>
                    <Badge variant={viewingOrder.status} size="md">
                      {formatOrderStatus(viewingOrder.status, viewingOrder)}
                    </Badge>
                  </div>
                  {viewingOrder.confirmedAt && (
                    <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-amber-600" />
                      <span>{isRtl ? 'تم التأكيد:' : 'Confirmed:'} {new Date(viewingOrder.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                  {viewingOrder.readyAt && (
                    <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>{isRtl ? 'جاهز للاستلام:' : 'Ready:'} {new Date(viewingOrder.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                  {viewingOrder.completedAt && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isRtl ? 'تم الاستلام والتسليم:' : 'Delivered:'} {new Date(viewingOrder.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                  {viewingOrder.estimatedReadyTime && !viewingOrder.readyAt && (
                    <span className="text-[11px] text-stone-500 font-mono">
                      ⏱️ {isRtl ? 'المتوقع:' : 'Target:'} {viewingOrder.estimatedReadyTime}
                    </span>
                  )}
                </div>
              </div>

              {/* Service Channel & Payment Method Meta pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-inset ring-stone-200/70 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gold-700" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-500 block font-medium">{isRtl ? 'نوع الطلب والخدمة' : 'Service Type'}</span>
                    <span className="font-semibold text-chocolate-900 text-[13px] truncate block mt-0.5">{formatDiningType(viewingOrder.diningType)}</span>
                    {viewingOrder.tableNumber && (
                      <span className="inline-flex items-center h-5 px-1.5 mt-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70 tabular-nums">
                        {isRtl ? `طاولة رقم ${viewingOrder.tableNumber}` : `Table ${viewingOrder.tableNumber}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-inset ring-stone-200/70 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-gold-700" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-500 block font-medium">{isRtl ? 'طريقة وسيلة الدفع' : 'Payment Method'}</span>
                    <span className="font-semibold text-chocolate-900 text-[13px] truncate block mt-0.5">{formatPaymentMethod(viewingOrder.paymentMethod)}</span>
                    <span className={`inline-flex items-center h-5 px-1.5 mt-1 rounded-full text-[11px] font-medium border ${
                      viewingOrder.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-amber-50 text-amber-700 border-amber-200/70'
                    }`}>
                      {viewingOrder.paymentStatus === 'paid' ? (isRtl ? 'مدفوع' : 'Paid') : (isRtl ? 'معلق / تحويل' : 'Pending')}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70 flex items-start gap-2.5 col-span-2 sm:col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-inset ring-stone-200/70 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-gold-700" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-500 block font-medium">{isRtl ? 'توقيت الطلب' : 'Placed At'}</span>
                    <span className="font-semibold text-chocolate-900 tabular-nums text-[13px] block mt-0.5">
                      {new Date(viewingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] text-stone-500 tabular-nums">
                      {new Date(viewingOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Note / Rejection Reason Banner */}
            {viewingOrder.adminNote && (
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-rose-900 text-[13px] leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-rose-800">{isRtl ? 'سبب الرفض / ملاحظة الإدارة: ' : 'Admin / Rejection Reason: '}</span>
                  <span className="font-medium">{viewingOrder.adminNote}</span>
                </div>
              </div>
            )}

            {/* Transfer Receipt Proof from InstaPay / Vodafone Cash */}
            {(viewingOrder.receiptImage || viewingOrder.senderPhone || viewingOrder.transferredFromNumber || viewingOrder.paymentMethod.includes('vodafone') || viewingOrder.paymentMethod.includes('insta')) && (
              <div className="bg-white p-4 rounded-xl border border-gold-200/80 space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-gold-50 text-gold-800 flex items-center justify-center text-sm ring-1 ring-inset ring-gold-200/70 shrink-0">
                      🧾
                    </span>
                    <div>
                      <h4 className="font-semibold text-chocolate-900 text-[13px] sm:text-sm">
                        {isRtl ? 'بيانات التحويل وإثبات الدفع (فودافون كاش / انستاباي)' : 'Electronic Transfer Proof & Details'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {isRtl ? 'الرقم والبيانات المسجلة بالفورم بواسطة العميل مع صورة الإيصال' : 'Customer submitted payment details & screenshot from mobile app'}
                      </p>
                    </div>
                  </div>

                  {viewingOrder.receiptImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewReceiptImage(viewingOrder.receiptImage)}
                      className="h-8 px-3 rounded-lg bg-chocolate-900 hover:bg-chocolate-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'معاينة وتكبير الإيصال' : 'View Full Receipt'}</span>
                    </button>
                  )}
                </div>

                {/* Two-Column Grid: Form Details + Receipt Preview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Column 1: Form Input Data (7 cols) */}
                  <div className="md:col-span-7 space-y-2.5">
                    {/* The Exact Number Transferred From */}
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-amber-600" />
                          <span>{isRtl ? 'الرقم المحول منه (المُدخل بالفورم):' : 'Transferred From Number (Form Input):'}</span>
                        </span>
                        <span className="inline-flex items-center h-5 px-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200/70">
                          {isRtl ? 'رقم المحفظة الفعلي' : 'Actual Wallet Number'}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-3">
                        <span className="tabular-nums font-semibold text-lg sm:text-xl text-chocolate-950 tracking-wide">
                          {viewingOrder.transferredFromNumber || viewingOrder.senderPhone || (isRtl ? 'لم يُسجل رقم محول منه' : 'Not provided')}
                        </span>

                        {(viewingOrder.transferredFromNumber || viewingOrder.senderPhone) && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(viewingOrder.transferredFromNumber || viewingOrder.senderPhone, 'transfer_phone', isRtl ? 'الرقم المحول منه' : 'transfer phone')}
                            className="h-8 px-3 text-xs font-semibold text-chocolate-800 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 hover:border-stone-300 shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                            title={isRtl ? 'نسخ الرقم المحول منه' : 'Copy transfer phone'}
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-700" />
                            <span>{copiedId === 'transfer_phone' ? (isRtl ? 'تم النسخ ✓' : 'Copied ✓') : (isRtl ? 'نسخ الرقم' : 'Copy')}</span>
                          </button>
                        )}
                      </div>

                      {/* Explicit comparison with registered phone to eliminate any confusion */}
                      {viewingOrder.customerPhone && viewingOrder.customerPhone !== '—' && (
                        <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-stone-500">
                          <span>{isRtl ? 'رقم حساب العميل المسجل:' : 'Customer registered phone:'} <strong className="font-mono text-stone-700">{viewingOrder.customerPhone}</strong></span>
                          <span className="text-[11px] text-amber-700 font-medium">{isRtl ? '(مختلف عن المحفظة)' : '(differs)'}</span>
                        </div>
                      )}
                    </div>

                    {/* Secondary Transfer Meta Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                        <span className="text-[11px] text-stone-500 block font-medium">{isRtl ? 'اسم صاحب التحويل:' : 'Sender Name:'}</span>
                        <span className="font-semibold text-chocolate-900 text-[13px] truncate block mt-0.5">
                          {viewingOrder.senderName || viewingOrder.customerName}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                        <span className="text-[11px] text-stone-500 block font-medium">{isRtl ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                        <span className="font-semibold text-chocolate-900 text-[13px] truncate block mt-0.5">
                          {formatPaymentMethod(viewingOrder.paymentMethod)}
                        </span>
                      </div>
                    </div>

                    {/* Success confirmation banner */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 text-emerald-800 border border-emerald-200/70 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">
                        {isRtl ? 'تم رفع صورة التحويل وتأكيد العملية من تطبيق العميل' : 'Payment screenshot attached by customer'}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Receipt Image Interactive Card (5 cols) */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center">
                    {viewingOrder.receiptImage ? (
                      <div
                        onClick={() => setPreviewReceiptImage(viewingOrder.receiptImage)}
                        className="w-full relative group cursor-pointer rounded-xl overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center h-44 transition-all hover:border-gold-400 hover:shadow-luxury"
                      >
                        <img
                          src={viewingOrder.receiptImage}
                          alt="Transfer Proof"
                          className="max-h-full max-w-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <span className="h-8 px-3 bg-black/45 backdrop-blur text-white ring-1 ring-white/15 text-xs font-medium rounded-full flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'انقر لتكبير الإيصال 🔍' : 'Click to zoom 🔍'}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-500 p-4 text-center">
                        <span className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mb-2">
                          <FileText className="w-5 h-5" />
                        </span>
                        <span className="text-xs font-medium">{isRtl ? 'لا توجد صورة إيصال مرفقة' : 'No receipt image attached'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions / Notes */}
            {viewingOrder.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-[13px] leading-relaxed flex items-start gap-2.5">
                <Coffee className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-amber-800">{isRtl ? 'ملاحظة العميل للباريستا: ' : 'Guest Barista Note: '}</span>
                  <span className="text-amber-900">{viewingOrder.notes}</span>
                </div>
              </div>
            )}

            {/* Rounds / Multi-Round Orders on Table */}
            {viewingOrder.rounds && viewingOrder.rounds.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-chocolate-900 flex items-center justify-between text-[13px] sm:text-sm">
                  <span className="flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-gold-700" />
                    <span>{isRtl ? `جولات الطلبات على الطاولة (${viewingOrder.rounds.length} جولات)` : `Table Order Rounds (${viewingOrder.rounds.length})`}</span>
                  </span>
                </h4>

                <div className="space-y-2.5">
                  {viewingOrder.rounds.map((round, rIdx) => (
                    <div key={round.id || rIdx} className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-200/70 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="min-w-[28px] h-6 px-1.5 rounded-lg bg-white ring-1 ring-inset ring-stone-200/70 text-chocolate-900 font-semibold text-xs flex items-center justify-center tabular-nums shrink-0">
                            #{rIdx + 1}
                          </span>
                          <span className="font-semibold text-chocolate-900 text-[13px] whitespace-nowrap">
                            {isRtl ? `الجولة رقم ${rIdx + 1}` : `Round #${rIdx + 1}`}
                          </span>
                          {round.items_summary && (
                            <span className="text-xs text-stone-500 hidden sm:inline truncate">
                              • {round.items_summary}
                            </span>
                          )}
                        </div>

                        <Badge variant={round.status === 'served' ? 'completed' : round.status === 'preparing' ? 'in_progress' : 'pending'} size="sm">
                          {round.status === 'served' ? (isRtl ? 'تم التقديم' : 'Served') :
                           round.status === 'preparing' ? (isRtl ? 'قيد التحضير' : 'Preparing') :
                           (isRtl ? 'في الانتظار' : 'Waiting')}
                        </Badge>
                      </div>

                      {/* Items in this round */}
                      {Array.isArray(round.items) && round.items.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {round.items.map((it, itIdx) => (
                            <div key={it.id || itIdx} className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-stone-200/70">
                              {it.image_url && (
                                <img src={it.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-stone-100 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-chocolate-900 text-[13px] truncate">{it.name}</p>
                                <div className="flex items-center justify-between text-xs text-stone-500 mt-0.5 tabular-nums">
                                  <span>{it.quantity}× {Number(it.price || 0).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                                  <span className="font-semibold text-chocolate-900">{(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()} <span className="font-normal text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span></span>
                                </div>
                                {it.note && (
                                  <p className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 truncate">
                                    {it.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Round Action Buttons & Serving Workflow */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/70 flex-wrap gap-2">
                        <div className="text-xs text-stone-500 flex items-center gap-3 tabular-nums">
                          {round.acknowledged_at && (
                            <span className="text-amber-700 font-semibold">
                              ✓ {isRtl ? 'استُلمت بالمطبخ' : 'Acked'}: {new Date(round.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {round.served_at && (
                            <span className="text-emerald-700 font-bold">
                              🍽️ {isRtl ? 'نزلت للعميل' : 'Served'}: {new Date(round.served_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {(round.status === 'waiting' || !round.acknowledged_at) && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeRound(viewingOrder.id, round.id)}
                              disabled={actionLoading}
                              className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                              title={isRtl ? 'تأكيد استلام الجولة وبدء تحضيرها بالمطبخ' : 'Acknowledge round in kitchen'}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'استلام بالمطبخ' : 'Acknowledge'}</span>
                            </button>
                          )}

                          {(round.status === 'preparing' || (round.acknowledged_at && !round.served_at)) && (
                            <button
                              type="button"
                              onClick={() => handleServeRound(viewingOrder.id, round.id)}
                              disabled={actionLoading}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                              title={isRtl ? 'تقديم ونزول الجولة للعميل على الطاولة' : 'Serve round to customer table'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'تقديم للعميل على الطاولة' : 'Serve to Table'}</span>
                            </button>
                          )}

                          {round.status === 'served' && (
                            <span className="inline-flex items-center h-6 px-2 text-xs text-emerald-700 font-medium bg-emerald-50 rounded-full border border-emerald-200/70">
                              ✓ {isRtl ? 'تم تقديمها على الطاولة' : 'Served to Table'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itemized Order Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-chocolate-900 text-[13px] sm:text-sm flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-gold-700" />
                  <span>{isRtl ? `الأصناف المطلوبة (${viewingOrder.items.length} أصناف)` : `Ordered Items (${viewingOrder.items.length})`}</span>
                </h4>
              </div>

              <div className="border border-stone-200/70 rounded-xl overflow-x-auto">
                <table className="w-full text-start text-[13px]">
                  <thead className="bg-stone-50/80 text-stone-500 font-semibold text-xs border-b border-stone-200/70">
                    <tr>
                      <th className="py-2.5 px-4 text-start font-semibold">{isRtl ? 'الصنف والمواصفات' : 'Item & Details'}</th>
                      <th className="py-2.5 px-4 text-center font-semibold whitespace-nowrap">{isRtl ? 'الكمية' : 'Qty'}</th>
                      <th className="py-2.5 px-4 text-end font-semibold whitespace-nowrap">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="py-2.5 px-4 text-end font-semibold whitespace-nowrap">{isRtl ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {viewingOrder.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-500 font-medium text-xs">
                          {isRtl ? 'لا توجد أصناف مسجلة في هذا الطلب' : 'No items found for this order'}
                        </td>
                      </tr>
                    ) : (
                      viewingOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-stone-200/70 shrink-0" />
                              )}
                              <div>
                                <p className="font-semibold text-chocolate-900 text-[13px]">{item.name}</p>
                                {item.customizations && item.customizations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.customizations.map((c, cIdx) => (
                                      <span key={cIdx} className="text-[11px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.note && (
                                  <p className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded-md bg-stone-100 text-chocolate-900 font-semibold tabular-nums text-xs">
                              {item.quantity}x
                            </span>
                          </td>
                          <td className="py-3 px-4 text-end text-stone-600 tabular-nums whitespace-nowrap">
                            {Number(item.unitPrice || 0).toLocaleString()} <span className="text-xs text-stone-400">{isRtl ? 'ج.م' : 'EGP'}</span>
                          </td>
                          <td className="py-3 px-4 text-end font-semibold text-chocolate-900 tabular-nums whitespace-nowrap">
                            {Number(item.totalPrice || item.quantity * item.unitPrice || 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Integrated Full-Width Professional Summary Footer */}
                  <tfoot className="bg-stone-50/60 border-t border-stone-200/70 divide-y divide-stone-100 text-[13px]">
                    {/* Subtotal */}
                    <tr>
                      <td colSpan={3} className="py-2.5 px-4 font-medium text-stone-600 text-start">
                        {isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums font-semibold text-chocolate-900 text-end whitespace-nowrap">
                        {Number(viewingOrder.subtotal || 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </td>
                    </tr>

                    {/* Discount */}
                    {viewingOrder.discount > 0 && (
                      <tr className="text-emerald-700">
                        <td colSpan={3} className="py-2.5 px-4 font-medium text-start">
                          {isRtl ? `الخصم المطبق (${viewingOrder.couponCode || 'كوبون'}):` : `Discount (${viewingOrder.couponCode || 'Promo'}):`}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums font-semibold text-end whitespace-nowrap">
                          - {Number(viewingOrder.discount || 0).toLocaleString()} <span className="text-xs font-normal">{isRtl ? 'ج.م' : 'EGP'}</span>
                        </td>
                      </tr>
                    )}

                    {/* Tips */}
                    <tr>
                      <td colSpan={3} className="py-2.5 px-4 font-medium text-stone-600 text-start">
                        {isRtl ? 'التيبس (إكرامية):' : 'Tips (Gratuity):'}
                      </td>
                      <td className="py-2.5 px-4 tabular-nums font-semibold text-emerald-700 text-end whitespace-nowrap">
                        {Number(viewingOrder.tip || 0).toLocaleString()} <span className="text-xs font-normal">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </td>
                    </tr>

                    {/* Service Fee */}
                    {viewingOrder.serviceFee > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2.5 px-4 font-medium text-stone-600 text-start">
                          {isRtl ? 'رسوم الخدمة (12%):' : 'Service (12%):'}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums font-semibold text-chocolate-900 text-end whitespace-nowrap">
                          {Number(viewingOrder.serviceFee || 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">{isRtl ? 'ج.م' : 'EGP'}</span>
                        </td>
                      </tr>
                    )}

                    {/* Grand Total */}
                    <tr className="bg-gold-50/60 text-chocolate-900">
                      <td colSpan={3} className="py-3 px-4 text-start font-bold text-sm">
                        {isRtl ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-chocolate-950 font-bold text-base sm:text-lg text-end whitespace-nowrap">
                        {Number(viewingOrder.totalPrice || 0).toLocaleString()} <span className="text-xs font-medium text-gold-700">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </td>
                    </tr>

                    {/* Loyalty points earned */}
                    {viewingOrder.pointsEarned > 0 && (
                      <tr className="text-violet-700">
                        <td colSpan={3} className="py-2 px-4 font-medium text-xs text-start">
                          ⭐ {isRtl ? 'النقاط المكتسبة للعميل من هذا الطلب:' : 'Points Earned:'}
                        </td>
                        <td className="py-2 px-4 font-semibold text-xs text-end tabular-nums whitespace-nowrap">
                          +{viewingOrder.pointsEarned} {isRtl ? 'نقطة ولاء' : 'pts'}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer Proof Lightbox Modal */}
      {previewReceiptImage && (
        <Modal
          isOpen={Boolean(previewReceiptImage)}
          onClose={() => setPreviewReceiptImage(null)}
          title={isRtl ? 'معاينة إيصال التحويل المالي (انستاباي / فودافون كاش)' : 'Transfer Payment Proof Receipt'}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-stone-200/70 bg-stone-900 flex items-center justify-center p-2">
              <img
                src={previewReceiptImage}
                alt="Transfer Proof"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-stone-500">
              <span>{isRtl ? 'صورة إيصال الدفع المرفقة من العميل في التطبيق' : 'Customer submitted payment proof'}</span>
              <a
                href={previewReceiptImage}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 font-semibold shadow-2xs inline-flex items-center gap-1 transition-colors"
              >
                {isRtl ? 'فتح في نافذة كاملة ↗' : 'Open Full Image ↗'}
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Thermal Guest Receipt Modal */}
      {isReceiptOpen && viewingOrder && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-gold-600" />
              <span>{isRtl ? "كافيه 90 - فاتورة حساب العميل" : "Cafe 90 - Guest Receipt"}</span>
            </div>
          }
          maxWidth="max-w-md"
          footer={
            <div className="w-full space-y-2">
              <Button
                variant="primary"
                size="md"
                icon={Printer}
                className="w-full bg-chocolate-900 hover:bg-chocolate-800 text-white font-semibold rounded-xl shadow-2xs text-sm transition-colors"
                onClick={() => handlePrintReceipt(viewingOrder)}
              >
                {isRtl ? 'طباعة على طابعة الفواتير الحرارية (80mm)' : 'Print to Thermal POS Printer (80mm)'}
              </Button>
            </div>
          }
        >
          {/* Thermal Receipt Simulation Paper */}
          <div className="modal-receipt bg-white font-mono text-xs border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-sm text-stone-900 space-y-3.5 select-text mx-auto">
            {/* Header Brand */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
              <h3 className="font-black text-xl tracking-wider text-chocolate-950 font-sans">CAFE 90</h3>
              <p className="text-xs font-bold text-stone-700">{isRtl ? 'القهوة • اللحظات • بارتقاء' : 'Coffee • Moments • Elevated'}</p>
              <p className="text-[11px] text-stone-500">{isRtl ? 'فرع شرق النيل، بني سويف الجديدة' : 'East Nile Branch, New Beni Suef'}</p>
              <p className="text-[10px] text-stone-500 font-sans" dir="ltr">Hotline: +20 100 909 0900</p>
            </div>

            {/* Order Metadata */}
            <div className="space-y-1.5 text-[11px] pb-2 border-b border-dashed border-stone-300">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">{isRtl ? 'فاتورة طلب:' : 'Order Ref:'}</span>
                <span className="font-bold text-chocolate-950 font-mono text-xs" dir="ltr">#{viewingOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-600">
                <span>{isRtl ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
                <span dir="ltr">
                  {new Date(viewingOrder.createdAt).toLocaleDateString('ar-EG')} - {new Date(viewingOrder.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">{isRtl ? 'العميل:' : 'Customer:'}</span>
                <span className="font-bold text-chocolate-950">{viewingOrder.customerName || (isRtl ? 'عميل نقدي' : 'Walk-in Guest')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">{isRtl ? 'نوع الخدمة:' : 'Channel:'}</span>
                <span className="font-bold text-chocolate-900 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                  {formatDiningType(viewingOrder.diningType)} {viewingOrder.tableNumber ? `(طاولة ${viewingOrder.tableNumber})` : ''}
                </span>
              </div>
              {viewingOrder.paymentMethod && (
                <div className="flex justify-between items-center text-[10px] text-stone-600">
                  <span>{isRtl ? 'طريقة الدفع:' : 'Payment:'}</span>
                  <span className="font-semibold">
                    {viewingOrder.paymentMethod === 'cash'
                      ? (isRtl ? 'نقداً (كاش)' : 'Cash')
                      : viewingOrder.paymentMethod === 'points'
                      ? (isRtl ? 'خصم نقاط' : 'Points')
                      : viewingOrder.paymentMethod}
                  </span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase pb-1 mb-2 border-b border-stone-200">
                <span>{isRtl ? 'الصنف والكمية' : 'Item & Qty'}</span>
                <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
              </div>
              <div className="space-y-2">
                {viewingOrder.items.map((i, idx) => {
                  const qty = i.quantity || 1;
                  const unit = Number(i.unitPrice || 0);
                  const itemTotal = Number(i.totalPrice || (unit * qty) || 0);
                  return (
                    <div key={idx} className="pb-1.5 border-b border-dotted border-stone-100 last:border-none">
                      <div className="flex justify-between text-xs font-bold text-chocolate-950">
                        <span>{qty}x {i.name}</span>
                        <span className="font-mono text-stone-900" dir="ltr">{itemTotal.toFixed(2)} EGP</span>
                      </div>
                      {qty > 1 && (
                        <div className="text-[10px] text-stone-400">
                          ({unit.toFixed(2)} EGP {isRtl ? 'للوحدة' : 'each'})
                        </div>
                      )}
                      {i.notes && (
                        <div className="text-[10px] text-stone-500 italic mt-0.5">
                          * {i.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financials & Totals */}
            <div className="pt-2 border-t border-dashed border-stone-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-mono" dir="ltr">{Number(viewingOrder.subtotal || 0).toFixed(2)} EGP</span>
              </div>

              {viewingOrder.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>{isRtl ? 'خصم العرض / الكوبون:' : 'Discount:'}</span>
                  <span className="font-mono" dir="ltr">- {Number(viewingOrder.discount || 0).toFixed(2)} EGP</span>
                </div>
              )}

              {viewingOrder.tip > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{isRtl ? 'إكرامية الضيافة (تيبس):' : 'Staff Tips:'}</span>
                  <span className="font-mono" dir="ltr">{Number(viewingOrder.tip || 0).toFixed(2)} EGP</span>
                </div>
              )}

              {viewingOrder.serviceFee > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>{isRtl ? 'رسوم الخدمة (12%):' : 'Service Fee (12%):'}</span>
                  <span className="font-mono" dir="ltr">{Number(viewingOrder.serviceFee || 0).toFixed(2)} EGP</span>
                </div>
              )}

              {/* Grand Total Highlight Box */}
              <div className="flex justify-between items-center font-black text-sm pt-2 pb-2 px-3 bg-stone-50 border border-stone-300 rounded-xl mt-2 text-chocolate-950">
                <span className="text-sm font-black">{isRtl ? 'الإجمــــالي المطلوب:' : 'TOTAL DUE:'}</span>
                <span className="font-mono text-base font-black text-chocolate-950" dir="ltr">
                  {Number(viewingOrder.totalPrice || 0).toFixed(2)} EGP
                </span>
              </div>
            </div>

            {/* Footer & Loyalty */}
            <div className="text-center pt-3 border-t border-dashed border-stone-300 space-y-1.5 text-[10px] text-stone-500">
              {viewingOrder.pointsEarned > 0 && (
                <p className="font-bold text-gold-700 bg-gold-50 py-1 rounded-lg border border-gold-200">
                  {isRtl ? `النقاط المضافة لحساب العميل: +${viewingOrder.pointsEarned} نقطة` : `Points Credited: +${viewingOrder.pointsEarned} pts`}
                </p>
              )}
              <p className="font-bold text-stone-700 text-xs">
                {isRtl ? 'شكراً لزيارتكم كافيه 90! ☕' : 'Thank you for visiting Cafe 90! ☕'}
              </p>
              <p className="text-[10px]">{isRtl ? 'نتمنى لكم يوماً سعيداً ولحظات مميزة' : 'Have a wonderful day!'}</p>
              <p className="text-[9px] text-stone-400 font-mono" dir="ltr">www.cafe90egypt.com</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Order Reason Modal */}
      {rejectDialogOrder && (
        <Modal
          isOpen={Boolean(rejectDialogOrder)}
          onClose={() => setRejectDialogOrder(null)}
          title={isRtl ? `رفض الطلب #${rejectDialogOrder.orderNumber}` : `Reject Order #${rejectDialogOrder.orderNumber}`}
          subtitle={isRtl ? 'يرجى كتابة سبب رفض الطلب لإعلام العميل به' : 'Provide a reason for rejecting this order'}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogOrder(null)}
                disabled={actionLoading}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-2xs"
                loading={actionLoading}
                onClick={handleRejectOrder}
              >
                {isRtl ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </Button>
            </div>
          }
        >
          <div className="text-sm">
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'سبب الرفض (ملاحظة للإدارة والعميل)' : 'Rejection Reason (Note to customer)'}
            </label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={isRtl ? "مثال: عدم وضوح إيصال التحويل، أو نفاذ الصنف المطلوب مؤقتاً..." : "e.g., Payment could not be verified or item temporarily out of stock..."}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/15 outline-none transition resize-none leading-relaxed"
              autoFocus
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

