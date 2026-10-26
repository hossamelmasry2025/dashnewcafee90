import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  Sparkles, 
  RefreshCw,
  Maximize2,
  Smartphone,
  Check
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * High-Resolution Responsive Banner Presets (2:1 / 16:9 Mobile App Format)
 * Crafted specifically for Cafe 90 mobile applications (Android & iOS).
 * Hero drinks positioned on the left, clear negative space on the right for clean RTL text overlay.
 */
export const PRESET_BANNERS = [
  {
    id: 'cafe90_experience_latte',
    slider: 'slider1',
    titleAr: 'تجربة كافيه 90 (كوب لاتيه فخار نقي مع طاولة خشبية دافئة)',
    titleEn: 'Cafe 90 Experience (Artisan Latte Cup on Wood Table)',
    descAr: 'تصميم متصل عالي الدقة بدون أي حواف أو مسافات رمادية (100% Full-Bleed)، الكوب على اليسار ومساحة بيج ناصعة ومتصلة على اليمين مخصصة للنصوص البنية وزر "تعرّف علينا أكثر".',
    imageUrl: '/banner_cafe90_experience.jpg'
  },
  {
    id: 'happiness_iced_1',
    slider: 'slider2',
    titleAr: 'مشروبين مثلجين فاخرين (سبانيش لاتيه & كولد برو)',
    titleEn: 'Two Luxury Iced Drinks (Spanish Latte & Cold Brew)',
    descAr: 'تصميم عالي الدقة (2:1) متوافق 100% مع أندرويد وآبل ستور، المشروبات على اليسار والنصوص على اليمين بنقاء فائق.',
    imageUrl: '/banner_offer_happiness.jpg'
  },
  {
    id: 'happiness_iced_2',
    slider: 'slider2',
    titleAr: 'كوبين آيس لاتيه بالكريمة والماكياتو المنعش',
    titleEn: 'Two Iced Lattes with Cold Foam & Caramel',
    descAr: 'تصميم صيفي متجاوب (2:1) مع كاسات أنيقة وتوزيع ذكي للمساحات يمنع قص الكوب أو تداخل النصوص.',
    imageUrl: '/banner_offer_happiness_v2.jpg'
  },
  {
    id: 'solvex_rooms_bundle',
    slider: 'slider3',
    titleAr: 'باقة غرف وقاعات سولفكس VIP الكاملة (3 صور احترافية معاً)',
    titleEn: 'Solvex VIP Rooms & Lounges Full 3-Photo Bundle',
    descAr: 'باقة متكاملة فائقة الفخامة تضم 3 صور استوديو بدقة 8K: 1- صالون VIP بكراسي جلد، 2- قاعة اجتماعات تنفيذية بشاشة عروض، 3- ركن عمل هادئ. تظهر متتابعة في التطبيق بدون أي حواف سوداء.',
    imageUrl: '/banner_room_solvex_lounge.jpg',
    images: [
      '/banner_room_solvex_lounge.jpg',
      '/banner_room_solvex_meeting.jpg',
      '/banner_room_solvex_pod.jpg'
    ]
  },
  {
    id: 'solvex_lounge_single',
    slider: 'slider3',
    titleAr: 'صالون كافيه 90 VIP سولفكس (كنب مريح وكراسي جلد فاخرة)',
    titleEn: 'Cafe 90 VIP Lounge Solvex (Plush Sofa & Leather Armchairs)',
    descAr: 'تصميم فندقي دافئ بمقاس متجاوب بدون أي حواف سوداء، يظهر جلسة الاستراحة المريحة مع طاولة القهوة والإضاءة الدافئة.',
    imageUrl: '/banner_room_solvex_lounge.jpg'
  },
  {
    id: 'solvex_meeting_single',
    slider: 'slider3',
    titleAr: 'قاعة اجتماعات كافيه 90 التنفيذية سولفكس (طاولة جوز وشاشة ذكية)',
    titleEn: 'Cafe 90 Executive Boardroom Solvex (Walnut Table & Smart Display)',
    descAr: 'تصميم قاعة اجتماعات ومؤتمرات راقية مع طاولة خشب جوز وكراسي هيدروليك جلدية وشاشة عروض 4K.',
    imageUrl: '/banner_room_solvex_meeting.jpg'
  },
  {
    id: 'solvex_pod_single',
    slider: 'slider3',
    titleAr: 'ركن العمل والاجتماعات الهادئة سولفكس (جلسة مخملية وقهوة مختصة)',
    titleEn: 'Solvex Quiet Work & Meeting Pod (Velvet Booth & Specialty Coffee)',
    descAr: 'جلسة كورنر هادئة بإضاءة ليد دافئة ولمسات خشبية عازلة للصوت مخصصة للعمل والاجتماعات المصغرة.',
    imageUrl: '/banner_room_solvex_pod.jpg'
  }
];

export const BannerManager = () => {
  const toast = useToast();
  const { isRtl } = useLanguage();
  const fileInputRef = useRef(null);
  const quickFileInputRef = useRef(null);

  // Active slider tab: 'slider1' | 'slider2' | 'slider3'
  const [activeSlider, setActiveSlider] = useState('slider1');
  const [banners, setBanners] = useState([]);
  const [sliderCounts, setSliderCounts] = useState({ slider1: 0, slider2: 0, slider3: 0 });
  const [loading, setLoading] = useState(true);

  // Active image slide per banner card (for multi-image banners): { [bannerId]: currentImageIndex }
  const [activeImageIndexes, setActiveImageIndexes] = useState({});

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deletingBanner, setDeletingBanner] = useState(null);
  const [deletingImageTarget, setDeletingImageTarget] = useState(null); // { bannerId, imageId }
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Images Modal
  const [quickUploadBanner, setQuickUploadBanner] = useState(null);
  const [quickFiles, setQuickFiles] = useState([]);
  const [quickPreviews, setQuickPreviews] = useState([]);

  // Fullscreen Lightbox image
  const [lightboxImage, setLightboxImage] = useState(null);

  // Mobile App Simulator state (Android & iOS Responsive Tester)
  const [mobileSimBanner, setMobileSimBanner] = useState(null);
  const [mobileSimPlatform, setMobileSimPlatform] = useState('android'); // 'android' | 'ios'
  const [mobileSimWidth, setMobileSimWidth] = useState(380); // 360 | 393 | 430
  const [simRoomImgIndex, setSimRoomImgIndex] = useState(0);

  // View Banner Details Modal (Live GET /banners/:id)
  const [viewingBanner, setViewingBanner] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add/Edit Form state
  const [formData, setFormData] = useState({
    headerAr: '',
    headerEn: '',
    descriptionAr: '',
    descriptionEn: ''
  });

  // Selected files for new upload in Add/Edit modal
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  // Processing indicator when optimizing images in background
  const [optimizingImages, setOptimizingImages] = useState(false);

  // Normalizer: Handles both single image and images[] gallery from API response
  const normalizeBanner = (b) => {
    const imagesList = Array.isArray(b.images) ? b.images.map((img) => {
      const url = img.image_url || (img.image ? (img.image.startsWith('http') ? img.image : `https://backend.ninety90degree.com/public/storage/${img.image}`) : null);
      return {
        id: img.id,
        bannerableId: img.bannerable_id || b.id,
        sortOrder: img.sort_order || 1,
        image: img.image,
        imageUrl: url,
        createdAt: img.created_at || null,
        updatedAt: img.updated_at || null
      };
    }) : [];

    // Primary image URL resolution
    let primaryUrl = b.image_url;
    if (!primaryUrl && imagesList.length > 0) {
      primaryUrl = imagesList[0].imageUrl;
    }
    if (!primaryUrl && b.image) {
      primaryUrl = b.image.startsWith('http') ? b.image : `https://backend.ninety90degree.com/public/storage/${b.image}`;
    }

    // If single image exists but imagesList is empty (like in banner2), populate imagesList for unified card display
    if (imagesList.length === 0 && primaryUrl) {
      imagesList.push({
        id: b.id,
        bannerableId: b.id,
        sortOrder: 1,
        image: b.image,
        imageUrl: primaryUrl,
        createdAt: b.created_at || null,
        updatedAt: b.updated_at || null
      });
    }

    return {
      id: b.id,
      headerAr: b.header_ar || b.header || '',
      headerEn: b.header_en || (b.header_ar ? '' : b.header) || '',
      header: b.header || b.header_ar || b.header_en || '',
      descriptionAr: b.description_ar || b.description || '',
      descriptionEn: b.description_en || (b.description_ar ? '' : b.description) || '',
      description: b.description || b.description_ar || b.description_en || '',
      imageUrl: primaryUrl || null,
      images: imagesList,
      createdAt: b.created_at || null,
      updatedAt: b.updated_at || null,
      raw: b
    };
  };

  // Load banners for active slider & count badges for all sliders
  const loadBanners = async () => {
    try {
      setLoading(true);
      let data = [];
      if (activeSlider === 'slider1') {
        data = await api.getBanners();
      } else if (activeSlider === 'slider2') {
        data = await api.getBanner2s();
      } else {
        data = await api.getBanner3s();
      }
      const raw = Array.isArray(data)
        ? data
        : (Array.isArray(data?.banners)
            ? data.banners
            : (Array.isArray(data?.banner2s)
                ? data.banner2s
                : (Array.isArray(data?.banner3s)
                    ? data.banner3s
                    : (data?.data || []))));
      const normalized = raw.map(normalizeBanner);
      setBanners(normalized);

      // Update current slider count
      setSliderCounts((prev) => ({
        ...prev,
        [activeSlider]: normalized.length
      }));
    } catch (e) {
      console.error('Error loading banners:', e);
      toast.error(isRtl ? 'فشل تحميل بانرات التطبيق من السيرفر' : 'Failed to load app banners from server');
    } finally {
      setLoading(false);
    }
  };

  // Pre-load counts for all 3 sliders in background
  const loadAllCounts = async () => {
    try {
      const [res1, res2, res3] = await Promise.allSettled([
        api.getBanners(),
        api.getBanner2s(),
        api.getBanner3s()
      ]);
      const getCount = (res, key) => {
        if (res.status !== 'fulfilled') return 0;
        const val = res.value;
        if (Array.isArray(val)) return val.length;
        if (Array.isArray(val?.[key])) return val[key].length;
        if (Array.isArray(val?.banners)) return val.banners.length;
        if (Array.isArray(val?.banner2s)) return val.banner2s.length;
        if (Array.isArray(val?.banner3s)) return val.banner3s.length;
        return 0;
      };
      const count1 = getCount(res1, 'banners');
      const count2 = getCount(res2, 'banner2s');
      const count3 = getCount(res3, 'banner3s');
      setSliderCounts({
        slider1: count1,
        slider2: count2,
        slider3: count3
      });
    } catch {}
  };

  useEffect(() => {
    loadBanners();
  }, [activeSlider]);

  useEffect(() => {
    loadAllCounts();
  }, []);

  // Format Date & Time
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Switch image slide on card
  const handlePrevImage = (bannerId, imagesCount, e) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[bannerId] || 0;
      const next = current <= 0 ? imagesCount - 1 : current - 1;
      return { ...prev, [bannerId]: next };
    });
  };

  const handleNextImage = (bannerId, imagesCount, e) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[bannerId] || 0;
      const next = current >= imagesCount - 1 ? 0 : current + 1;
      return { ...prev, [bannerId]: next };
    });
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBanner(null);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setFormData({
      headerAr: '',
      headerEn: '',
      descriptionAr: '',
      descriptionEn: ''
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (banner) => {
    setEditingBanner(banner);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setFormData({
      headerAr: banner.headerAr || '',
      headerEn: banner.headerEn || '',
      descriptionAr: banner.descriptionAr || '',
      descriptionEn: banner.descriptionEn || ''
    });
    setIsAddEditModalOpen(true);

    // Fetch fresh single banner by ID to get latest image list
    try {
      let fresh;
      if (activeSlider === 'slider1') fresh = await api.getBannerById(banner.id);
      else if (activeSlider === 'slider2') fresh = await api.getBanner2ById(banner.id);
      else fresh = await api.getBanner3ById(banner.id);

      if (fresh) {
        const rawItem = fresh.banner || fresh.banner2 || fresh.banner3 || fresh.data?.banner || fresh.data?.banner2 || fresh.data?.banner3 || fresh.data || fresh;
        const norm = normalizeBanner(rawItem);
        setEditingBanner(norm);
        setFormData({
          headerAr: norm.headerAr || '',
          headerEn: norm.headerEn || '',
          descriptionAr: norm.descriptionAr || '',
          descriptionEn: norm.descriptionEn || ''
        });
      }
    } catch (err) {
      if (err?.status === 404 || (err?.message && err.message.includes('غير موجود'))) {
        toast.error(isRtl ? 'البانر غير موجود' : 'Banner not found');
      }
    }
  };

  // View Banner Details via live GET /banners/:id
  const handleViewBannerDetails = async (banner) => {
    setViewingBanner(banner);
    setLoadingDetails(true);
    try {
      let fresh;
      if (activeSlider === 'slider1') fresh = await api.getBannerById(banner.id);
      else if (activeSlider === 'slider2') fresh = await api.getBanner2ById(banner.id);
      else fresh = await api.getBanner3ById(banner.id);

      if (fresh) {
        const rawItem = fresh.banner || fresh.banner2 || fresh.banner3 || fresh.data?.banner || fresh.data?.banner2 || fresh.data?.banner3 || fresh.data || fresh;
        setViewingBanner(normalizeBanner(rawItem));
      }
    } catch (err) {
      if (err?.status === 404 || (err?.message && err.message.includes('غير موجود'))) {
        toast.error(isRtl ? 'البانر غير موجود في السيرفر' : 'Banner not found on server');
      } else {
        toast.error(err?.message || (isRtl ? 'فشل جلب تفاصيل البانر' : 'Failed to fetch banner details'));
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  /**
   * Professional Full-Bleed Mobile Banner Processor
   * Ensures the image fills the mobile banner container 100% (Edge-to-Edge)
   * with natural colors, zero dark borders, zero inner frames, and zero letterboxing,
   * matching the responsive mobile app card design perfectly (like Image 2).
   */
  const autoProcessBannerImage = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve({ file, previewUrl: URL.createObjectURL(file) });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        const img = new Image();
        img.onload = () => {
          try {
            // Standard responsive mobile banner canvas (2:1 ratio: 1280 x 640)
            const targetW = 1280;
            const targetH = 640;

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            const srcW = img.naturalWidth || img.width || targetW;
            const srcH = img.naturalHeight || img.height || targetH;

            // Pure Full-Bleed Cover (Edge to Edge) - Fills 100% of the banner
            const scale = Math.max(targetW / srcW, targetH / srcH);
            const drawW = srcW * scale;
            const drawH = srcH * scale;

            // Horizontal centering
            const drawX = (targetW - drawW) / 2;

            // Top-bias vertical positioning:
            // Keeps the top portion (cup lids, subject head, products) 100% visible and uncropped,
            // while stretching the photo seamlessly across the entire banner frame.
            let drawY = 0;
            if (drawH > targetH) {
              drawY = Math.min(0, (targetH - drawH) * 0.25);
            }

            // Draw pure original photo directly with natural colors (NO dark backgrounds, NO inner boxes, NO dark gradients)
            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            canvas.toBlob((blob) => {
              if (blob) {
                const optimizedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  { type: 'image/jpeg' }
                );
                const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
                resolve({ file: optimizedFile, previewUrl });
              } else {
                resolve({ file, previewUrl: dataUrl });
              }
            }, 'image/jpeg', 0.92);
          } catch {
            resolve({ file, previewUrl: dataUrl });
          }
        };
        img.onerror = () => resolve({ file, previewUrl: dataUrl });
        img.src = dataUrl;
      };
      reader.onerror = () => resolve({ file, previewUrl: '' });
      reader.readAsDataURL(file);
    });
  };

  // Handle selecting files in Add/Edit modal (Automatically optimizes to 16:9)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setOptimizingImages(true);
      const processed = await Promise.all(files.map(autoProcessBannerImage));
      setNewImageFiles((prev) => [...prev, ...processed.map((p) => p.file)]);
      setNewImagePreviews((prev) => [...prev, ...processed.map((p) => ({ file: p.file, url: p.previewUrl }))]);

      toast.success(
        isRtl
          ? `تم تجهيز وتنسيق ${files.length} صورة تلقائياً لتطبيق الموبايل بنجاح ✨`
          : `Automatically optimized ${files.length} image(s) for mobile app ✨`
      );
    } catch {
      setNewImageFiles((prev) => [...prev, ...files]);
    } finally {
      setOptimizingImages(false);
    }
  };

  const removeSelectedFile = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Add / Edit Banner
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.headerAr && !formData.headerEn) {
      toast.warning(isRtl ? 'يرجى إدخال عنوان البانر (بالعربية أو الإنجليزية)' : 'Please enter banner headline in Arabic or English');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();

      // Text fields
      fd.append('header_ar', formData.headerAr || formData.headerEn);
      fd.append('header_en', formData.headerEn || formData.headerAr);
      fd.append('header', formData.headerAr || formData.headerEn);

      fd.append('description_ar', formData.descriptionAr || formData.descriptionEn);
      fd.append('description_en', formData.descriptionEn || formData.descriptionAr);
      fd.append('description', formData.descriptionAr || formData.descriptionEn);

      // Attach new files based on active slider:
      // Slider 1 & 3: use images[] array (multiple images gallery)
      // Slider 2: uses image (single file)
      if (newImageFiles.length > 0) {
        if (activeSlider === 'slider2') {
          fd.append('image', newImageFiles[0]);
        } else {
          newImageFiles.forEach((file) => {
            fd.append('images[]', file);
          });
        }
      }

      let res;
      if (editingBanner) {
        if (activeSlider === 'slider1') res = await api.updateBanner(editingBanner.id, fd);
        else if (activeSlider === 'slider2') res = await api.updateBanner2(editingBanner.id, fd);
        else res = await api.updateBanner3(editingBanner.id, fd);

        toast.success(res?.message || (isRtl ? 'تم تحديث البانر بنجاح' : 'Banner updated successfully'));
      } else {
        if (activeSlider === 'slider1') res = await api.createBanner(fd);
        else if (activeSlider === 'slider2') res = await api.createBanner2(fd);
        else res = await api.createBanner3(fd);

        toast.success(res?.message || (isRtl ? 'تم إنشاء البانر بنجاح' : 'Banner created successfully'));
      }

      setIsAddEditModalOpen(false);
      loadBanners();
      loadAllCounts();
    } catch (err) {
      console.error('Save banner error:', err);
      if (err?.status === 404 || (err?.message && err.message.includes('غير موجود'))) {
        toast.error(isRtl ? 'البانر غير موجود' : 'Banner not found');
      } else {
        toast.error(err?.message || (isRtl ? 'فشل حفظ البانر' : 'Failed to save banner'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Banner Confirmation
  const handleDeleteBannerConfirm = async () => {
    if (!deletingBanner) return;
    try {
      setSubmitting(true);
      let res;
      if (activeSlider === 'slider1') res = await api.deleteBanner(deletingBanner.id);
      else if (activeSlider === 'slider2') res = await api.deleteBanner2(deletingBanner.id);
      else res = await api.deleteBanner3(deletingBanner.id);

      toast.success(res?.message || (isRtl ? 'تم حذف البانر بنجاح' : 'Banner deleted successfully'));
      setDeletingBanner(null);
      loadBanners();
      loadAllCounts();
    } catch (err) {
      if (err?.status === 404 || (err?.message && err.message.includes('غير موجود'))) {
        toast.error(isRtl ? 'البانر غير موجود' : 'Banner not found');
      } else {
        toast.error(err?.message || (isRtl ? 'فشل حذف البانر' : 'Failed to delete banner'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Single Image from Banner
  const handleDeleteImage = async (bannerId, imageId) => {
    try {
      setSubmitting(true);
      let res;
      if (activeSlider === 'slider1') res = await api.deleteBannerImage(bannerId, imageId);
      else if (activeSlider === 'slider2') res = await api.deleteBanner2Image(bannerId, imageId);
      else res = await api.deleteBanner3Image(bannerId, imageId);

      toast.success(res?.message || (isRtl ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully'));

      // Update currently editing banner state if modal is open
      if (editingBanner && editingBanner.id === bannerId) {
        setEditingBanner((prev) => ({
          ...prev,
          images: prev.images.filter((img) => img.id !== imageId),
          imageUrl: prev.images.filter((img) => img.id !== imageId)[0]?.imageUrl || null
        }));
      }

      setDeletingImageTarget(null);
      loadBanners();
    } catch (err) {
      if (err?.status === 404 || (err?.message && (err.message.includes('غير موجود') || err.message.includes('غير موجودة')))) {
        toast.error(isRtl ? 'الصورة غير موجودة أو تم حذفها' : 'Image not found or already deleted');
      } else {
        toast.error(err?.message || (isRtl ? 'فشل حذف صورة البانر' : 'Failed to delete banner image'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open Quick Upload Modal for banner
  const handleOpenQuickUpload = (banner) => {
    setQuickUploadBanner(banner);
    setQuickFiles([]);
    setQuickPreviews([]);
  };

  const handleQuickFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setOptimizingImages(true);
      const processed = await Promise.all(files.map(autoProcessBannerImage));
      setQuickFiles((prev) => [...prev, ...processed.map((p) => p.file)]);
      setQuickPreviews((prev) => [...prev, ...processed.map((p) => ({ file: p.file, url: p.previewUrl }))]);

      toast.success(
        isRtl
          ? `تم تجهيز وتنسيق ${files.length} صورة تلقائياً لتطبيق الموبايل بنجاح ✨`
          : `Automatically optimized ${files.length} image(s) for mobile app ✨`
      );
    } catch {
      setQuickFiles((prev) => [...prev, ...files]);
    } finally {
      setOptimizingImages(false);
    }
  };

  const handleQuickUploadSubmit = async () => {
    if (!quickUploadBanner || quickFiles.length === 0) {
      toast.warning(isRtl ? 'يرجى اختيار صورة واحدة على الأقل' : 'Please select at least one image');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('header_ar', quickUploadBanner.headerAr);
      fd.append('header_en', quickUploadBanner.headerEn);
      fd.append('description_ar', quickUploadBanner.descriptionAr);
      fd.append('description_en', quickUploadBanner.descriptionEn);

      if (quickUploadBanner.header) fd.append('header', quickUploadBanner.header);
      if (quickUploadBanner.description) fd.append('description', quickUploadBanner.description);

      // Attach files based on active slider
      if (activeSlider === 'slider2') {
        fd.append('image', quickFiles[0]);
      } else {
        // Both Slider 1 and Slider 3 use images[] array
        quickFiles.forEach((file) => {
          fd.append('images[]', file);
        });
      }

      let res;
      if (activeSlider === 'slider1') res = await api.updateBanner(quickUploadBanner.id, fd);
      else if (activeSlider === 'slider2') res = await api.updateBanner2(quickUploadBanner.id, fd);
      else res = await api.updateBanner3(quickUploadBanner.id, fd);

      toast.success(res?.message || (isRtl ? 'تم إضافة الصور للبانر بنجاح' : 'Images attached to banner successfully'));
      setQuickUploadBanner(null);
      setQuickFiles([]);
      setQuickPreviews([]);
      loadBanners();
    } catch (err) {
      toast.error(err?.message || (isRtl ? 'فشل رفع الصور للبانر' : 'Failed to upload images'));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Apply a high-resolution responsive preset banner (2:1 / 16:9)
   * Supports applying a single URL, an array of URLs, or a preset bundle object with multiple images.
   * Can be used inside Add/Edit modal, Quick Upload modal, or directly on banner card.
   */
  const handleApplyPreset = async (presetOrUrl, targetBanner = null) => {
    try {
      setOptimizingImages(true);
      let urls = [];
      if (Array.isArray(presetOrUrl)) {
        urls = presetOrUrl;
      } else if (typeof presetOrUrl === 'object' && presetOrUrl !== null) {
        urls = Array.isArray(presetOrUrl.images) && presetOrUrl.images.length > 0
          ? presetOrUrl.images
          : [presetOrUrl.imageUrl || presetOrUrl.url];
      } else if (typeof presetOrUrl === 'string') {
        urls = [presetOrUrl];
      }

      urls = urls.filter(Boolean);
      if (urls.length === 0) throw new Error('No preset image URLs provided');

      // Fetch and process all preset images
      const processedFiles = [];
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not fetch preset asset: ${url}`);
        const blob = await res.blob();
        const rawFileName = url.split('/').pop() || `room_preset_${i + 1}.jpg`;
        const file = new File([blob], rawFileName, { type: 'image/jpeg' });
        const processed = await autoProcessBannerImage(file);
        processedFiles.push(processed);
      }

      if (isAddEditModalOpen) {
        setNewImageFiles(processedFiles.map((p) => p.file));
        setNewImagePreviews(processedFiles.map((p) => ({ file: p.file, url: p.previewUrl })));
        toast.success(
          isRtl
            ? `تم تجهيز ${processedFiles.length} صورة احترافية متجاوبة بنجاح! ✨ اضغط "حفظ التعديلات" لاعتمادها.`
            : `${processedFiles.length} responsive presets selected! Click "Save Changes" to commit.`
        );
      } else if (quickUploadBanner) {
        setQuickFiles(processedFiles.map((p) => p.file));
        setQuickPreviews(processedFiles.map((p) => ({ file: p.file, url: p.previewUrl })));
        toast.success(
          isRtl
            ? `تم اختيار ${processedFiles.length} صورة احترافية بنجاح! ✨ اضغط "رفع وحفظ الصور".`
            : `${processedFiles.length} responsive presets selected! Click "Upload Images".`
        );
      } else if (targetBanner) {
        setSubmitting(true);
        const fd = new FormData();
        fd.append('header_ar', targetBanner.headerAr || targetBanner.headerEn || '');
        fd.append('header_en', targetBanner.headerEn || targetBanner.headerAr || '');
        fd.append('header', targetBanner.headerAr || targetBanner.headerEn || '');

        fd.append('description_ar', targetBanner.descriptionAr || targetBanner.descriptionEn || '');
        fd.append('description_en', targetBanner.descriptionEn || targetBanner.descriptionAr || '');
        fd.append('description', targetBanner.descriptionAr || targetBanner.descriptionEn || '');

        if (activeSlider === 'slider2') {
          fd.append('image', processedFiles[0].file);
        } else {
          processedFiles.forEach((p) => {
            fd.append('images[]', p.file);
          });
          fd.append('image', processedFiles[0].file);
        }

        let updateRes;
        if (activeSlider === 'slider1') updateRes = await api.updateBanner(targetBanner.id, fd);
        else if (activeSlider === 'slider2') updateRes = await api.updateBanner2(targetBanner.id, fd);
        else updateRes = await api.updateBanner3(targetBanner.id, fd);

        toast.success(
          updateRes?.message || (isRtl ? `تم تحديث البانر وتطبيق ${processedFiles.length} صور احترافية في التطبيق بنجاح! ✨` : `Banner updated with ${processedFiles.length} professional images! ✨`)
        );
        loadBanners();
        loadAllCounts();
      }
    } catch (err) {
      console.error('Error applying preset:', err);
      toast.error(err?.message || (isRtl ? 'فشل تطبيق التصميم الجاهز' : 'Failed to apply preset design'));
    } finally {
      setOptimizingImages(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 w-full animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl items-center justify-center bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/70">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-chocolate-900">
                {isRtl ? 'بانرات وعروض التطبيق' : 'Mobile App Banners'}
              </h2>
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
                {sliderCounts.slider1 + sliderCounts.slider2 + sliderCounts.slider3} {isRtl ? 'بانر نشط' : 'active banners'}
              </span>
            </div>
            <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
              {isRtl
                ? 'تخصيص وإدارة البانرات والعروض الترويجية التي تظهر لضيوف الكافيه في تطبيق الهاتف المحمول.'
                : 'Configure promotional banners and hero sliders displayed on the Cafe 90 guest mobile app.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              loadBanners();
              loadAllCounts();
            }}
            className="h-10 w-10 inline-flex items-center justify-center bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 rounded-xl shadow-2xs transition cursor-pointer"
            title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold-600' : ''}`} />
          </button>

          <Button
            variant="gold"
            size="md"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            {isRtl ? 'إضافة بانر جديد' : 'Create New Banner'}
          </Button>
        </div>
      </div>

      {/* Slider Tabs Switcher */}
      <div className="w-full overflow-x-auto custom-scrollbar">
      <div className="inline-flex items-center gap-0.5 p-1 bg-stone-200/50 rounded-xl">
        {[
          { id: 'slider1', label: isRtl ? 'البانرات الرئيسية' : 'Main Banners', count: sliderCounts.slider1 },
          { id: 'slider2', label: isRtl ? 'العروض والخصومات' : 'Special Offers', count: sliderCounts.slider2 },
          { id: 'slider3', label: isRtl ? 'غرف وقاعات VIP' : 'VIP Rooms & Pods', count: sliderCounts.slider3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSlider(tab.id)}
            className={`h-8 px-3 rounded-lg text-[13px] transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeSlider === tab.id
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'text-stone-500 font-medium hover:text-chocolate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums ${
                activeSlider === tab.id
                  ? 'bg-gold-100 text-gold-800'
                  : 'bg-stone-200/70 text-stone-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200/70 shadow-card overflow-hidden animate-pulse">
              <div className="aspect-[2/1] bg-stone-100" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-2/3 rounded bg-stone-100" />
                <div className="h-3 w-1/2 rounded bg-stone-100" />
                <div className="h-8 w-full rounded-lg bg-stone-100 mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/70 py-14 px-6 text-center shadow-card flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mb-1">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-chocolate-900">
            {isRtl ? 'لا توجد بانرات مسجلة في هذا السلايدر حالياً' : 'No banners currently listed in this slider'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {isRtl
              ? 'يمكنك إضافة أول بانر ترويجي الآن لتبدأ بالظهور فوراً لعملاء تطبيق الهاتف.'
              : 'Add your first promotional hero banner now to start appearing to mobile app guests.'}
          </p>
          <div className="mt-2">
            <Button variant="gold" size="sm" icon={Plus} onClick={handleOpenAdd}>
              {isRtl ? 'إضافة بانر جديد' : 'Create Banner'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {banners.map((banner) => {
            const hasMultipleImages = banner.images && banner.images.length > 1;
            const currentImgIndex = activeImageIndexes[banner.id] || 0;
            const displayedImage = hasMultipleImages
              ? banner.images[currentImgIndex]?.imageUrl || banner.imageUrl
              : banner.imageUrl;

            return (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Image Preview Area (Clean 16:9 / 2:1) */}
                <div className="relative aspect-[2/1] w-full overflow-hidden bg-stone-100 border-b border-stone-200/70 flex items-center justify-center">
                  {displayedImage ? (
                    <>
                      <img
                        src={displayedImage}
                        alt={banner.headerAr || banner.headerEn || 'Banner'}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => setLightboxImage(displayedImage)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 start-3 flex items-center gap-1.5">
                        <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium tabular-nums bg-black/45 backdrop-blur text-white ring-1 ring-white/15">
                          #{banner.id}
                        </span>
                        {hasMultipleImages && (
                          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15">
                            <ImageIcon className="w-3 h-3" />
                            <span>{banner.images.length} {isRtl ? 'صور' : 'photos'}</span>
                          </span>
                        )}
                      </div>

                      {/* Carousel Arrows & Dots for Multi-Images */}
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={(e) => handlePrevImage(banner.id, banner.images.length, e)}
                            className="absolute start-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-chocolate-900 ring-1 ring-black/5 shadow-xs backdrop-blur transition cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleNextImage(banner.id, banner.images.length, e)}
                            className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-chocolate-900 ring-1 ring-black/5 shadow-xs backdrop-blur transition cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                            {banner.images.map((_, idx) => (
                              <span
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${
                                  idx === currentImgIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 w-1.5'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    /* Clean No-Image Placeholder */
                    <div className="flex flex-col items-center justify-center p-6 text-center gap-1.5">
                      <div className="w-11 h-11 rounded-xl bg-white text-stone-400 ring-1 ring-inset ring-stone-200/70 flex items-center justify-center mb-0.5">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-[13px] font-medium text-stone-500">
                        {isRtl ? 'لا توجد صورة للبانر' : 'No image uploaded'}
                      </p>
                      <button
                        onClick={() => handleOpenQuickUpload(banner)}
                        className="text-xs font-semibold text-gold-700 hover:text-gold-800 hover:underline cursor-pointer"
                      >
                        {isRtl ? '+ رفع صورة الآن' : '+ Upload now'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Banner Content Area */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div>
                      <h3 className="text-[15px] font-bold text-chocolate-900 leading-snug">
                        {banner.headerAr || banner.headerEn || (isRtl ? 'بدون عنوان' : 'Untitled')}
                      </h3>
                      {banner.headerEn && banner.headerAr && (
                        <p className="text-xs text-stone-400 font-medium mt-0.5">
                          {banner.headerEn}
                        </p>
                      )}
                    </div>

                    {(banner.descriptionAr || banner.descriptionEn) && (
                      <p className="text-[13px] text-stone-500 line-clamp-2 leading-relaxed">
                        {banner.descriptionAr || banner.descriptionEn}
                      </p>
                    )}
                  </div>

                  {/* Clean Footer Info & Actions */}
                  <div className="space-y-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1.5 font-medium tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {formatDate(banner.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-medium text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {isRtl ? 'نشط بالتطبيق' : 'Active on app'}
                      </span>
                    </div>

                    {/* Single-Row Clean Action Bar */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(banner)}
                        className="flex-1 h-8 px-3 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 shadow-2xs rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title={isRtl ? 'تعديل بيانات البانر' : 'Edit banner'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={() => setMobileSimBanner(banner)}
                        className="h-8 px-2.5 sm:px-3 text-stone-600 hover:bg-stone-100 hover:text-chocolate-900 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title={isRtl ? 'معاينة شكل البانر على شاشة الموبايل' : 'Preview on mobile'}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isRtl ? 'معاينة' : 'Preview'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenQuickUpload(banner)}
                        className="h-8 px-2.5 sm:px-3 text-stone-600 hover:bg-stone-100 hover:text-chocolate-900 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title={isRtl ? 'إضافة أو تغيير صور البانر' : 'Manage photos'}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isRtl ? 'صور' : 'Photos'}</span>
                      </button>

                      <button
                        onClick={() => setDeletingBanner(banner)}
                        className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={isRtl ? 'حذف البانر' : 'Delete banner'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingBanner ? (isRtl ? 'تعديل بانر التطبيق' : 'Edit App Banner') : (isRtl ? 'إضافة بانر ترويجي جديد' : 'Create New Promotional Banner')}
        subtitle={isRtl ? 'إدخال البيانات بالعربية والإنجليزية ورفع وإدارة صور البانر' : 'Configure bilingual content and manage attached promotional photos'}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddEditModalOpen(false)}
              disabled={submitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
            >
              {editingBanner ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء البانر' : 'Create Banner')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* ARABIC CONTENT BOX */}
          <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-chocolate-900">
              <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70">
                العربية (AR)
              </span>
              <span>{isRtl ? 'المحتوى باللغة العربية' : 'Arabic Content'}</span>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'عنوان البانر (بالعربية) *' : 'Headline Title (Arabic) *'}
              </label>
              <input
                type="text"
                value={formData.headerAr}
                onChange={(e) => setFormData({ ...formData, headerAr: e.target.value })}
                placeholder="مثال: قهوة رائعة، عروض الصيف المنعشة"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                required={!formData.headerEn}
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'وصف وتفاصيل البانر (بالعربية)' : 'Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="مثال: استمتع بقهوتنا الطازجة المحمصة يومياً بنكهة استثنائية"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
              />
            </div>
          </div>

          {/* ENGLISH CONTENT BOX */}
          <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-chocolate-900">
              <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70">
                English (EN)
              </span>
              <span>{isRtl ? 'المحتوى باللغة الإنجليزية' : 'English Content'}</span>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'عنوان البانر (بالإنجليزية)' : 'Headline Title (English)'}
              </label>
              <input
                type="text"
                value={formData.headerEn}
                onChange={(e) => setFormData({ ...formData, headerEn: e.target.value })}
                placeholder="e.g. Amazing Coffee, Summer Refreshers"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'وصف وتفاصيل البانر (بالإنجليزية)' : 'Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                placeholder="e.g. Enjoy our freshly roasted specialty brew every morning"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
              />
            </div>
          </div>

          {/* EXISTING ATTACHED IMAGES GALLERY (in Edit Mode) */}
          {editingBanner && editingBanner.images && editingBanner.images.length > 0 && (
            <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-chocolate-900">
                  {isRtl ? 'الصور الحالية المرفقة بالبانر (اضغط 🗑️ لحذف صورة معينة):' : 'Attached Banner Images (Click 🗑️ to delete specific image):'}
                </span>
                <span className="inline-flex items-center shrink-0 h-6 px-2 rounded-full text-xs font-semibold tabular-nums bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70">
                  {editingBanner.images.length} {isRtl ? 'صور' : 'images'}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {editingBanner.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden border border-stone-200/70 aspect-square bg-stone-100"
                  >
                    <img
                      src={img.imageUrl}
                      alt="Banner attachment"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      {(activeSlider === 'slider1' || activeSlider === 'slider3') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(editingBanner.id, img.id)}
                          disabled={submitting}
                          className="h-8 w-8 inline-flex items-center justify-center bg-white text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shadow-xs"
                          title={isRtl ? 'حذف هذه الصورة' : 'Delete this image'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[11px] font-medium tabular-nums text-white">
                        #{img.sortOrder}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRESET LUXURY RESPONSIVE DESIGNS (Android & iOS 2:1) */}
          <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                <span className="text-[13px] font-semibold text-chocolate-900">
                  {isRtl ? 'تصاميم احترافية جاهزة متجاوبة (Android & iOS)' : 'Professional Responsive Presets (Android & iOS)'}
                </span>
              </div>
              <span className="inline-flex items-center shrink-0 h-6 px-2 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200/70 tabular-nums">
                2:1 Full Bleed
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              {isRtl
                ? 'تم ضبط هذه التصاميم لتكون المنتجات في اليسار مع ترك مساحة ناصعة على اليمين لتظهر نصوص التطبيق بأعلى درجات الوضوح والجاذبية بدون أي قص على كل أحجام الموبايل.'
                : 'Engineered with hero products on the left and clean empty space on the right for crystal clear mobile text overlays.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_BANNERS.filter((preset) => !preset.slider || preset.slider === activeSlider).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="group relative rounded-xl overflow-hidden border border-stone-200/70 hover:border-gold-400 hover:ring-4 hover:ring-gold-400/15 bg-white cursor-pointer transition-all shadow-2xs flex flex-col"
                >
                  <div className="relative aspect-[2/1] w-full overflow-hidden bg-stone-100">
                    <img
                      src={preset.imageUrl}
                      alt={preset.titleAr}
                      className="w-full h-full object-cover"
                    />
                    {preset.images && preset.images.length > 1 && (
                      <span className="absolute top-2 start-2 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15 z-10">
                        ✨ {preset.images.length} {isRtl ? 'صور باقة كاملة' : 'Images Bundle'}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center h-8 px-3 rounded-lg bg-white text-chocolate-900 font-semibold text-xs shadow-xs">
                        {isRtl ? 'اختيار هذا التصميم ✨' : 'Select This ✨'}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 space-y-0.5">
                    <p className="font-semibold text-chocolate-900 text-[13px] line-clamp-1">
                      {isRtl ? preset.titleAr : preset.titleEn}
                    </p>
                    <p className="text-[11px] text-stone-500 line-clamp-1">
                      {isRtl ? preset.descAr : preset.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPLOAD NEW IMAGES BOX */}
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-chocolate-800">
              {isRtl ? 'أو ارفع صور جديدة من جهازك' : 'Or upload new images from device'}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 border border-dashed border-stone-300 hover:border-gold-400 bg-stone-50/60 hover:bg-gold-50/40 rounded-xl px-4 py-5 text-center cursor-pointer transition"
            >
              <span className="w-10 h-10 rounded-xl bg-white text-gold-700 ring-1 ring-inset ring-stone-200/70 shadow-2xs flex items-center justify-center mb-0.5"><Upload className="w-[18px] h-[18px]" /></span>
              <p className="text-[13px] font-semibold text-chocolate-900">
                {isRtl ? 'اضغط لاختيار صور من جهازك' : 'Click to browse images from device'}
              </p>
              <p className="text-xs text-stone-500">
                {isRtl ? 'يدعم صيغ JPG, PNG, WebP (يمكن تحديد أكثر من صورة)' : 'Supports JPG, PNG, WebP (Select one or multiple)'}
              </p>
            </div>

            {/* Previews of newly selected files */}
            {newImagePreviews.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />
                    {isRtl ? 'الصور المختارة الجديدة جاهزة للحفظ:' : 'Selected images ready for upload:'}
                  </span>
                  <span className="text-xs text-stone-500 tabular-nums">
                    {newImagePreviews.length} {isRtl ? 'صور' : 'files'}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {newImagePreviews.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-12 rounded-lg overflow-hidden border border-stone-200/70 shrink-0 group bg-stone-100"
                    >
                      <img
                        src={item.url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedFile(idx);
                        }}
                        className="absolute top-1 end-1 h-5 w-5 inline-flex items-center justify-center bg-white/90 hover:bg-white text-rose-600 rounded-full cursor-pointer z-10 shadow-xs ring-1 ring-black/5 transition"
                        title={isRtl ? 'إلغاء الصورة' : 'Remove image'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Quick Add Images Modal */}
      {quickUploadBanner && (
        <Modal
          isOpen={Boolean(quickUploadBanner)}
          onClose={() => setQuickUploadBanner(null)}
          title={isRtl ? `إضافة صور إلى البانر #${quickUploadBanner.id}` : `Attach Images to Banner #${quickUploadBanner.id}`}
          subtitle={quickUploadBanner.headerAr || quickUploadBanner.headerEn}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickUploadBanner(null)}
                disabled={submitting}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleQuickUploadSubmit}
                loading={submitting}
                disabled={quickFiles.length === 0}
              >
                {isRtl ? 'رفع وحفظ الصور' : 'Upload Images'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-[13px] text-stone-500 leading-relaxed">
              {isRtl
                ? 'اختر صورة واحدة أو مجموعة صور وسيتم رفعها وإضافتها فوراً لهذا البانر وتظهر على تطبيق الهاتف.'
                : 'Select one or more images to immediately attach to this promotional banner.'}
            </p>

            {/* PRESET LUXURY RESPONSIVE DESIGNS (Android & iOS 2:1) */}
            <div className="p-4 rounded-xl border border-stone-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                  <span className="text-[13px] font-semibold text-chocolate-900">
                    {isRtl ? 'تصاميم احترافية جاهزة متجاوبة (Android & iOS)' : 'Professional Responsive Presets (Android & iOS)'}
                  </span>
                </div>
                <span className="inline-flex items-center shrink-0 h-6 px-2 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200/70 tabular-nums">
                  2:1 Full Bleed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_BANNERS.filter((preset) => !preset.slider || preset.slider === activeSlider).map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="group relative rounded-xl overflow-hidden border border-stone-200/70 hover:border-gold-400 hover:ring-4 hover:ring-gold-400/15 bg-white cursor-pointer transition-all shadow-2xs flex flex-col"
                  >
                    <div className="relative aspect-[2/1] w-full overflow-hidden bg-stone-100">
                      <img
                        src={preset.imageUrl}
                        alt={preset.titleAr}
                        className="w-full h-full object-cover"
                      />
                      {preset.images && preset.images.length > 1 && (
                        <span className="absolute top-2 start-2 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15 z-10">
                          ✨ {preset.images.length} {isRtl ? 'صور باقة كاملة' : 'Images Bundle'}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="inline-flex items-center h-8 px-3 rounded-lg bg-white text-chocolate-900 font-semibold text-xs shadow-xs">
                          {isRtl ? 'اختيار هذا التصميم ✨' : 'Select This ✨'}
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 space-y-0.5">
                      <p className="font-semibold text-chocolate-900 text-[13px] line-clamp-1">
                        {isRtl ? preset.titleAr : preset.titleEn}
                      </p>
                      <p className="text-[11px] text-stone-500 line-clamp-1">
                        {isRtl ? preset.descAr : preset.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <input
              type="file"
              ref={quickFileInputRef}
              onChange={handleQuickFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div
              onClick={() => quickFileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 border border-dashed border-stone-300 hover:border-gold-400 bg-stone-50/60 hover:bg-gold-50/40 rounded-xl px-4 py-5 text-center cursor-pointer transition"
            >
              <span className="w-10 h-10 rounded-xl bg-white text-gold-700 ring-1 ring-inset ring-stone-200/70 shadow-2xs flex items-center justify-center mb-0.5"><Upload className="w-[18px] h-[18px]" /></span>
              <p className="text-[13px] font-semibold text-chocolate-900">
                {isRtl ? 'أو اضغط لاختيار الصور من جهازك' : 'Or click to select images from device'}
              </p>
              <p className="text-xs text-stone-500">
                {isRtl ? 'يمكن اختيار عدة صور في وقت واحد' : 'Multi-file selection supported'}
              </p>
            </div>

            {quickPreviews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />
                    {isRtl ? `تم اختيار (${quickPreviews.length}) صور:` : `Selected (${quickPreviews.length}) images:`}
                  </span>
                  <span className="text-xs text-stone-500">
                    {isRtl ? 'تم تجهيز وتنسيق المقاس تلقائياً للموبايل' : 'Automatically formatted for mobile display'}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {quickPreviews.map((p, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-stone-200/70 aspect-video group bg-stone-100">
                      <img src={p.url} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickFiles((prev) => prev.filter((_, i) => i !== idx));
                          setQuickPreviews((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1 end-1 h-5 w-5 inline-flex items-center justify-center bg-white/90 hover:bg-white text-rose-600 rounded-full cursor-pointer z-10 shadow-xs ring-1 ring-black/5 transition"
                        title={isRtl ? 'إلغاء الصورة' : 'Remove image'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Live Get Banner By ID Details Modal */}
      {viewingBanner && (
        <Modal
          isOpen={Boolean(viewingBanner)}
          onClose={() => setViewingBanner(null)}
          title={isRtl ? `تفاصيل البانر #${viewingBanner.id}` : `Banner Details #${viewingBanner.id}`}
          subtitle={isRtl ? 'بيانات البانر المباشرة من السيرفر (GET /banners/:id)' : 'Live banner data fetched directly from server'}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="hidden sm:inline text-[11px] tabular-nums text-stone-400">
                Endpoint: /{activeSlider === 'slider1' ? 'banners' : activeSlider === 'slider2' ? 'banner2s' : 'banner3s'}/{viewingBanner.id}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingBanner(null)}
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  icon={Edit2}
                  onClick={() => {
                    const target = viewingBanner;
                    setViewingBanner(null);
                    handleOpenEdit(target);
                  }}
                >
                  {isRtl ? 'تعديل البانر' : 'Edit Banner'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {loadingDetails && (
              <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{isRtl ? 'جاري جلب أحدث البيانات المباشرة للبانر من السيرفر...' : 'Fetching latest live banner data...'}</span>
              </div>
            )}

            {/* Banner Gallery Preview if images exist */}
            {viewingBanner.images && viewingBanner.images.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[13px] font-semibold text-chocolate-900 block">
                  {isRtl ? `الصور المرفقة (${viewingBanner.images.length}):` : `Attached Images (${viewingBanner.images.length}):`}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {viewingBanner.images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxImage(img.imageUrl)}
                      className="relative rounded-lg overflow-hidden border border-stone-200/70 aspect-video bg-stone-100 group cursor-zoom-in"
                    >
                      <img src={img.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="absolute bottom-1.5 start-1.5 inline-flex items-center h-5 px-1.5 rounded-full text-[11px] font-medium tabular-nums bg-black/45 backdrop-blur text-white ring-1 ring-white/15">
                        #{img.sortOrder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : viewingBanner.imageUrl ? (
              <div className="rounded-xl overflow-hidden border border-stone-200/70 max-h-56 bg-stone-100">
                <img src={viewingBanner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="p-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center text-stone-500 text-xs">
                {isRtl ? 'لا توجد صور مرفوعة لهذا البانر حتى الآن' : 'No images currently attached to this banner'}
              </div>
            )}

            {/* Bilingual Content Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70">
                    AR
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    {isRtl ? 'المحتوى العربي' : 'Arabic Content'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-chocolate-900">
                  {viewingBanner.headerAr || '—'}
                </p>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {viewingBanner.descriptionAr || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70">
                    EN
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    {isRtl ? 'المحتوى الإنجليزي' : 'English Content'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-chocolate-900">
                  {viewingBanner.headerEn || '—'}
                </p>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {viewingBanner.descriptionEn || '—'}
                </p>
              </div>
            </div>

            {/* Timestamps & Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-stone-50/80 rounded-xl border border-stone-200/70 text-xs text-stone-500 tabular-nums">
              <span>{isRtl ? 'تاريخ الإنشاء:' : 'Created:'} <strong>{formatDate(viewingBanner.createdAt)}</strong></span>
              <span>{isRtl ? 'آخر تحديث:' : 'Updated:'} <strong>{formatDate(viewingBanner.updatedAt)}</strong></span>
              <span>ID: <strong>#{viewingBanner.id}</strong></span>
            </div>
          </div>
        </Modal>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-pop">
            <img
              src={lightboxImage}
              alt="Banner preview"
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 end-3 h-9 w-9 inline-flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur text-white ring-1 ring-white/15 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile App Simulator Modal (Android & iOS Responsive Test) */}
      {mobileSimBanner && (
        <Modal
          isOpen={Boolean(mobileSimBanner)}
          onClose={() => setMobileSimBanner(null)}
          title={isRtl ? `معاينة استجابة البانر على شاشات الموبايل (Android & iOS)` : `Responsive Mobile Simulator (Android & iOS)`}
          subtitle={isRtl ? `تجربة البانر #${mobileSimBanner.id} على مختلف أحجام الهواتف وأنظمة التشغيل بدقة 100%` : `Testing Banner #${mobileSimBanner.id} responsiveness across platforms and screen sizes`}
          footer={(() => {
            const defaultSimPreset = activeSlider === 'slider3'
              ? (PRESET_BANNERS.find((p) => p.id === 'solvex_rooms_bundle') || '/banner_room_solvex_lounge.jpg')
              : (activeSlider === 'slider1' ? '/banner_cafe90_experience.jpg' : '/banner_offer_happiness.jpg');
            const defaultPresetUrl = typeof defaultSimPreset === 'object' ? defaultSimPreset.imageUrl : defaultSimPreset;
            const isUsingPreset = mobileSimBanner.imageUrl === defaultPresetUrl;

            return (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-medium whitespace-nowrap">
                    {isRtl ? 'التصميم المختار في العرض:' : 'Active Preview:'}
                  </span>
                  <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-semibold whitespace-nowrap bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70">
                    {isUsingPreset
                      ? (activeSlider === 'slider3'
                          ? (isRtl ? 'باقة غرف VIP الفاخرة (3 صور)' : 'Luxury VIP Rooms Bundle')
                          : activeSlider === 'slider1'
                          ? (isRtl ? 'تصميم كافيه 90 المتجاوب النقي' : 'Seamless Cafe 90 Preset')
                          : (isRtl ? 'التصميم المتجاوب (كوبين مثلجين)' : '2:1 Responsive Preset'))
                      : (isRtl ? 'الصورة الحالية في السيرفر' : 'Current Server Image')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isUsingPreset) {
                        setMobileSimBanner((prev) => ({
                          ...prev,
                          imageUrl: banners.find((b) => b.id === prev.id)?.imageUrl || null
                        }));
                      } else {
                        setMobileSimBanner((prev) => ({
                          ...prev,
                          imageUrl: defaultPresetUrl
                        }));
                      }
                    }}
                  >
                    {isUsingPreset
                      ? (isRtl ? 'عرض الصورة القديمة' : 'View Old Image')
                      : (isRtl ? 'معاينة التصميم المتجاوب بدون حواف' : 'Preview Seamless 2:1 Design')}
                  </Button>

                  <Button
                    variant="gold"
                    size="sm"
                    icon={Sparkles}
                    loading={submitting}
                    onClick={async () => {
                      await handleApplyPreset(defaultSimPreset, mobileSimBanner);
                      setMobileSimBanner(null);
                    }}
                  >
                    {isRtl ? 'اعتماد وتطبيق هذا التصميم فوراً ✨' : 'Apply & Save To App ✨'}
                  </Button>
                </div>
              </div>
            );
          })()}
        >
          <div className="space-y-6">
            {/* Simulator Controls: Platform & Screen Width */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Platform Selector (Android vs iOS) */}
              <div className="inline-flex items-center gap-0.5 p-1 bg-stone-200/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMobileSimPlatform('android')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    mobileSimPlatform === 'android'
                      ? 'bg-white text-chocolate-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>🤖</span>
                  <span>Android (أندرويد)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSimPlatform('ios')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    mobileSimPlatform === 'ios'
                      ? 'bg-white text-chocolate-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>🍎</span>
                  <span>iOS (آبل ستور)</span>
                </button>
              </div>

              {/* Screen Width Selector */}
              <div className="inline-flex flex-wrap items-center gap-0.5 p-1 bg-stone-200/50 rounded-xl text-xs font-semibold">
                <span className="px-2 text-[11px] text-stone-500">{isRtl ? 'عرض الشاشة:' : 'Width:'}</span>
                {[
                  { width: 360, label: isRtl ? 'صغير (360px)' : 'Small' },
                  { width: 393, label: isRtl ? 'قياسي (393px)' : 'Standard' },
                  { width: 430, label: isRtl ? 'كبير Pro Max (430px)' : 'Pro Max' }
                ].map((size) => (
                  <button
                    key={size.width}
                    type="button"
                    onClick={() => setMobileSimWidth(size.width)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      mobileSimWidth === size.width
                        ? 'bg-white text-chocolate-900 shadow-xs'
                        : 'text-stone-500 hover:text-chocolate-900'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Mobile Phone Container */}
            <div className="flex justify-center items-center py-2 overflow-x-auto">
              <div
                style={{ width: `${mobileSimWidth}px`, maxWidth: '100%' }}
                className="transition-all duration-300 bg-white rounded-[2.25rem] border-[6px] border-stone-900 ring-1 ring-stone-300 shadow-pop overflow-hidden flex flex-col relative"
              >
                {/* Phone Top Notch / Dynamic Island / Status Bar */}
                <div className="bg-stone-900 text-white px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono select-none">
                  <span>6:41</span>
                  {mobileSimPlatform === 'ios' ? (
                    <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                  ) : (
                    <div className="w-3 h-3 bg-black rounded-full border border-stone-700 mx-auto" />
                  )}
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* Simulated App Header */}
                <div className="p-4 flex items-center justify-between bg-stone-50 border-b border-stone-200/60" dir="rtl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-stone-300 border border-gold-400 overflow-hidden shadow-xs">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-black text-chocolate-950">shalsh 👋</p>
                      <p className="text-xs text-stone-500">مرحباً بك في كافيه 90</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs">
                    🔔
                  </div>
                </div>

                {/* Simulated Mobile Screen Body */}
                <div className="p-4 bg-stone-50/50 space-y-4" dir="rtl">
                  {/* The Banner Widget */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-chocolate-900">
                        {activeSlider === 'slider3'
                          ? 'غرف وقاعات كافيه 90 VIP'
                          : activeSlider === 'slider2'
                          ? 'العروض والخصومات المميزة'
                          : 'تجربة كافيه 90'}
                      </span>
                      <span className="text-[10px] font-bold text-gold-600">شاهد الكل</span>
                    </div>

                    {activeSlider === 'slider3' ? (
                      /* Slider 3: VIP Room Booking Card (Exact Match to User's Mobile Screen from Image 1) */
                      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-3.5 flex items-center gap-3.5 select-none overflow-hidden group">
                        {/* Left Side: Luxury Room Image / Interactive Multi-Photo Carousel */}
                        <div className="relative w-36 sm:w-44 aspect-square rounded-2xl overflow-hidden bg-stone-900 shrink-0 shadow-inner">
                          <img
                            src={
                              mobileSimBanner.images && mobileSimBanner.images.length > 0
                                ? mobileSimBanner.images[simRoomImgIndex % mobileSimBanner.images.length]?.imageUrl
                                : mobileSimBanner.imageUrl || '/banner_room_solvex_lounge.jpg'
                            }
                            alt="Room"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                          {/* Multi-Photo Dots & Counter */}
                          {mobileSimBanner.images && mobileSimBanner.images.length > 1 && (
                            <>
                              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-10">
                                {mobileSimBanner.images.map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSimRoomImgIndex(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                                      i === (simRoomImgIndex % mobileSimBanner.images.length)
                                        ? 'bg-gold-400 w-3 shadow-xs'
                                        : 'bg-white/60'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums bg-black/45 backdrop-blur text-white">
                                {(simRoomImgIndex % mobileSimBanner.images.length) + 1}/{mobileSimBanner.images.length}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Right Side: Header, Subtitle, and Book Now Pill Button */}
                        <div className="flex-1 flex flex-col justify-between py-1 text-right">
                          <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-black text-chocolate-950 leading-tight">
                              {mobileSimBanner.headerAr || 'سولفكس'}
                            </h3>
                            <p className="text-xs font-semibold text-stone-500">
                              {mobileSimBanner.descriptionAr || 'سولفكس الاصيل'}
                            </p>
                          </div>

                          <div className="mt-3">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-2xl bg-[#684c35] hover:bg-[#573e2b] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>احجزها الآن</span>
                              <span>📅</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Responsive Banner Card for Sliders 1 & 2 */
                      <div className="relative aspect-[2/1] w-full rounded-2xl overflow-hidden shadow-card border border-stone-200/80 group select-none">
                        <img
                          src={mobileSimBanner.imageUrl || (activeSlider === 'slider1' ? '/banner_cafe90_experience.jpg' : '/banner_offer_happiness.jpg')}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />

                        {activeSlider === 'slider2' ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 p-4 flex flex-col justify-end text-white text-right z-10">
                              <h4 className="text-base sm:text-lg font-black tracking-wide drop-shadow-md text-white">
                                {mobileSimBanner.headerAr || 'شارك السعاده'}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-white/95 font-semibold drop-shadow-sm mt-0.5 line-clamp-2">
                                {mobileSimBanner.descriptionAr || 'اشتري واحد واحصل على واحد هديه'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 p-4 flex flex-col justify-between text-right z-10 pointer-events-none">
                              <div className="space-y-1 max-w-[65%] self-end">
                                <h4 className="text-sm sm:text-base font-black text-chocolate-900 drop-shadow-2xs">
                                  {mobileSimBanner.headerAr || 'تجربة كافية 90'}
                                </h4>
                                <p className="text-[10px] text-chocolate-800/90 font-medium leading-relaxed line-clamp-3">
                                  {mobileSimBanner.descriptionAr || 'ساحة صممت بعناية لتمنحك الهدوء والخصوصية في كل زيارة، حيث تجتمع أصالة القهوة مع التصميم العصري.'}
                                </p>
                              </div>
                              <div className="self-end">
                                <span className="inline-block px-3.5 py-1.5 rounded-full bg-chocolate-800 text-white text-[10px] font-bold shadow-sm">
                                  تعرّف علينا أكثر
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Room Multi-Photo Switcher Bar in Simulator */}
                    {activeSlider === 'slider3' && mobileSimBanner.images && mobileSimBanner.images.length > 1 && (
                      <div className="flex items-center justify-between px-2 pt-1">
                        <span className="text-[10px] text-stone-500 font-bold">
                          📷 يتضمن البانر {mobileSimBanner.images.length} صور للغرفة
                        </span>
                        <button
                          type="button"
                          onClick={() => setSimRoomImgIndex((prev) => prev + 1)}
                          className="text-[11px] font-semibold text-gold-800 bg-gold-50 hover:bg-gold-100 px-2.5 py-1 rounded-lg ring-1 ring-inset ring-gold-200/70 cursor-pointer transition-colors"
                        >
                          تبديل الصورة التالية ➔
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Responsiveness Guarantee Badge */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-[11px] font-medium leading-normal">
                      {isRtl
                        ? 'الصور متناسقة 100% بدون أي حواف سوداء أو تشوه، والنصوص وزر الحجز واضحة بدقة كاملة على جميع شاشات أندرويد وآبل ستور.'
                        : 'Zero black borders, 100% responsive photos, and pristine typography across all screen widths.'}
                    </p>
                  </div>
                </div>

                {/* Simulated Bottom Navigation Bar */}
                <div className="bg-white border-t border-stone-200 px-4 py-2.5 flex items-center justify-around text-center text-stone-500 select-none" dir="rtl">
                  <div className={`flex flex-col items-center gap-0.5 ${activeSlider !== 'slider3' ? 'text-chocolate-900 font-bold' : ''}`}>
                    <span className="text-base">🏠</span>
                    <span className="text-[9px]">الرئيسية</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base">📖</span>
                    <span className="text-[9px]">المنيو</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base">🛒</span>
                    <span className="text-[9px]">السلة</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    {activeSlider === 'slider3' ? (
                      <div className="w-7 h-7 rounded-xl bg-[#684c35] text-white flex items-center justify-center shadow-xs">
                        <span className="text-sm">🛋️</span>
                      </div>
                    ) : (
                      <span className="text-base">🛋️</span>
                    )}
                    <span className={`text-[9px] ${activeSlider === 'slider3' ? 'text-chocolate-950 font-black' : ''}`}>الغرف</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base">👤</span>
                    <span className="text-[9px]">الحساب</span>
                  </div>
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="bg-white pb-2 pt-1 flex justify-center">
                  <div className="w-28 h-1 bg-stone-300 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingBanner)}
        onClose={() => setDeletingBanner(null)}
        onConfirm={handleDeleteBannerConfirm}
        title={isRtl ? 'حذف البانر الترويجي؟' : 'Delete Promotional Banner?'}
        message={
          isRtl
            ? `هل أنت متأكد من رغبتك في حذف البانر #${deletingBanner?.id} (${deletingBanner?.headerAr || deletingBanner?.headerEn})؟ سيتم إزالته نهائياً من قاعدة البيانات والتطبيق.`
            : `Are you sure you want to delete Banner #${deletingBanner?.id}? It will be permanently removed from the database and mobile application.`
        }
        loading={submitting}
      />
    </div>
  );
};
