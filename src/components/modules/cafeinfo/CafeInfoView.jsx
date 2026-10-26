import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Save,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Star,
  ExternalLink,
  Camera,
  Coffee,
  Trash2,
  Plus,
  Check,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { optimizeImageForMobile } from '../../../utils/imageOptimizer';

const SectionHeader = ({ icon: Icon, title, subtitle, children }) => (
  <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap px-5 sm:px-6 py-4 border-b border-stone-200/70">
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold text-chocolate-900 leading-snug">{title}</h3>
        {subtitle && <p className="text-[13px] text-stone-500 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
    {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
  </div>
);

export const CafeInfoView = ({ onNavigate }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Main Form Data matching backend table schema
  const [formData, setFormData] = useState({
    nameAr: 'كافيه 90',
    nameEn: 'Cafe90',
    taglineAr: 'مقهى ومساحات اجتماعية ومكتبية',
    taglineEn: 'A cafe with social and workspace areas',
    descriptionAr: 'مكان مثالي للاسترخاء والعمل، نقدم قهوة مختصة وأجواء هادئة ومساحات مريحة للاجتماعات',
    descriptionEn: 'The perfect place to relax and work. We offer specialty coffee, a calm atmosphere, and comfortable meeting spaces.',
    addressAr: 'الرياض',
    addressEn: 'Riyadh',
    latitude: '24.7136000',
    longitude: '46.6753000',
    workingHoursAr: 'الأحد - الخميس: 8ص - 11م',
    workingHoursEn: 'Sun - Thu: 8 AM - 11 PM',
    contactPhone: '01500973739',
    coverImageUrl: '',
    rating: 4.8,
    reviewCount: 5
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]); // [{ id, imageUrl, order }]

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCafeInfo();
      const cafe = res?.cafe || res?.data?.cafe || res;
      const rawPhotos = Array.isArray(res?.photos) 
        ? res.photos 
        : (Array.isArray(res?.data?.photos) ? res.data.photos : []);

      if (cafe) {
        setFormData({
          nameAr: cafe.name_ar || cafe.name || '',
          nameEn: cafe.name_en || cafe.name || '',
          taglineAr: cafe.tagline_ar || cafe.tagline || '',
          taglineEn: cafe.tagline_en || cafe.tagline || '',
          descriptionAr: cafe.description_ar || cafe.description || '',
          descriptionEn: cafe.description_en || '',
          addressAr: cafe.address_ar || cafe.address || '',
          addressEn: cafe.address_en || '',
          latitude: String(cafe.latitude || '24.7136000'),
          longitude: String(cafe.longitude || '46.6753000'),
          workingHoursAr: cafe.working_hours_ar || cafe.working_hours || '',
          workingHoursEn: cafe.working_hours_en || '',
          contactPhone: cafe.contact_phone || cafe.phone || '',
          coverImageUrl: cafe.cover_image_url || (cafe.cover_image ? (cafe.cover_image.startsWith('http') ? cafe.cover_image : `https://backend.ninety90degree.com/public/storage/${cafe.cover_image.replace(/^\//, '')}`) : ''),
          rating: Number(cafe.rating || 4.8),
          reviewCount: Number(cafe.review_count || 0)
        });
      }

      setGalleryPhotos(
        rawPhotos.map((p) => ({
          id: p.id,
          imageUrl: p.image_url || (p.image ? (p.image.startsWith('http') ? p.image : `https://backend.ninety90degree.com/public/storage/${p.image.replace(/^\//, '')}`) : ''),
          order: Number(p.order || 1),
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }))
      );
    } catch (e) {
      console.warn('Cafe info load notice:', e);
      toast.error(isRtl ? 'فشل تحميل بيانات الكافيه من السيرفر' : 'Failed to load cafe details from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cover image change handler with mobile 2:1 optimization
  const handleCoverImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageForMobile(file, 'banner');
      setCoverImageFile(optimized.file);
      setFormData((prev) => ({ ...prev, coverImageUrl: optimized.previewUrl }));
      toast.success(isRtl ? 'تم ضبط وتنسيق صورة الغلاف تلقائياً للموبايل (2:1 فائقة الوضوح) ✨' : 'Cover image optimized for mobile displays (2:1) ✨');
    } catch {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({ ...prev, coverImageUrl: event.target.result }));
          toast.success(isRtl ? 'تم تجهيز صورة الغلاف للحفظ' : 'Cover image selected');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Cafe Info (POST /admin/cafe?_method=PUT)
  const handleSave = async (e) => {
    e?.preventDefault?.();
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name_ar', formData.nameAr || formData.nameEn);
      fd.append('name_en', formData.nameEn || formData.nameAr);
      fd.append('name', formData.nameAr || formData.nameEn);
      if (formData.taglineAr) fd.append('tagline_ar', formData.taglineAr);
      if (formData.taglineEn) fd.append('tagline_en', formData.taglineEn);
      if (formData.descriptionAr) fd.append('description_ar', formData.descriptionAr);
      if (formData.descriptionEn) fd.append('description_en', formData.descriptionEn);
      if (formData.addressAr) fd.append('address_ar', formData.addressAr);
      if (formData.addressEn) fd.append('address_en', formData.addressEn);
      if (formData.latitude) fd.append('latitude', formData.latitude);
      if (formData.longitude) fd.append('longitude', formData.longitude);
      if (formData.workingHoursAr) fd.append('working_hours_ar', formData.workingHoursAr);
      if (formData.workingHoursEn) fd.append('working_hours_en', formData.workingHoursEn);
      if (formData.contactPhone) fd.append('contact_phone', formData.contactPhone);

      if (coverImageFile instanceof File) {
        fd.append('cover_image', coverImageFile);
      }

      const res = await api.updateCafeInfo(fd);
      toast.success(res?.message || (isRtl ? 'تم تحديث بيانات الكافيه بنجاح' : 'Cafe info updated successfully'));
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تحديث بيانات الكافيه' : 'Failed to update cafe info'));
    } finally {
      setSaving(false);
    }
  };

  // Upload Gallery Photos with batch mobile optimization
  const handleUploadGalleryFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingGallery(true);
      const optimizedFiles = await Promise.all(
        files.map(async (f) => {
          try {
            const opt = await optimizeImageForMobile(f, 'category');
            return opt.file;
          } catch {
            return f;
          }
        })
      );

      const fd = new FormData();
      optimizedFiles.forEach((file) => {
        fd.append('images[]', file);
      });

      const res = await api.uploadGalleryPhotos(fd);
      toast.success(
        isRtl
          ? `تم تحسين ورفع ${optimizedFiles.length} صورة للمعرض متوافقة مع الموبايل بنجاح ✨`
          : `Optimized & uploaded ${optimizedFiles.length} gallery photos for mobile ✨`
      );
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل رفع صور المعرض' : 'Failed to upload gallery photos'));
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Update Gallery Photo Order (PUT /cafe/gallery/:id)
  const handleUpdatePhotoOrder = async (photoId, newOrder) => {
    try {
      const fd = new FormData();
      fd.append('order', String(newOrder));
      const res = await api.updateGalleryPhoto(photoId, fd);
      toast.success(res?.message || (isRtl ? 'تم تحديث ترتيب الصورة' : 'Photo order updated'));
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تحديث الصورة' : 'Failed to update photo'));
    }
  };

  // Delete Gallery Photo (DELETE /cafe/gallery/:id)
  const handleDeletePhoto = async (photoId) => {
    try {
      const res = await api.deleteGalleryPhoto(photoId);
      toast.success(res?.message || (isRtl ? 'تم حذف الصورة بنجاح' : 'Photo deleted successfully'));
      setGalleryPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حذف الصورة' : 'Failed to delete photo'));
    }
  };

  // Shared visual tokens (presentation only)
  const cardCls = 'bg-white rounded-2xl border border-stone-200/70 shadow-card';
  const labelCls = 'block text-[13px] font-semibold text-chocolate-800 mb-1.5';
  const inputCls = 'w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition';
  const textareaCls = 'w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 leading-relaxed shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition resize-none';

  if (loading) {
    return (
      <div className={`${cardCls} p-12 flex flex-col items-center justify-center gap-3 h-96`}>
        <div className="w-11 h-11 rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-200/60 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-[13px] text-stone-500 font-medium">{isRtl ? 'جاري جلب أحدث بيانات الكافيه من السيرفر...' : 'Fetching cafe details from server...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in w-full">
      {/* Full Width Form */}
      <form onSubmit={handleSave} className="w-full space-y-5">
          {/* 1. Cover Image & Ratings Card */}
          <div className={`${cardCls} overflow-hidden`}>
            <div className="p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-chocolate-900 leading-snug">
                    {isRtl ? 'صورة الغلاف الرسمية للكافيه' : 'Hero Cover Image & Live Rating'}
                  </h3>
                  <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
                    {isRtl ? 'هوية الكافيه كما تظهر للعملاء في تطبيق الموبايل' : 'How your cafe appears to guests in the mobile app'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/70 text-[13px] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="tabular-nums">{formData.rating}</span>
                  <span className="text-xs text-amber-700/80 font-medium tabular-nums">({formData.reviewCount} {isRtl ? 'تقييمات' : 'reviews'})</span>
                </span>

                <Button
                  variant="gold"
                  size="md"
                  icon={Save}
                  loading={saving}
                  onClick={handleSave}
                >
                  {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                </Button>
              </div>
            </div>

            {/* Cover Image Upload & Preview */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2.5">
              <div className={`relative aspect-[16/10] sm:aspect-[2/1] max-h-72 w-full rounded-xl overflow-hidden bg-stone-50 group ${
                formData.coverImageUrl ? 'border border-stone-200/70' : 'border-2 border-dashed border-stone-200'
              }`}>
                {formData.coverImageUrl ? (
                  <img
                    src={formData.coverImageUrl}
                    alt="Cafe Cover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 pb-10">
                    <div className="w-11 h-11 rounded-xl bg-white text-stone-400 ring-1 ring-inset ring-stone-200 shadow-2xs flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-chocolate-900">{isRtl ? 'لا توجد صورة غلاف مرفوعة' : 'No cover image uploaded'}</span>
                    <span className="text-xs text-stone-500 tabular-nums">2:1 · JPG / PNG</span>
                  </div>
                )}

                {/* Upload Action Overlay */}
                <div className={`absolute inset-x-0 bottom-0 p-3 flex items-end justify-end ${
                  formData.coverImageUrl ? 'bg-gradient-to-t from-black/45 via-black/10 to-transparent pt-12' : ''
                }`}>
                  <label
                    htmlFor="cover-image-upload-input"
                    className="inline-flex items-center gap-2 h-9 px-3.5 bg-white text-chocolate-900 font-semibold text-[13px] rounded-lg border border-stone-200 shadow-xs cursor-pointer hover:bg-stone-50 hover:border-stone-300 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-gold-600" />
                    <span>{isRtl ? 'تغيير صورة الغلاف' : 'Upload New Cover'}</span>
                  </label>
                </div>
              </div>

              <input
                id="cover-image-upload-input"
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-stone-500">
                <span>{isRtl ? 'انقر على الصورة لتغييرها من جهازك' : 'Click image to upload new cover from device'}</span>
                {coverImageFile && (
                  <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 max-w-full truncate">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{coverImageFile.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Brand Identity & Bilingual Descriptions */}
          <div className={cardCls}>
            <SectionHeader
              icon={Sparkles}
              title={isRtl ? 'الهوية والشعار والوصف المزدوج (عربي وإنجليزي)' : 'Brand Identity & Dual Language Description'}
              subtitle={isRtl ? 'الاسم والشعار والنبذة كما تظهر في التطبيق باللغتين' : 'Name, tagline and description shown in both app languages'}
            />

            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              {/* Names */}
              <div>
                <label className={labelCls}>
                  {isRtl ? 'اسم الكافيه (بالعربية) *' : 'Cafe Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className={`${inputCls} font-semibold`}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>
                  {isRtl ? 'اسم الكافيه (بالإنجليزية) *' : 'Cafe Name (English) *'}
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className={`${inputCls} font-semibold`}
                  required
                />
              </div>

              {/* Taglines */}
              <div>
                <label className={labelCls}>
                  {isRtl ? 'الشعار التسويقي (بالعربية) *' : 'Tagline (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={formData.taglineAr}
                  onChange={(e) => setFormData({ ...formData, taglineAr: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>
                  {isRtl ? 'الشعار التسويقي (بالإنجليزية) *' : 'Tagline (English) *'}
                </label>
                <input
                  type="text"
                  value={formData.taglineEn}
                  onChange={(e) => setFormData({ ...formData, taglineEn: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              {/* Descriptions */}
              <div>
                <label className={labelCls}>
                  {isRtl ? 'نبذة ووصف الكافيه (بالعربية) *' : 'Description (Arabic) *'}
                </label>
                <textarea
                  rows={4}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className={textareaCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>
                  {isRtl ? 'نبذة ووصف الكافيه (بالإنجليزية) *' : 'Description (English) *'}
                </label>
                <textarea
                  rows={4}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  className={textareaCls}
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Location, Working Hours & Phone */}
          <div className={cardCls}>
            <SectionHeader
              icon={MapPin}
              title={isRtl ? 'الموقع ومواعيد العمل ورقم التواصل' : 'Location, Working Hours & Phone'}
              subtitle={isRtl ? 'بيانات الوصول والتواصل التي يراها العملاء' : 'Where guests find you, when you are open, and how to reach you'}
            />

            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              {/* Addresses */}
              <div>
                <label className={labelCls}>
                  {isRtl ? 'العنوان الجغرافي (بالعربية) *' : 'Physical Address (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={formData.addressAr}
                  onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>
                  {isRtl ? 'العنوان الجغرافي (بالإنجليزية) *' : 'Physical Address (English) *'}
                </label>
                <input
                  type="text"
                  value={formData.addressEn}
                  onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              {/* Working Hours */}
              <div>
                <label className={labelCls}>
                  {isRtl ? 'مواعيد العمل (بالعربية) *' : 'Working Hours (Arabic) *'}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.workingHoursAr}
                    onChange={(e) => setFormData({ ...formData, workingHoursAr: e.target.value })}
                    className={`${inputCls} ps-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  {isRtl ? 'مواعيد العمل (بالإنجليزية) *' : 'Working Hours (English) *'}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.workingHoursEn}
                    onChange={(e) => setFormData({ ...formData, workingHoursEn: e.target.value })}
                    className={`${inputCls} ps-10`}
                    required
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                <label className={labelCls}>
                  {isRtl ? 'رقم هاتف التواصل الموحد *' : 'Contact Phone *'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className={`${inputCls} ps-10 font-semibold tabular-nums`}
                    required
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1.5">
                  {isRtl ? 'يظهر كزر اتصال مباشر داخل التطبيق' : 'Shown as a tap-to-call button in the app'}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Live Photo Gallery Section */}
          <div className={cardCls}>
            <SectionHeader
              icon={Camera}
              title={isRtl ? 'معرض صور الكافيه الحي' : 'Live Photo Gallery'}
              subtitle={isRtl ? 'تُرفع الصور مباشرة وتظهر فوراً في التطبيق' : 'Photos upload instantly and appear live in the app'}
            >
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
                {galleryPhotos.length} {isRtl ? 'صور' : 'Photos'}
              </span>

              <button
                type="button"
                disabled={uploadingGallery}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 rounded-lg text-[13px] font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingGallery ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gold-600" />
                ) : (
                  <Plus className="w-4 h-4 text-gold-600" />
                )}
                <span>{uploadingGallery ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'رفع صور للمعرض' : 'Upload Photos')}</span>
              </button>
            </SectionHeader>

            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleUploadGalleryFiles}
              className="hidden"
            />

            <div className="p-5 sm:p-6">
            {/* Gallery Photos Grid */}
            {galleryPhotos.length === 0 ? (
              <div className="py-10 px-6 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/60 text-center flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-chocolate-900">
                  {isRtl ? 'لا توجد صور مضافة في معرض الكافيه حالياً.' : 'No gallery photos uploaded yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="mt-1 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-gold-600" />
                  <span>{isRtl ? 'رفع أول صورة الآن' : 'Upload first photo now'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {galleryPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl overflow-hidden border border-stone-200/70 bg-stone-100 h-36 flex flex-col justify-between shadow-2xs hover:shadow-luxury hover:border-stone-300/70 transition-all"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={`Gallery ${photo.id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 pointer-events-none">
                      <span className="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium tabular-nums bg-black/45 backdrop-blur text-white ring-1 ring-white/15">
                        #{photo.id}
                      </span>
                      <span className="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium tabular-nums bg-black/45 backdrop-blur text-white ring-1 ring-white/15">
                        {isRtl ? `ترتيب: ${photo.order}` : `Order: ${photo.order}`}
                      </span>
                    </div>

                    {/* Bottom Actions Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdatePhotoOrder(photo.id, Math.max(1, photo.order - 1))}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-white/95 text-chocolate-900 hover:bg-gold-400 transition-colors cursor-pointer"
                          title={isRtl ? 'تقديم الترتيب' : 'Move up'}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePhotoOrder(photo.id, photo.order + 1)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-white/95 text-chocolate-900 hover:bg-gold-400 transition-colors cursor-pointer"
                          title={isRtl ? 'تأخير الترتيب' : 'Move down'}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                        title={isRtl ? 'حذف الصورة من المعرض' : 'Delete Photo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="sticky bottom-3 z-10 pb-2">
            <div className={`${cardCls} shadow-luxury px-4 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
                  <Coffee className="w-4 h-4" />
                </div>
                <p className="text-[13px] text-stone-500 leading-snug">
                  {isRtl ? 'تُطبّق التعديلات على تطبيق الموبايل فور الحفظ' : 'Changes go live in the mobile app as soon as you save'}
                </p>
              </div>
              <Button
                variant="gold"
                size="md"
                icon={Save}
                loading={saving}
                type="submit"
                className="w-full sm:w-auto px-6"
              >
                {saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
};
