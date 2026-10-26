import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  AlertTriangle,
  Save,
  Apple,
  Store,
  Wrench,
  CreditCard
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';

export const AppVersionView = () => {
  const toast = useToast();
  const { isRtl } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core App Version State matching Backend Schema
  const [formData, setFormData] = useState({
    androidVersion: '1.0.0',
    androidEndDate: null,
    androidUrl: null,
    iosVersion: '1.0.0',
    iosEndDate: null,
    iosUrl: null,
    isOpen: true,
    maintenance: false,
    iosPaymentEnabled: true
  });

  const [initialData, setInitialData] = useState(null);

  // Fetch current app version settings from GET /app-version/check
  const loadAppVersion = async () => {
    try {
      setLoading(true);
      const res = await api.getAppVersion();
      const data = res?.appVersion || res?.data || res;

      if (data && typeof data === 'object') {
        const normalized = {
          androidVersion: data.androidVersion || '1.0.0',
          androidEndDate: data.androidEndDate || null,
          androidUrl: data.androidUrl || null,
          iosVersion: data.iosVersion || '1.0.0',
          iosEndDate: data.iosEndDate || null,
          iosUrl: data.iosUrl || null,
          isOpen: typeof data.isOpen === 'boolean' ? data.isOpen : Boolean(data.isOpen ?? true),
          maintenance: typeof data.maintenance === 'boolean' ? data.maintenance : Boolean(data.maintenance ?? false),
          iosPaymentEnabled: typeof data.iosPaymentEnabled === 'boolean' ? data.iosPaymentEnabled : Boolean(data.iosPaymentEnabled ?? true)
        };
        setFormData(normalized);
        setInitialData(normalized);
      }
    } catch (err) {
      console.warn('Error loading app version:', err);
      toast.error(isRtl ? 'فشل جلب إعدادات نسخة التطبيق' : 'Failed to fetch app version settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppVersion();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };



  // Save changes via PUT /admin/app-version
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // Prepare clean JSON payload
    const payload = {
      androidVersion: formData.androidVersion ? String(formData.androidVersion).trim() : '1.0.0',
      androidEndDate: formData.androidEndDate || null,
      androidUrl: formData.androidUrl ? String(formData.androidUrl).trim() : null,
      iosVersion: formData.iosVersion ? String(formData.iosVersion).trim() : '1.0.0',
      iosEndDate: formData.iosEndDate || null,
      iosUrl: formData.iosUrl ? String(formData.iosUrl).trim() : null,
      isOpen: Boolean(formData.isOpen),
      maintenance: Boolean(formData.maintenance),
      iosPaymentEnabled: Boolean(formData.iosPaymentEnabled)
    };

    try {
      setSaving(true);
      const res = await api.updateAppVersion(payload);
      
      const updated = res?.appVersion || res?.data?.appVersion || payload;
      // نفس المفاتيح بس عشان مقارنة "فيه تعديلات" متتلخبطش
      const synced = Object.fromEntries(
        Object.keys(formData).map((k) => [k, updated[k] !== undefined ? updated[k] : payload[k]])
      );
      setFormData(synced);
      setInitialData(synced);

      const successMsg = res?.message || (isRtl ? 'تم تحديث إعدادات نسخة التطبيق بنجاح' : 'App version settings updated successfully');
      toast.success(successMsg);
    } catch (err) {
      console.error('Save app version error:', err);
      toast.error(err?.message || (isRtl ? 'فشل تحديث إعدادات التطبيق' : 'Failed to update app version settings'));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = initialData && JSON.stringify(formData) !== JSON.stringify(initialData);

  // Shared visual tokens (presentation only)
  const cardCls = 'bg-white rounded-2xl border border-stone-200/70 shadow-card';
  const labelCls = 'block text-[13px] font-semibold text-chocolate-800 mb-1.5';
  const inputCls = 'w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm font-semibold tabular-nums text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition';
  const pillCls = 'inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium border';

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto">
      {loading ? (
        <div className={`${cardCls} p-6 animate-pulse space-y-4`}>
          <div className="h-5 bg-stone-200/70 rounded-lg w-1/4" />
          <div className="h-24 bg-stone-100 rounded-xl w-full" />
          <div className="h-24 bg-stone-100 rounded-xl w-full" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* System Control Switches */}
          <div className={cardCls}>
            <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-stone-200/70">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60 shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-chocolate-900 leading-snug">
                  {isRtl ? 'التحكم في حالة التطبيق' : 'App Availability'}
                </h3>
                <p className="text-[13px] text-stone-500 mt-0.5 leading-relaxed">
                  {isRtl ? 'تحكم في استقبال الطلبات ووضع الصيانة لجميع مستخدمي التطبيق' : 'Control ordering and maintenance mode for every mobile app user'}
                </p>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {/* Switch 1: Store Ordering (isOpen) */}
              <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset transition-colors shrink-0 ${
                    formData.isOpen
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                      : 'bg-stone-100 text-stone-500 ring-stone-200/60'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-chocolate-900 leading-snug">
                      {isRtl ? 'حالة استقبال الطلبات (Store Open)' : 'Store Ordering Status'}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      {formData.isOpen
                        ? (isRtl ? 'الفرع مفتوح والتطبيق يستقبل الطلبات بشكل طبيعي' : 'Open for ordering via mobile app')
                        : (isRtl ? 'الفرع مغلق مؤقتاً ولا يستقبل طلبات جديدة' : 'Store closed, orders paused')}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-stone-400">
                        {isRtl ? 'الحالة المعروضة للعميل:' : 'Displayed to Guest:'}
                      </span>
                      <span className={`${pillCls} ${
                        formData.isOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                          : 'bg-stone-100 text-stone-600 border-stone-200/70'
                      }`}>
                        {formData.isOpen ? (isRtl ? 'مفتوح ومتاح ☕' : 'Open & Active ☕') : (isRtl ? 'مغلق حالياً 🔒' : 'Currently Closed 🔒')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <ToggleSwitch
                    size="md"
                    checked={formData.isOpen}
                    onChange={(val) => handleChange('isOpen', val)}
                    ariaLabel={isRtl ? 'تبديل حالة الفرع' : 'Toggle Store Open/Closed'}
                  />
                </div>
              </div>

              {/* Switch 2: Maintenance Mode (maintenance) */}
              <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset transition-colors shrink-0 ${
                    formData.maintenance
                      ? 'bg-rose-50 text-rose-700 ring-rose-200/60'
                      : 'bg-stone-100 text-stone-500 ring-stone-200/60'
                  }`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-chocolate-900 leading-snug flex items-center gap-1.5 flex-wrap">
                      <span>{isRtl ? 'وضع الصيانة الشامل للتطبيق' : 'Full Maintenance Mode'}</span>
                      {formData.maintenance && (
                        <span className="inline-flex items-center h-5 px-1.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                          {isRtl ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      {formData.maintenance
                        ? (isRtl ? 'التطبيق مقفل وتظهر شاشة الصيانة لجميع العملاء' : 'App locked with maintenance screen')
                        : (isRtl ? 'التطبيق يعمل بكامل كفاءته دون أي شاشات صيانة' : 'App operating normally')}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-stone-400">
                        {isRtl ? 'حالة السيرفر:' : 'Server Status:'}
                      </span>
                      <span className={`${pillCls} ${
                        formData.maintenance
                          ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                      }`}>
                        {formData.maintenance ? (isRtl ? 'تحت الصيانة ⚠️' : 'In Maintenance ⚠️') : (isRtl ? 'يعمل بشكل طبيعي ⚡' : 'Normal Operation ⚡')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <ToggleSwitch
                    size="md"
                    checked={formData.maintenance}
                    onChange={(val) => handleChange('maintenance', val)}
                    ariaLabel={isRtl ? 'تبديل وضع الصيانة' : 'Toggle Maintenance Mode'}
                  />
                </div>
              </div>

              {/* Switch 3: iOS Payment Cycle (iosPaymentEnabled) - الآيفون بس، الأندرويد مش بيتأثر */}
              <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset transition-colors shrink-0 ${
                    formData.iosPaymentEnabled
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 ring-amber-200/60'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-chocolate-900 leading-snug flex items-center gap-1.5 flex-wrap">
                      <span>{isRtl ? 'الدفع داخل تطبيق الآيفون' : 'In-App Payment on iOS'}</span>
                      <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[11px] font-semibold bg-stone-100 text-chocolate-800 border border-stone-200/70">
                        <Apple className="w-3 h-3" /> iOS
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      {formData.iosPaymentEnabled
                        ? (isRtl ? 'عملاء الآيفون بيدفعوا بالتحويل ويرفعوا الإيصال بشكل طبيعي' : 'iOS users pay by transfer and upload the receipt as usual')
                        : (isRtl ? 'عملاء الآيفون بيأكدوا الطلب/الحجز من غير دفع، والمطعم بيتواصل معاهم' : 'iOS users place orders/bookings without paying; the restaurant contacts them')}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-stone-400">
                        {isRtl ? 'الأندرويد:' : 'Android:'}
                      </span>
                      <span className={`${pillCls} bg-emerald-50 text-emerald-700 border-emerald-200/70`}>
                        {isRtl ? 'الدفع شغال دايماً ولا يتأثر' : 'Always unchanged'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <ToggleSwitch
                    size="md"
                    checked={formData.iosPaymentEnabled}
                    onChange={(val) => handleChange('iosPaymentEnabled', val)}
                    ariaLabel={isRtl ? 'تبديل الدفع على الآيفون' : 'Toggle iOS payment'}
                  />
                </div>
              </div>
            </div>

            {!formData.iosPaymentEnabled && (
              <div className="px-5 sm:px-6 pb-5">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-start gap-2.5 text-amber-900 text-[13px] font-medium leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {isRtl
                      ? 'الدفع مقفول على الآيفون: الطلبات والحجوزات اللي جاية من الآيفون هتوصل من غير إيصال تحويل، لازم تتواصل مع العميل قبل التأكيد.'
                      : 'iOS payment is off: orders and bookings from iPhone arrive without a transfer receipt. Contact the customer before confirming.'}
                  </span>
                </div>
              </div>
            )}

            {/* Maintenance Alert Banner if Active */}
            {formData.maintenance && (
              <div className="px-5 sm:px-6 pb-5">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-start gap-2.5 text-amber-900 text-[13px] font-medium leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {isRtl
                      ? 'تنبيه: وضع الصيانة مفعل حالياً! عند فتح تطبيق كافيه 90 من أي هاتف لن يتمكن العملاء من التصفح أو الطلب، وستظهر شاشة الصيانة الدورية.'
                      : 'Notice: Maintenance mode is active. Mobile app users cannot browse or place orders until maintenance is turned off.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Platform Versions Section */}
          <div className={cardCls}>
            <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-stone-200/70">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-chocolate-900 leading-snug">
                  {isRtl ? 'إصدارات التطبيق المعتمدة' : 'Supported App Versions'}
                </h3>
                <p className="text-[13px] text-stone-500 mt-0.5 leading-relaxed">
                  {isRtl ? 'أقل إصدار مسموح به لكل منصة قبل إلزام العميل بالتحديث' : 'Minimum version per platform before users are asked to update'}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Android Platform */}
              <div className="rounded-xl border border-stone-200/70 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-chocolate-900 leading-snug">
                        {isRtl ? 'تطبيق الأندرويد' : 'Android App'}
                      </h3>
                      <p className="text-xs text-stone-500">Google Play Store</p>
                    </div>
                  </div>
                  <Badge variant="success">Android</Badge>
                </div>

                <div>
                  <label className={labelCls}>
                    {isRtl ? 'رقم الإصدار المعتمد *' : 'Supported Version Tag *'}
                  </label>
                  <input
                    type="text"
                    value={formData.androidVersion || ''}
                    onChange={(e) => handleChange('androidVersion', e.target.value)}
                    className={inputCls}
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {isRtl
                      ? 'يُستخدم لمطابقة نسخة تطبيق الأندرويد وإلزام العميل بالتحديث عند توفر إصدار جديد.'
                      : 'Used by the Android app to compare version and require updates.'}
                  </p>
                </div>
              </div>

              {/* Card 2: iOS Platform */}
              <div className="rounded-xl border border-stone-200/70 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 text-chocolate-800 ring-1 ring-inset ring-stone-200/60 flex items-center justify-center">
                      <Apple className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-chocolate-900 leading-snug">
                        {isRtl ? 'تطبيق الآيفون' : 'iOS App'}
                      </h3>
                      <p className="text-xs text-stone-500">Apple App Store</p>
                    </div>
                  </div>
                  <Badge variant="secondary">iOS / Apple</Badge>
                </div>

                <div>
                  <label className={labelCls}>
                    {isRtl ? 'رقم الإصدار المعتمد *' : 'Supported Version Tag *'}
                  </label>
                  <input
                    type="text"
                    value={formData.iosVersion || ''}
                    onChange={(e) => handleChange('iosVersion', e.target.value)}
                    className={inputCls}
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {isRtl
                      ? 'يُستخدم لمطابقة نسخة تطبيق الآيفون وإلزام العميل بالتحديث عند توفر إصدار جديد.'
                      : 'Used by the iOS app to compare version and require updates.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="sticky bottom-3 z-10 pb-2">
            <div className={`${cardCls} shadow-luxury px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-3 ${hasChanges ? 'border-amber-200' : ''}`}>
              <div className="flex items-center gap-2.5">
                <span className="relative flex w-2 h-2">
                  {hasChanges && <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-75 animate-ping" />}
                  <span className={`relative inline-flex w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </span>
                <span className="text-[13px] font-medium text-chocolate-800">
                  {hasChanges
                    ? (isRtl ? 'هناك تعديلات غير محفوظة' : 'Unsaved changes pending')
                    : (isRtl ? 'كافة الإعدادات متطابقة مع السيرفر' : 'All settings synchronized with server')}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={() => setFormData(initialData)}
                    className="h-10 px-4 text-sm font-semibold text-chocolate-800 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-2xs rounded-xl transition-colors cursor-pointer"
                  >
                    {isRtl ? 'تراجع' : 'Discard'}
                  </button>
                )}

                <Button
                  variant="gold"
                  size="md"
                  icon={Save}
                  loading={saving}
                  type="submit"
                  className="flex-1 sm:flex-none"
                >
                  {saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ إعدادات التطبيق' : 'Save App Settings')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AppVersionView;
