import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ShieldCheck,
  Save,
  CheckCircle2,
  Copy,
  Tag,
  Gift,
  Coffee,
  Star,
  Users,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Smartphone,
  Info,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  RefreshCw,
  UserCheck,
  DollarSign,
  Clock,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  Shuffle,
  Check,
  Filter,
  Globe
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';

export const PointsAndCouponsView = () => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons', 'points-settings', 'rewards-catalog'
  const [loading, setLoading] = useState(true);
  const [savingPoints, setSavingPoints] = useState(false);

  // Points Config State
  const [pointsConfig, setPointsConfig] = useState({
    amount_egp: 100,
    points_per_amount: 10,
    welcome_bonus_points: 50,
    review_bonus_points: 20,
    referral_bonus_points: 100,
    egp_per_100_points: 20,
    min_redeem_points: 100
  });

  // Simulator State
  const [simAmount, setSimAmount] = useState(500);

  // Coupons State (Dynamic from API)
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [couponFilter, setCouponFilter] = useState('all'); // 'all', 'general', 'personal', 'active', 'inactive'
  const [couponSearch, setCouponSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);

  // Coupon Form State (General + Personal support)
  const [couponForm, setCouponForm] = useState({
    coupon_target: 'general', // 'general' or 'personal'
    user_id: '',
    code: '',
    discount_mode: 'percentage', // 'percentage' or 'fixed'
    discount_percentage: '20',
    fixed_amount: '50',
    max_discount_amount: '',
    has_expiry: true,
    starts_at: '',
    expires_at: '',
    max_usage: '100',
    description: '',
    is_active: true
  });

  // Rewards Catalog State (Items added by admin dynamically)
  const [rewardItems, setRewardItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cafe90_reward_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    nameEn: '',
    pointsRequired: 150,
    originalPrice: 50,
    category: 'مشروبات ساخنة',
    image: '',
    isActive: true
  });

  const handleRewardImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(isRtl ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image size too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRewardForm(prev => ({ ...prev, image: event.target.result }));
        toast.success(isRtl ? 'تم رفع صورة الصنف من جهازك بنجاح' : 'Image loaded from device successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const normalizeCoupon = (c) => {
    if (!c) return null;
    const isFixedAmount = (
      (Number(c.discount_percentage) === 100 && Number(c.max_discount_amount) > 0) ||
      c.discount_type === 'fixed' ||
      (Number(c.discount_amount) > 0 && !c.discount_percentage)
    );
    const discountMode = isFixedAmount ? 'fixed' : 'percentage';
    const percentageVal = Number(c.discount_percentage || 0);
    const fixedAmountVal = Number(c.max_discount_amount || c.discount_amount || 0);

    const isPersonal = Boolean(c.user_id || c.user);
    const maxUsage = Number(c.max_usage || c.usageLimit || 100);
    const usedCount = Number(c.used_count || c.timesUsed || 0);
    const isExpired = Boolean(c.expires_at && new Date(c.expires_at) < new Date());

    return {
      id: c.id,
      code: c.code || '',
      discountMode, // 'fixed' | 'percentage'
      discountPercentage: percentageVal,
      fixedAmount: fixedAmountVal,
      maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
      discountDisplay: isFixedAmount 
        ? `${fixedAmountVal} ج.م` 
        : `${percentageVal}%`,
      userId: c.user_id || c.user?.id || null,
      user: c.user || null,
      isPersonal,
      expiresAt: c.expires_at || null,
      hasExpiry: Boolean(c.expires_at),
      validUntil: c.expires_at ? c.expires_at.slice(0, 10) : (isRtl ? 'دائم (بدون انتهاء)' : 'No Expiry'),
      validUntilFormatted: c.expires_at ? new Date(c.expires_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
      validFrom: (c.starts_at || c.created_at) ? (c.starts_at || c.created_at).slice(0, 10) : (isRtl ? 'الآن' : 'Now'),
      isExpired,
      maxUsage,
      usedCount,
      remainingUsage: Math.max(0, maxUsage - usedCount),
      description: c.description || '',
      active: c.is_active !== undefined ? Boolean(c.is_active) : (c.active !== false),
      createdAt: c.created_at || null,
      updatedAt: c.updated_at || null,
      raw: c
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, couponListRes, usersRes] = await Promise.all([
        api.getPointsSettings().catch(() => null),
        api.getCoupons({ force: true }).catch(() => null),
        api.getUsers().catch(() => [])
      ]);

      if (configRes) {
        const ps = configRes.points_settings || configRes;
        setPointsConfig(prev => ({
          ...prev,
          amount_egp: parseFloat(ps.amount_egp) || 100,
          points_per_amount: parseInt(ps.points_per_amount, 10) || 10,
          welcome_bonus_points: ps.welcome_bonus_points || 50,
          review_bonus_points: ps.review_bonus_points || 20,
          referral_bonus_points: ps.referral_bonus_points || 100,
          egp_per_100_points: ps.egp_per_100_points || 20
        }));
      }

      const rawCoupons = Array.isArray(couponListRes)
        ? couponListRes
        : (Array.isArray(couponListRes?.coupons)
            ? couponListRes.coupons
            : (couponListRes?.data || []));
      setCoupons(rawCoupons.map(normalizeCoupon).filter(Boolean));

      if (Array.isArray(usersRes)) {
        setUsers(usersRes);
      } else if (Array.isArray(usersRes?.users)) {
        setUsers(usersRes.users);
      } else if (Array.isArray(usersRes?.data)) {
        setUsers(usersRes.data);
      }
    } catch (e) {
      toast.error(isRtl ? 'فشل تحميل بيانات النقاط والكوبونات' : 'Failed to load points & coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePointsSettings = async (e) => {
    e?.preventDefault?.();
    try {
      setSavingPoints(true);
      const res = await api.updatePointsSettings({
        amount_egp: Number(pointsConfig.amount_egp),
        points_per_amount: Number(pointsConfig.points_per_amount),
        welcome_bonus_points: Number(pointsConfig.welcome_bonus_points),
        review_bonus_points: Number(pointsConfig.review_bonus_points),
        referral_bonus_points: Number(pointsConfig.referral_bonus_points),
        egp_per_100_points: Number(pointsConfig.egp_per_100_points)
      });
      const settings = res?.points_settings || res?.data?.points_settings || res;
      if (settings && settings.amount_egp) {
        setPointsConfig(prev => ({
          ...prev,
          amount_egp: parseFloat(settings.amount_egp) || prev.amount_egp,
          points_per_amount: parseInt(settings.points_per_amount, 10) || prev.points_per_amount
        }));
      }
      toast.success(res?.message || (isRtl ? 'تم تحديث إعدادات النقاط بنجاح' : 'Points configuration updated successfully'));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تحديث إعدادات النقاط' : 'Failed to update points settings'));
    } finally {
      setSavingPoints(false);
    }
  };

  const generateRandomCode = (prefix = '') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalCode = prefix ? `${prefix}-${rand}` : `CAFE90-${rand}`;
    setCouponForm(prev => ({ ...prev, code: finalCode }));
  };

  const handleOpenAddCoupon = (initialTarget = 'general') => {
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().slice(0, 10);

    setEditingCoupon(null);
    setUserSearchTerm('');
    setIsUserPickerOpen(false);
    setCouponForm({
      coupon_target: initialTarget,
      user_id: '',
      code: initialTarget === 'personal' ? 'VIP-50' : 'SAVE20',
      discount_mode: 'percentage',
      discount_percentage: '20',
      fixed_amount: '50',
      max_discount_amount: '',
      has_expiry: initialTarget !== 'personal',
      starts_at: today,
      expires_at: nextYearStr,
      max_usage: initialTarget === 'personal' ? '1' : '100',
      description: '',
      is_active: true
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setUserSearchTerm('');
    setIsUserPickerOpen(false);
    const isPersonal = Boolean(coupon.userId || coupon.user);
    const isFixed = coupon.discountMode === 'fixed';
    setCouponForm({
      coupon_target: isPersonal ? 'personal' : 'general',
      user_id: coupon.userId ? String(coupon.userId) : '',
      code: coupon.code,
      discount_mode: isFixed ? 'fixed' : 'percentage',
      discount_percentage: !isFixed ? String(coupon.discountPercentage || 20) : '100',
      fixed_amount: isFixed ? String(coupon.fixedAmount || 50) : '50',
      max_discount_amount: (!isFixed && coupon.maxDiscountAmount) ? String(coupon.maxDiscountAmount) : '',
      has_expiry: Boolean(coupon.expiresAt),
      starts_at: coupon.createdAt ? coupon.createdAt.slice(0, 10) : '',
      expires_at: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      max_usage: String(coupon.maxUsage || (isPersonal ? 1 : 100)),
      description: coupon.description || '',
      is_active: coupon.active
    });
    setIsCouponModalOpen(true);
  };

  const applyRefundPreset = (selectedUserId = null) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm(prev => ({
      ...prev,
      coupon_target: 'personal',
      user_id: selectedUserId ? String(selectedUserId) : (prev.user_id || (users[0]?.id ? String(users[0].id) : '')),
      code: `REFUND-${rand}`,
      discount_mode: 'fixed',
      discount_percentage: '100',
      fixed_amount: '32',
      max_discount_amount: '32',
      has_expiry: false,
      expires_at: '',
      max_usage: '1',
      description: isRtl ? 'قسيمة استرداد وتعويض مالي للعميل' : 'Customer refund / compensation voucher',
      is_active: true
    }));
  };

  const applyVipPreset = (selectedUserId = null) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm(prev => ({
      ...prev,
      coupon_target: 'personal',
      user_id: selectedUserId ? String(selectedUserId) : (prev.user_id || (users[0]?.id ? String(users[0].id) : '')),
      code: `VIP-REWARD-${rand}`,
      discount_mode: 'percentage',
      discount_percentage: '20',
      fixed_amount: '50',
      max_discount_amount: '50',
      has_expiry: true,
      max_usage: '5',
      description: isRtl ? 'مكافأة عميل VIP مميز' : 'Exclusive VIP customer reward',
      is_active: true
    }));
  };

  const handleSaveCoupon = async (e) => {
    e?.preventDefault?.();
    if (!couponForm.code.trim()) {
      toast.warning(isRtl ? 'كود الكوبون مطلوب' : 'Coupon code is required');
      return;
    }

    if (couponForm.coupon_target === 'personal' && !couponForm.user_id) {
      toast.warning(isRtl ? 'يرجى اختيار العميل المخصص له الكوبون' : 'Please select a customer for this personal coupon');
      return;
    }

    try {
      setSubmittingCoupon(true);
      const isFixed = couponForm.discount_mode === 'fixed';
      const isPersonal = couponForm.coupon_target === 'personal';

      // Backend Schema Alignment:
      // General: user_id: null
      // Personal: user_id: 11
      // Fixed: discount_percentage: "100.00", max_discount_amount: fixed_amount
      // Percentage: discount_percentage: value, max_discount_amount: cap (optional)
      const payload = {
        code: couponForm.code.toUpperCase().trim(),
        discount_percentage: isFixed ? '100.00' : Number(couponForm.discount_percentage || 20).toFixed(2),
        max_discount_amount: isFixed 
          ? Number(couponForm.fixed_amount || 0).toFixed(2)
          : (couponForm.max_discount_amount ? Number(couponForm.max_discount_amount).toFixed(2) : null),
        user_id: isPersonal && couponForm.user_id ? Number(couponForm.user_id) : null,
        expires_at: (couponForm.has_expiry && couponForm.expires_at) 
          ? `${couponForm.expires_at} 23:59:59` 
          : null,
        max_usage: Number(couponForm.max_usage || (isPersonal ? 1 : 100)),
        is_active: Boolean(couponForm.is_active)
      };

      if (couponForm.description?.trim()) {
        payload.description = couponForm.description.trim();
      }

      if (editingCoupon) {
        const res = await api.updateCoupon(editingCoupon.id, payload);
        const updatedCoupon = normalizeCoupon(res?.coupon || res?.data?.coupon || { ...editingCoupon.raw, ...payload, id: editingCoupon.id });
        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? updatedCoupon : c));
        toast.success(res?.message || (isRtl ? `تم تحديث الكوبون "${payload.code}" بنجاح` : `Coupon "${payload.code}" updated successfully`));
      } else {
        const res = await api.createCoupon(payload);
        const newCoupon = normalizeCoupon(res?.coupon || res?.data?.coupon || res?.data || { ...payload, id: res?.id || Date.now() });
        setCoupons(prev => [newCoupon, ...prev]);
        toast.success(res?.message || (isRtl ? `تم إنشاء الكوبون "${payload.code}" بنجاح` : `Coupon "${payload.code}" created successfully`));
      }

      setIsCouponModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حفظ الكوبون' : 'Failed to save coupon'));
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon) => {
    try {
      const newStatus = !coupon.active;
      const res = await api.updateCoupon(coupon.id, { is_active: newStatus });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: newStatus } : c))
      );
      toast.success(
        res?.message || (
          isRtl
            ? `أصبح الكوبون ${coupon.code} الآن ${newStatus ? 'مفعّلاً' : 'متوقفاً مؤقتاً'}`
            : `Coupon ${coupon.code} is now ${newStatus ? 'Active' : 'Paused'}`
        )
      );
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تغيير حالة الكوبون' : 'Failed to toggle coupon status'));
    }
  };

  const handleDeleteCouponConfirm = async () => {
    if (!deletingCoupon) return;
    try {
      setSubmittingCoupon(true);
      const res = await api.deleteCoupon(deletingCoupon.id);
      setCoupons(prev => prev.filter(c => c.id !== deletingCoupon.id));
      toast.success(res?.message || (isRtl ? 'تم حذف الكوبون بنجاح' : 'Coupon deleted successfully'));
      setDeletingCoupon(null);
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حذف الكوبون' : 'Failed to delete coupon'));
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
    toast.success(isRtl ? `تم نسخ الكود "${code}" للحافظة!` : `Copied code "${code}" to clipboard!`);
  };

  const shareCouponWhatsApp = (coupon) => {
    const rawPhone = coupon.user?.phone || '';
    if (!rawPhone) {
      toast.warning(isRtl ? 'لا يوجد رقم هاتف مسجل لهذا العميل' : 'No customer phone number available');
      return;
    }
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    const customerName = coupon.user?.name || (isRtl ? 'عميلنا العزيز' : 'Customer');
    const discountText = coupon.discountDisplay;
    const msg = isRtl
      ? `أهلاً بك يا ${customerName} في كافيه 90! ☕✨\nيسعدنا إهداؤك كود خصم خاص بك: *${coupon.code}*\nبقيمة: *${discountText}*.\nيمكنك استخدامه فوراً عند الدفع في تطبيق كافيه 90. نتمنى لك وقتاً ممتعاً!`
      : `Hello ${customerName}! ☕✨\nEnjoy your exclusive promo code from Cafe 90: *${coupon.code}*\nValue: *${discountText}*.\nApply it during checkout on the Cafe 90 mobile app!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Reward Items Handlers (Saved to Local Storage / State)
  const handleOpenAddReward = () => {
    setEditingReward(null);
    setRewardForm({
      name: '',
      nameEn: '',
      pointsRequired: 150,
      originalPrice: 50,
      category: 'مشروبات ساخنة',
      image: '',
      isActive: true
    });
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e) => {
    e.preventDefault();
    if (!rewardForm.name || !rewardForm.pointsRequired) {
      toast.warning(isRtl ? 'اسم الصنف والنقاط المطلوبة إلزامية' : 'Item name and points are required');
      return;
    }

    let updated = [];
    if (editingReward) {
      updated = rewardItems.map(r => r.id === editingReward.id ? { ...r, ...rewardForm } : r);
      toast.success(isRtl ? 'تم تحديث مكافأة الاستبدال' : 'Reward updated');
    } else {
      updated = [{ id: Date.now(), ...rewardForm }, ...rewardItems];
      toast.success(isRtl ? 'تمت إضافة صنف جديد لكتالوج استبدال النقاط' : 'New reward added to catalog');
    }
    setRewardItems(updated);
    try {
      localStorage.setItem('cafe90_reward_items', JSON.stringify(updated));
    } catch {}
    setIsRewardModalOpen(false);
  };

  const handleDeleteReward = (id) => {
    const updated = rewardItems.filter(r => r.id !== id);
    setRewardItems(updated);
    try {
      localStorage.setItem('cafe90_reward_items', JSON.stringify(updated));
    } catch {}
    toast.success(isRtl ? 'تم حذف الصنف من كتالوج المكافآت' : 'Reward removed from catalog');
  };

  return (
    <div className="space-y-5 animate-fade-in w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-chocolate-900">
              {t('pointsCouponsTitle', 'نظام النقاط وكوبونات الخصم')}
            </h2>
            <Badge variant="gold">{isRtl ? 'برنامج المكافآت والولاء' : 'Rewards & Loyalty'}</Badge>
          </div>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
            {isRtl
              ? 'إدارة كوبونات وأكواد الخصم، ومحرك احتساب نقاط الولاء لتطبيق الموبايل.'
              : 'Manage promo coupon codes and mobile loyalty points rules engine.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex items-center self-start md:self-auto p-1 bg-stone-200/50 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`h-8 px-3 text-[13px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'coupons'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{isRtl ? 'كوبونات الخصم' : 'Coupons'}</span>
            <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${activeTab === 'coupons' ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'}`}>{coupons.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('points-settings')}
            className={`h-8 px-3 text-[13px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'points-settings'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{isRtl ? 'قواعد احتساب النقاط' : 'Points Rules'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. COUPONS SECTION */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (() => {
        // Compute KPI Stats
        const totalCoupons = coupons.length;
        const activeCoupons = coupons.filter(c => c.active && !c.isExpired).length;
        const personalCoupons = coupons.filter(c => c.isPersonal).length;
        const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

        // Filter & Search Logic
        const filteredCoupons = coupons.filter((coupon) => {
          // Status/Type filter
          if (couponFilter === 'general' && coupon.isPersonal) return false;
          if (couponFilter === 'personal' && !coupon.isPersonal) return false;
          if (couponFilter === 'active' && (!coupon.active || coupon.isExpired)) return false;
          if (couponFilter === 'inactive' && coupon.active && !coupon.isExpired) return false;

          // Search filter
          if (couponSearch.trim()) {
            const q = couponSearch.toLowerCase().trim();
            const matchCode = coupon.code.toLowerCase().includes(q);
            const matchDesc = coupon.description?.toLowerCase().includes(q);
            const matchUserName = coupon.user?.name?.toLowerCase().includes(q);
            const matchUserPhone = coupon.user?.phone?.toLowerCase().includes(q);
            const matchUserEmail = coupon.user?.email?.toLowerCase().includes(q);
            return matchCode || matchDesc || matchUserName || matchUserPhone || matchUserEmail;
          }
          return true;
        });

        return (
          <div className="space-y-4">
            {/* Action Bar & Quick Creation */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1 pt-1">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-chocolate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gold-600" />
                  <span>{isRtl ? 'أكواد وقسائم الخصم الترويجية' : 'Promotional Coupon Codes'}</span>
                </h3>
                <p className="text-[13px] text-stone-500 mt-0.5">
                  {isRtl
                    ? 'إدارة الكوبونات العامة لجميع الزوار، والقسائم الخاصة والشخصية للعملاء والتعويضات.'
                    : 'Manage public promo vouchers and personal customer vouchers & refunds.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="gold"
                  size="md"
                  icon={Plus}
                  onClick={() => handleOpenAddCoupon('general')}
                >
                  {isRtl ? 'إنشاء كوبون جديد' : 'Create New Coupon'}
                </Button>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60">
                    <Tag className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[13px] font-medium text-stone-500 leading-tight">{isRtl ? 'إجمالي الكوبونات' : 'Total Coupons'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {totalCoupons}
                </div>
                <span className="mt-2 text-xs text-stone-500 block">
                  {isRtl ? 'مسجلة على السيرفر' : 'Registered on server'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200/60">
                    <CheckCircle2 className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[13px] font-medium text-stone-500 leading-tight">{isRtl ? 'الكوبونات الفعّالة' : 'Active Coupons'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {activeCoupons}
                </div>
                <span className="mt-2 text-xs text-stone-500 block">
                  {isRtl ? 'متاحة للاستخدام بالتطبيق' : 'Usable in mobile checkout'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-200/60">
                    <UserCheck className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[13px] font-medium text-stone-500 leading-tight">{isRtl ? 'قسائم شخصية لعملاء' : 'Personal Vouchers'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {personalCoupons}
                </div>
                <span className="mt-2 text-xs text-stone-500 block">
                  {isRtl ? 'VIP وقسائم استرداد مخصصة' : 'VIP & Refund vouchers'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200/60">
                    <TrendingUp className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[13px] font-medium text-stone-500 leading-tight">{isRtl ? 'مرات الاستخدام' : 'Total Redemptions'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {totalRedemptions}
                </div>
                <span className="mt-2 text-xs text-stone-500 block">
                  {isRtl ? 'تمت بنجاح في الطلبات' : 'Redeemed in orders'}
                </span>
              </div>
            </div>

            {/* Filter Chips & Search Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex items-center flex-wrap gap-1 p-1 bg-stone-200/50 rounded-xl self-start md:self-auto">
                {[
                  { key: 'all', label: isRtl ? 'الكل' : 'All', count: totalCoupons },
                  { key: 'general', label: isRtl ? 'كوبونات عامة' : 'General', count: totalCoupons - personalCoupons },
                  { key: 'personal', label: isRtl ? 'مخصصة لعملاء' : 'Personal', count: personalCoupons },
                  { key: 'active', label: isRtl ? 'نشطة' : 'Active', count: activeCoupons },
                  { key: 'inactive', label: isRtl ? 'متوقفة / منتهية' : 'Paused', count: totalCoupons - activeCoupons }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCouponFilter(tab.key)}
                    className={`h-8 px-3 rounded-lg text-[13px] transition-all cursor-pointer flex items-center gap-1.5 ${
                      couponFilter === tab.key
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'font-medium text-stone-500 hover:text-chocolate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                      couponFilter === tab.key ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder={isRtl ? 'بحث بالكود أو العميل...' : 'Search code or customer...'}
                  className="w-full h-10 ps-10 pe-9 text-sm rounded-xl bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                />
                {couponSearch && (
                  <button
                    type="button"
                    onClick={() => setCouponSearch('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Coupons List / Grid */}
            {filteredCoupons.length === 0 ? (
              <div className="bg-white rounded-2xl px-6 py-14 border border-stone-200/70 text-center space-y-4 shadow-card">
                <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold text-chocolate-900">
                    {couponSearch
                      ? (isRtl ? 'لم يتم العثور على نتائج للبحث' : 'No Coupons Found')
                      : (isRtl ? 'لا توجد كوبونات ضمن هذا التصنيف' : 'No Promo Coupons in this filter')}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {couponSearch
                      ? (isRtl ? `لم نجد أي كود أو عميل يطابق "${couponSearch}". حاول بكلمة بحث أخرى.` : `No match found for "${couponSearch}". Try another term.`)
                      : (isRtl ? 'يمكنك إنشاء كود عام ترويجي أو قسيمة خاصة لأحد العملاء بنقرة واحدة.' : 'Create a promo code or personal voucher to get started.')}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center">
                  <Button
                    variant="gold"
                    size="md"
                    icon={Plus}
                    onClick={() => handleOpenAddCoupon('general')}
                  >
                    {isRtl ? 'إنشاء أول كوبون خصم' : 'Create First Coupon'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCoupons.map((coupon) => {
                  const usagePercent = Math.min(
                    100,
                    Math.round(((coupon.usedCount || 0) / (coupon.maxUsage || 100)) * 100)
                  );
                  const isPersonal = coupon.isPersonal;
                  const isFixed = coupon.discountMode === 'fixed';

                  return (
                    <div
                      key={coupon.id}
                      className={`rounded-2xl border p-5 shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all flex flex-col justify-between space-y-4 relative group ${
                        !coupon.active || coupon.isExpired ? 'border-stone-200/70 bg-stone-50/60' : 'bg-white border-stone-200/70'
                      }`}
                    >
                      {/* Top Badges & Type */}
                      <div className={`flex items-start justify-between gap-2 ${!coupon.active || coupon.isExpired ? 'opacity-75' : ''}`}>
                        {isPersonal ? (
                          <div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-medium min-w-0">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[170px]">
                              {coupon.user?.name ? `${coupon.user.name}` : (isRtl ? `عميل #${coupon.userId}` : `User #${coupon.userId}`)}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 border border-gold-200/70 text-gold-800 text-xs font-medium min-w-0">
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{isRtl ? 'كوبون عام لجميع العملاء' : 'Public Promo Code'}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          {coupon.isExpired ? (
                            <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                              {isRtl ? 'منتهي الصلاحية' : 'Expired'}
                            </span>
                          ) : coupon.active ? (
                            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {isRtl ? 'نشط' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                              {isRtl ? 'متوقف مؤقتاً' : 'Paused'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Code Hero Box & Discount Value */}
                      <div className={`flex items-start justify-between gap-3 ${!coupon.active || coupon.isExpired ? 'opacity-75' : ''}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-lg text-chocolate-950 tracking-wider tabular-nums bg-stone-50 px-3 h-10 inline-flex items-center rounded-xl border border-dashed border-stone-300 select-all">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyCouponCode(coupon.code)}
                              className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? "نسخ الكود" : "Copy Code"}
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Customer phone / subtitle */}
                          {coupon.user?.phone && (
                            <p className="text-xs text-stone-500 mt-2 tabular-nums flex items-center gap-1" dir="ltr">
                              <span>📱 {coupon.user.phone}</span>
                            </p>
                          )}

                          <p className="text-[13px] text-stone-500 mt-2 line-clamp-2">
                            {coupon.description || (isPersonal 
                              ? (isRtl ? 'قسيمة خصم وتعويض شخصية' : 'Personal discount voucher')
                              : (isRtl ? 'خصم ترويجي لعملاء كافيه 90' : 'Promotional discount'))}
                          </p>
                        </div>

                        {/* Discount Hero Value */}
                        <div className="text-end shrink-0">
                          <span className="text-2xl sm:text-[28px] font-semibold text-chocolate-950 tabular-nums block leading-none">
                            {coupon.discountDisplay}
                          </span>
                          <span className="block text-[11px] text-stone-500 font-medium mt-1.5">
                            {isFixed 
                              ? (isRtl ? 'قسيمة رصيد مالي' : 'Cash Voucher')
                              : (isRtl ? 'نسبة خصم مئوية' : 'Percentage Off')}
                          </span>
                          {coupon.maxDiscountAmount && !isFixed ? (
                            <span className="inline-flex mt-1.5 text-[11px] text-amber-700 font-medium tabular-nums bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/70">
                              {isRtl ? `أقصى خصم: ${coupon.maxDiscountAmount} ج.م` : `Cap: ${coupon.maxDiscountAmount} EGP`}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Conditions & Validity Meta */}
                      <div className="px-3.5 py-3 rounded-xl bg-stone-50/80 border border-stone-200/70 text-[13px] space-y-2">
                        <div className="flex justify-between items-center gap-2 text-stone-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{isRtl ? 'الصلاحية والانتهاء:' : 'Validity:'}</span>
                          </span>
                          <span className="font-semibold text-chocolate-900">
                            {!coupon.hasExpiry ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 text-[11px] font-medium">
                                ∞ {isRtl ? 'دائم بدون تاريخ انتهاء' : 'Lifetime (No Expiry)'}
                              </span>
                            ) : (
                              <span className="tabular-nums text-[13px]">{coupon.validUntilFormatted || coupon.validUntil}</span>
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2 text-stone-500">
                          <span>{isRtl ? 'أقصى عدد استخدام:' : 'Max Usage:'}</span>
                          <span className="font-semibold text-chocolate-900 tabular-nums">
                            {coupon.maxUsage} {isRtl ? 'مرة' : 'times'}
                            {coupon.remainingUsage !== null && (
                              <span className="text-stone-400 font-normal ms-1 text-[11px]">
                                ({isRtl ? `متبقي ${coupon.remainingUsage}` : `${coupon.remainingUsage} left`})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Usage Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-medium text-stone-500 mb-1.5 tabular-nums">
                          <span>{isRtl ? 'تم استخدامه:' : 'Redeemed:'} {coupon.usedCount || 0} / {coupon.maxUsage}</span>
                          <span className="font-semibold text-chocolate-800">{usagePercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              usagePercent >= 100
                                ? 'bg-rose-500'
                                : 'bg-gold-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        {/* Toggle Active Switch */}
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            size="sm"
                            checked={coupon.active}
                            onChange={() => handleToggleCouponActive(coupon)}
                            ariaLabel={isRtl ? 'حالة تفعيل الكوبون' : 'Toggle Coupon Status'}
                          />
                          <span className={`text-xs font-semibold ${coupon.active ? 'text-emerald-700' : 'text-stone-500'}`}>
                            {coupon.active ? (isRtl ? 'مفعّل' : 'Active') : (isRtl ? 'معطّل' : 'Paused')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* WhatsApp Direct Share (For Personal Coupons with Phone) */}
                          {isPersonal && coupon.user?.phone && (
                            <button
                              type="button"
                              onClick={() => shareCouponWhatsApp(coupon)}
                              className="h-8 w-8 inline-flex items-center justify-center text-emerald-600 bg-white hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200/70 shadow-2xs"
                              title={isRtl ? 'إرسال الكود للعميل عبر الواتساب' : 'Share coupon via WhatsApp'}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEditCoupon(coupon)}
                          >
                            {isRtl ? 'تعديل' : 'Edit'}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            className="!text-rose-600 hover:!bg-rose-50"
                            onClick={() => setDeletingCoupon(coupon)}
                          >
                            {isRtl ? 'حذف' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2. POINTS SETTINGS & ENGINE SECTION */}
      {/* ========================================================================= */}
      {activeTab === 'points-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
          {/* Settings Form (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/70 shadow-card space-y-5">
            <div className="pb-4 border-b border-stone-100">
              <h3 className="text-[15px] font-bold text-chocolate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-600" />
                <span>{isRtl ? 'محرك ومعادلات احتساب نقاط الولاء (Loyalty Engine)' : 'Loyalty Points Engine & Conversion'}</span>
              </h3>
              <p className="text-[13px] text-stone-500 mt-0.5 leading-relaxed">
                {isRtl
                  ? 'ضبط معايير اكتساب النقاط على المشتريات ومكافآت التقييم والتسجيل، وقيمتها المالية عند الاستبدال في التطبيق.'
                  : 'Configure points earning rates, welcome gifts, review bonuses, and redemption values in the mobile app.'}
              </p>
            </div>

            <form onSubmit={handleSavePointsSettings} className="space-y-5 text-sm">
              {/* Earning Rules */}
              <div>
                <h4 className="text-[13px] font-semibold text-chocolate-900 mb-2.5">
                  {isRtl ? '1. قواعد اكتساب النقاط على المشتريات' : '1. Purchase Earning Rules'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-stone-200/70">
                  <div>
                    <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                      {isRtl ? 'المبلغ المطلوب للصرف (ج.م) *' : 'Spend Amount (EGP) *'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={pointsConfig.amount_egp}
                        onChange={(e) =>
                          setPointsConfig({ ...pointsConfig, amount_egp: Number(e.target.value) })
                        }
                        className="w-full h-10 ps-3 pe-20 rounded-xl bg-white border border-stone-200 text-sm font-semibold tabular-nums text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                        required
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                        {isRtl ? 'جنيه مصري' : 'EGP'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                      {isRtl ? 'النقاط المكتسبة لكل مبلغ *' : 'Points Earned per Amount *'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={pointsConfig.points_per_amount}
                        onChange={(e) =>
                          setPointsConfig({ ...pointsConfig, points_per_amount: Number(e.target.value) })
                        }
                        className="w-full h-10 ps-3 pe-20 rounded-xl bg-white border border-stone-200 text-sm font-semibold tabular-nums text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                        required
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                        {isRtl ? 'نقطة ولاء' : 'Points'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-stone-500 mt-2 px-1 leading-relaxed">
                  💡 {isRtl
                    ? `المعادلة الحالية: كل ${pointsConfig.amount_egp} ج.م يصرفها العميل تمنحه ${pointsConfig.points_per_amount} نقطة ولاء في حسابه.`
                    : `Current formula: Every ${pointsConfig.amount_egp} EGP spent awards ${pointsConfig.points_per_amount} points.`}
                </p>
              </div>

              {/* Redemption & Value */}
              <div>
                <h4 className="text-[13px] font-semibold text-chocolate-900 mb-2.5">
                  {isRtl ? '2. القيمة المالية واستبدال النقاط' : '2. Point Value & Redemption'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-stone-200/70">
                  <div>
                    <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                      {isRtl ? 'قيمة الخصم لكل 100 نقطة (ج.م) *' : 'Discount per 100 Points (EGP) *'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={pointsConfig.egp_per_100_points}
                        onChange={(e) =>
                          setPointsConfig({ ...pointsConfig, egp_per_100_points: Number(e.target.value) })
                        }
                        className="w-full h-10 ps-3 pe-20 rounded-xl bg-white border border-stone-200 text-sm font-semibold tabular-nums text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                        required
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                        {isRtl ? 'ج.م خصم' : 'EGP off'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                      {isRtl ? 'الحد الأدنى للنقاط للاستبدال *' : 'Min Points to Redeem *'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        value={pointsConfig.min_redeem_points}
                        onChange={(e) =>
                          setPointsConfig({ ...pointsConfig, min_redeem_points: Number(e.target.value) })
                        }
                        className="w-full h-10 ps-3 pe-20 rounded-xl bg-white border border-stone-200 text-sm font-semibold tabular-nums text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                        required
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                        {isRtl ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  icon={Save}
                  loading={savingPoints}
                >
                  {isRtl ? 'حفظ إعدادات النقاط' : 'Save Points Rules'}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Live App Simulator & Journey Map (1 Col) */}
          <div className="space-y-4 sm:space-y-5">
            {/* Live Interactive Points Calculator */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-card space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-[15px] font-bold text-chocolate-900">
                    {isRtl ? 'حاسبة النقاط التفاعلية' : 'Points Simulator'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Preview
                </span>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                  {isRtl ? 'قيمة طلب افتراضي للعميل (ج.م):' : 'Sample Order Value (EGP):'}
                </label>
                <input
                  type="number"
                  step="50"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm font-semibold tabular-nums text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                />
              </div>

              {/* Calculated Outputs */}
              {(() => {
                const earnedPoints = Math.floor((simAmount / (pointsConfig.amount_egp || 100)) * (pointsConfig.points_per_amount || 10));
                const redeemDiscount = Math.floor((earnedPoints / 100) * (pointsConfig.egp_per_100_points || 20));
                return (
                  <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/70 space-y-2.5 text-[13px]">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">{isRtl ? 'النقاط المكتسبة:' : 'Points Earned:'}</span>
                      <span className="font-semibold text-gold-700 text-sm tabular-nums">+{earnedPoints} {isRtl ? 'نقطة' : 'pts'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">{isRtl ? 'القيمة المعادلة للخصم:' : 'Redeem Value:'}</span>
                      <span className="font-semibold text-emerald-700 text-sm tabular-nums">EGP {redeemDiscount}</span>
                    </div>
                    <div className="pt-2.5 border-t border-stone-200/70 text-xs text-stone-500 leading-relaxed">
                      {isRtl
                        ? `عند دفع ${simAmount} ج.م في الكافيه، يكسب العميل ${earnedPoints} نقطة تعادل خصماً بقيمة ${redeemDiscount} ج.م في طلباته القادمة.`
                        : `A ${simAmount} EGP order gives the guest ${earnedPoints} points redeemable for ${redeemDiscount} EGP.`}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Mobile Journey Flow Card (Matching Mobile Screen) */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-stone-100 text-stone-600 ring-stone-200/70">
                  <Smartphone className="w-4 h-4" />
                </span>
                <h4 className="text-[15px] font-bold text-chocolate-900">
                  {isRtl ? 'خريطة رحلة النقاط بالتطبيق' : 'App Loyalty Journey'}
                </h4>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                  <div className="w-9 h-9 rounded-xl bg-white ring-1 ring-inset ring-stone-200/70 flex items-center justify-center text-base shrink-0">
                    ☕
                  </div>
                  <div>
                    <p className="font-semibold text-chocolate-900">{isRtl ? '1. اطلب من الكافيه' : '1. Place Order'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{isRtl ? 'صالة، غرفة VIP، أو تيك اواي' : 'Dine-in, VIP Room, or Takeaway'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                  <div className="w-9 h-9 rounded-xl bg-white ring-1 ring-inset ring-stone-200/70 flex items-center justify-center text-base shrink-0">
                    🌟
                  </div>
                  <div>
                    <p className="font-semibold text-chocolate-900">{isRtl ? '2. اجمع النقاط' : '2. Earn Points'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{isRtl ? 'تضاف رصيدك فور تأكيد الطلب' : 'Added upon confirmation'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                  <div className="w-9 h-9 rounded-xl bg-white ring-1 ring-inset ring-stone-200/70 flex items-center justify-center text-base shrink-0">
                    🎁
                  </div>
                  <div>
                    <p className="font-semibold text-chocolate-900">{isRtl ? '3. استبدل بمشروبات وهدايا' : '3. Redeem Rewards'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{isRtl ? 'مشروبات مجانية أو خصم مالي مباشر' : 'Free items or instant cash discount'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Coupon Modal (Add / Edit) */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title={editingCoupon ? (isRtl ? "تعديل بيانات الكوبون" : "Edit Promo Coupon") : (isRtl ? "إنشاء قسيمة / كود خصم جديد" : "Create New Coupon")}
        subtitle={isRtl ? "تخصيص الكوبون لجميع العملاء أو لعميل محدد، وتحديد نوع وقيمة الخصم" : "Configure coupon for all users or a specific customer with custom discount rules"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCouponModalOpen(false)}
              disabled={submittingCoupon}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveCoupon}
              loading={submittingCoupon}
            >
              {editingCoupon ? (isRtl ? "حفظ التعديلات" : "Save Changes") : (isRtl ? "تفعيل وحفظ الكوبون" : "Save & Activate")}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4 text-sm">
          {/* Target Audience Switcher: General vs Personal */}
          <div className="p-4 rounded-xl border border-stone-200/70 space-y-2.5">
            <label className="block text-[13px] font-semibold text-chocolate-800">
              {isRtl ? 'نطاق وتوجيه الكوبون *' : 'Coupon Audience Target *'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCouponForm(prev => ({ ...prev, coupon_target: 'general', user_id: '' }))}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                  couponForm.coupon_target === 'general'
                    ? 'bg-white border-gold-400 ring-4 ring-gold-400/15 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  couponForm.coupon_target === 'general' ? 'bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/60' : 'bg-stone-100 text-stone-500'
                }`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[13px] text-chocolate-900">
                    {isRtl ? 'كوبون عام للجميع' : 'Public Promo Code'}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {isRtl ? 'متاح لأي عميل بالتطبيق' : 'Available for all users'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCouponForm(prev => ({
                  ...prev,
                  coupon_target: 'personal',
                  user_id: prev.user_id || (users[0]?.id ? String(users[0].id) : ''),
                  max_usage: '1'
                }))}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                  couponForm.coupon_target === 'personal'
                    ? 'bg-white border-indigo-400 ring-4 ring-indigo-400/15 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  couponForm.coupon_target === 'personal' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/60' : 'bg-stone-100 text-stone-500'
                }`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[13px] text-chocolate-900">
                    {isRtl ? 'قسيمة خاصة لعميل محدد' : 'Personal Customer Voucher'}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {isRtl ? 'تعويض أو مكافأة VIP مخصصة' : 'Refund or VIP customer gift'}
                  </p>
                </div>
              </button>
            </div>

            {/* Personal Customer Selector & Quick Presets */}
            {couponForm.coupon_target === 'personal' && (
              <div className="pt-3 border-t border-stone-100 space-y-3">
                {/* Quick Presets for Personal Vouchers */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-medium text-stone-500">
                    ⚡ {isRtl ? 'نماذج وقوالب جاهزة سريعة:' : 'Quick Presets:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyRefundPreset(couponForm.user_id)}
                      className="h-7 px-2.5 bg-white hover:bg-rose-50 border border-rose-200/70 text-rose-700 rounded-lg text-xs font-medium shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <DollarSign className="w-3 h-3 text-rose-600" />
                      <span>{isRtl ? 'قسيمة استرداد نقدي (Refund)' : 'Refund Voucher'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVipPreset(couponForm.user_id)}
                      className="h-7 px-2.5 bg-white hover:bg-indigo-50 border border-indigo-200/70 text-indigo-700 rounded-lg text-xs font-medium shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Star className="w-3 h-3 text-indigo-600" />
                      <span>{isRtl ? 'مكافأة عميل VIP (20%)' : 'VIP Gift (20%)'}</span>
                    </button>
                  </div>
                </div>

                {/* Searchable Target Customer Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[13px] font-semibold text-chocolate-800">
                      {isRtl ? 'اختر العميل المستفيد *' : 'Select Target Customer *'}
                    </label>
                    <span className="text-xs text-stone-400 font-medium tabular-nums">
                      {users.length} {isRtl ? 'عميل مسجل' : 'registered'}
                    </span>
                  </div>

                  {couponForm.user_id ? (
                    /* Selected User Card */
                    (() => {
                      const selectedUser = users.find(u => String(u.id) === String(couponForm.user_id));
                      if (!selectedUser) return null;
                      return (
                        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/70 flex items-center justify-between gap-3 transition-all animate-fade-in">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200/60 font-semibold flex items-center justify-center text-sm shrink-0">
                              {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-[13px] text-chocolate-950 truncate">{selectedUser.name}</p>
                                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-200/70 tabular-nums">
                                  ID: {selectedUser.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-stone-500 truncate mt-0.5">
                                {selectedUser.phone && <span>📱 {selectedUser.phone}</span>}
                                {selectedUser.email && <span>✉️ {selectedUser.email}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setUserSearchTerm('');
                                setIsUserPickerOpen(prev => !prev);
                              }}
                              className="h-8 px-3 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 text-chocolate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                            >
                              {isUserPickerOpen ? (isRtl ? 'إغلاق القائمة' : 'Close') : (isRtl ? 'تغيير العميل' : 'Change')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCouponForm({ ...couponForm, user_id: '' });
                                setUserSearchTerm('');
                                setIsUserPickerOpen(true);
                              }}
                              className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'إلغاء التحديد' : 'Deselect'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}

                  {/* Search Input & Filtered User List */}
                  {(!couponForm.user_id || isUserPickerOpen) && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder={isRtl ? "ابحث بالاسم، رقم الهاتف، الإيميل، أو رقم ID..." : "Search by name, phone, email, or ID..."}
                          className="w-full h-10 ps-10 pe-9 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                          autoFocus={isUserPickerOpen}
                        />
                        {userSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setUserSearchTerm('')}
                            className="absolute end-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filtered Users List */}
                      {(() => {
                        const q = userSearchTerm.trim().toLowerCase();
                        const filtered = !q
                          ? users.slice(0, 25)
                          : users.filter(u => {
                              const nameStr = (u.name || '').toLowerCase();
                              const phoneStr = String(u.phone || '');
                              const emailStr = (u.email || '').toLowerCase();
                              const idStr = String(u.id);
                              return nameStr.includes(q) || phoneStr.includes(q) || emailStr.includes(q) || idStr.includes(q);
                            }).slice(0, 50);

                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between px-1 text-[11px] font-medium text-stone-400">
                              <span>
                                {q
                                  ? (isRtl ? `نتائج البحث (${filtered.length})` : `Matches (${filtered.length})`)
                                  : (isRtl ? `قائمة العملاء (${filtered.length} من ${users.length})` : `Customers (${filtered.length} of ${users.length})`)}
                              </span>
                              {q && filtered.length === 50 && (
                                <span className="text-amber-600">{isRtl ? 'أول 50 نتيجة (حدد البحث)' : 'Top 50 results'}</span>
                              )}
                            </div>

                            <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-stone-100 pe-1">
                              {filtered.length === 0 ? (
                                <div className="p-4 text-center text-xs text-stone-400 font-medium">
                                  {isRtl ? 'لا يوجد أي عميل يطابق معايير البحث' : 'No matching customers found'}
                                </div>
                              ) : (
                                filtered.map(u => {
                                  const isSelected = String(couponForm.user_id) === String(u.id);
                                  return (
                                    <div
                                      key={u.id}
                                      onClick={() => {
                                        setCouponForm(prev => ({ ...prev, user_id: String(u.id) }));
                                        setIsUserPickerOpen(false);
                                        setUserSearchTerm('');
                                      }}
                                      className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-indigo-50 border border-indigo-200/70'
                                          : 'hover:bg-stone-50 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 font-semibold flex items-center justify-center text-xs shrink-0">
                                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-semibold text-[13px] text-chocolate-900 truncate">{u.name}</p>
                                          <div className="flex items-center gap-2 text-[11px] text-stone-500 truncate">
                                            {u.phone && <span>📱 {u.phone}</span>}
                                            {u.email && <span>✉️ {u.email}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[11px] tabular-nums font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                                          ID: {u.id}
                                        </span>
                                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Coupon Code Input & Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-chocolate-800">
                {isRtl ? 'كود الكوبون (Coupon Code) *' : 'Coupon Code *'}
              </label>
              <button
                type="button"
                onClick={() => generateRandomCode(couponForm.coupon_target === 'personal' ? 'VIP' : 'CAFE90')}
                className="h-7 px-2 rounded-lg text-xs font-semibold text-gold-700 hover:text-gold-800 hover:bg-gold-50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Shuffle className="w-3 h-3" />
                <span>{isRtl ? 'توليد كود عشوائي' : 'Generate Random'}</span>
              </button>
            </div>
            <input
              type="text"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
              placeholder={couponForm.coupon_target === 'personal' ? "مثال: VIP-CUSTOMER-50 أو REFUND-99X" : "مثال: SAVE20 أو CAFE90"}
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-semibold uppercase tracking-wider tabular-nums"
              required
            />
          </div>

          {/* Discount Mode Switcher (Percentage % vs Fixed Amount ج.م) */}
          <div className="p-4 rounded-xl border border-stone-200/70 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[13px] font-semibold text-chocolate-800">
                {isRtl ? 'نوع وطريقة احتساب الخصم *' : 'Discount Calculation Type *'}
              </label>
              
              <div className="inline-flex items-center self-start sm:self-auto p-1 bg-stone-200/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCouponForm(prev => ({ ...prev, discount_mode: 'percentage' }))}
                  className={`h-8 px-3 rounded-lg text-[13px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    couponForm.discount_mode === 'percentage'
                      ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                      : 'font-medium text-stone-500 hover:text-chocolate-900'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نسبة مئوية (%)' : 'Percentage (%)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCouponForm(prev => ({ ...prev, discount_mode: 'fixed' }))}
                  className={`h-8 px-3 rounded-lg text-[13px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    couponForm.discount_mode === 'fixed'
                      ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                      : 'font-medium text-stone-500 hover:text-chocolate-900'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'مبلغ ثابت (ج.م)' : 'Fixed Cash (EGP)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Value Presets */}
            <div>
              <span className="text-xs text-stone-500 font-medium block mb-1.5">
                ⚡ {isRtl ? 'خيارات سريعة للاختيار المباشر:' : 'Quick Presets:'}
              </span>
              <div className="flex items-center flex-wrap gap-1.5">
                {couponForm.discount_mode === 'percentage'
                  ? [10, 15, 20, 25, 30, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCouponForm(prev => ({ ...prev, discount_percentage: val.toString() }))}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer tabular-nums ${
                          String(couponForm.discount_percentage) === String(val)
                            ? 'bg-gold-50 text-gold-800 border border-gold-400 ring-4 ring-gold-400/15'
                            : 'bg-white text-stone-700 border border-stone-200 shadow-2xs hover:bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        {val}% {val === 100 ? (isRtl ? '(مجاني)' : '(Free)') : ''}
                      </button>
                    ))
                  : [10, 20, 32, 50, 75, 100, 150].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCouponForm(prev => ({ ...prev, fixed_amount: val.toString(), max_discount_amount: val.toString() }))}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer tabular-nums ${
                          String(couponForm.fixed_amount) === String(val)
                            ? 'bg-gold-50 text-gold-800 border border-gold-400 ring-4 ring-gold-400/15'
                            : 'bg-white text-stone-700 border border-stone-200 shadow-2xs hover:bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        {val} {isRtl ? 'ج.م' : 'EGP'}
                      </button>
                    ))}
              </div>
            </div>

            {/* Inputs based on Discount Mode */}
            {couponForm.discount_mode === 'percentage' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'نسبة الخصم (%) *' : 'Discount Percentage (%) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={couponForm.discount_percentage}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_percentage: e.target.value })}
                      placeholder="20"
                      className="w-full h-10 ps-3 pe-9 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-semibold tabular-nums"
                      required
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'سقف الخصم الأقصى (ج.م - اختياري)' : 'Max Discount Cap (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.max_discount_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                    placeholder={isRtl ? "مثال: 50 (بدون سقف اتركه فارغاً)" : "e.g. 50 (leave empty for no cap)"}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                  {isRtl ? 'مبلغ القسيمة / الرصيد المالي المباشر (ج.م) *' : 'Fixed Discount Amount (EGP) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={couponForm.fixed_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, fixed_amount: e.target.value, max_discount_amount: e.target.value })}
                    placeholder="50"
                    className="w-full h-10 ps-3 pe-12 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-semibold tabular-nums"
                    required
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 pointer-events-none">
                    {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                  {isRtl 
                    ? '💡 يتم خصم هذا المبلغ بالكامل مباشرة من إجمالي فاتورة العميل عند استخدام الكود.'
                    : '💡 This exact amount will be deducted directly from the customer total bill.'}
                </p>
              </div>
            )}
          </div>

          {/* Usage Count & Validity Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'أقصى عدد مرات للاستخدام *' : 'Max Usage Count *'}
              </label>
              <input
                type="number"
                min="1"
                value={couponForm.max_usage}
                onChange={(e) => setCouponForm({ ...couponForm, max_usage: e.target.value })}
                placeholder={couponForm.coupon_target === 'personal' ? "1" : "100"}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition tabular-nums"
                required
              />
              <span className="text-xs text-stone-500 mt-1.5 block">
                {couponForm.coupon_target === 'personal' 
                  ? (isRtl ? 'غالباً تكون 1 مرة للقسائم الشخصية والتعويضات' : 'Usually 1 for personal vouchers')
                  : (isRtl ? 'عدد مرات الاستخدام لجميع الزوار مجتمعين' : 'Total limit across all users')}
              </span>
            </div>

            {/* Expiration Toggle & Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold text-chocolate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold-600" />
                  <span>{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-stone-500">
                    {couponForm.has_expiry ? (isRtl ? 'محدد بوقت' : 'Expiring') : (isRtl ? 'دائم' : 'Lifetime')}
                  </span>
                  <ToggleSwitch
                    size="sm"
                    checked={couponForm.has_expiry}
                    onChange={(val) => setCouponForm(prev => ({ ...prev, has_expiry: val }))}
                    ariaLabel={isRtl ? 'تحديد تاريخ انتهاء' : 'Toggle Expiry'}
                  />
                </div>
              </div>

              {couponForm.has_expiry ? (
                <input
                  type="date"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                  required={couponForm.has_expiry}
                />
              ) : (
                <div className="h-10 px-3 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-medium text-center">
                  ∞ {isRtl ? 'كوبون دائم بدون تاريخ انتهاء صلاحية' : 'Lifetime coupon (No expiration date)'}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'وصف الكوبون وشروطه (اختياري)' : 'Description / Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              placeholder={isRtl ? "مثال: خصم 20% بمناسبة الافتتاح، أو تعويض تأخير أوردر..." : "e.g. 20% opening promo, or order delay compensation..."}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition resize-none"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-stone-200/70">
            <div>
              <p className="font-semibold text-[13px] text-chocolate-900">
                {isRtl ? 'حالة نشاط وتفعيل الكوبون' : 'Coupon Active Status'}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {isRtl ? 'إتاحة استخدام الكود فوراً في شاشة دفع تطبيق الموبايل' : 'Allow customers to redeem this promo code immediately'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${couponForm.is_active ? 'text-emerald-700' : 'text-rose-700'}`}>
                {couponForm.is_active ? (isRtl ? 'مفعّل' : 'Active') : (isRtl ? 'متوقف مؤقتاً' : 'Paused')}
              </span>
              <ToggleSwitch
                checked={couponForm.is_active}
                onChange={(val) => setCouponForm({ ...couponForm, is_active: val })}
                ariaLabel={isRtl ? 'تفعيل الكوبون' : 'Toggle Coupon Status'}
              />
            </div>
          </div>
        </form>
      </Modal>



      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCoupon)}
        onClose={() => setDeletingCoupon(null)}
        onConfirm={handleDeleteCouponConfirm}
        title={isRtl ? "حذف كوبون الخصم؟" : "Delete Promo Coupon?"}
        message={isRtl
          ? `هل أنت متأكد من رغبتك في حذف وتعطيل الكوبون "${deletingCoupon?.code}"؟`
          : `Are you sure you want to deactivate and delete coupon "${deletingCoupon?.code}"?`
        }
        loading={submittingCoupon}
      />
    </div>
  );
};
