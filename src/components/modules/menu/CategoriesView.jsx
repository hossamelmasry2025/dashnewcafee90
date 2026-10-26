import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Eye, 
  EyeOff, 
  Coffee, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2,
  RefreshCw,
  Search,
  Calendar,
  Tag,
  Hash,
  Star,
  Smartphone,
  RotateCcw,
  X
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { optimizeImageForMobile, CATEGORY_PRESETS } from '../../../utils/imageOptimizer';

export const CategoriesView = ({ onSelectCategory }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSubNames, setQuickSubNames] = useState({});
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'subcategories'
  const [deletingAllOrphaned, setDeletingAllOrphaned] = useState(false);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'cat' | 'subcat', item: obj }
  const [submitting, setSubmitting] = useState(false);

  // Live View Category Details (GET /categories/:id)
  const [viewingCategory, setViewingCategory] = useState(null);
  const [loadingCatDetails, setLoadingCatDetails] = useState(false);

  // Live View Subcategory Details (GET /subcategories/:id)
  const [viewingSubcategory, setViewingSubcategory] = useState(null);
  const [loadingSubDetails, setLoadingSubDetails] = useState(false);

  const [catImageFile, setCatImageFile] = useState(null);
  const [optimizingCatImage, setOptimizingCatImage] = useState(false);

  // Trashed Categories state (Soft Delete: GET /api/admin/categories/trashed & POST /api/admin/categories/:id/restore)
  const [trashedCategories, setTrashedCategories] = useState([]);
  const [trashedCatCount, setTrashedCatCount] = useState(0);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [loadingTrashed, setLoadingTrashed] = useState(false);
  const [restoringCatId, setRestoringCatId] = useState(null);

  const fetchTrashedCatCount = async () => {
    try {
      const res = await api.getTrashedCategories();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setTrashedCatCount(list.length);
    } catch (e) {}
  };

  const loadTrashedCategories = async () => {
    try {
      setLoadingTrashed(true);
      const res = await api.getTrashedCategories();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setTrashedCategories(list);
      setTrashedCatCount(list.length);
    } catch (err) {
      toast.error(isRtl ? 'تعذر جلب الأقسام المحذوفة' : 'Failed to load trashed categories');
    } finally {
      setLoadingTrashed(false);
    }
  };

  const handleRestoreCategory = async (cat) => {
    try {
      setRestoringCatId(cat.id);
      await api.restoreCategory(cat.id);
      const catName = isRtl ? (cat.name_ar || cat.nameAr || cat.name) : (cat.name_en || cat.nameEn || cat.name);
      toast.success(
        isRtl 
          ? `تمت استعادة القسم "${catName}" بنجاح وإعادته للأقسام النشطة ✨` 
          : `Category "${catName}" restored successfully ✨`
      );
      setTrashedCategories((prev) => prev.filter((c) => String(c.id) !== String(cat.id)));
      setTrashedCatCount((prev) => Math.max(0, prev - 1));
      await loadData();
      window.dispatchEvent(new CustomEvent('notification:received'));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل استعادة القسم' : 'Failed to restore category'));
    } finally {
      setRestoringCatId(null);
    }
  };

  // Fast apply mobile-optimized responsive preset to category
  const handleApplyCategoryPreset = async (cat, preset) => {
    try {
      setLoading(true);
      const res = await fetch(preset.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `${preset.key}_cover.jpg`, { type: 'image/jpeg' });
      
      const fd = new FormData();
      fd.append('name_ar', cat.nameAr || cat.name);
      fd.append('name_en', cat.nameEn || cat.name);
      fd.append('name', cat.nameAr || cat.name);
      if (cat.descriptionAr || cat.description) fd.append('description_ar', cat.descriptionAr || cat.description);
      if (cat.descriptionEn || cat.description) fd.append('description_en', cat.descriptionEn || cat.description);
      fd.append('image', file);

      await api.updateCategory(cat.id, fd);
      try {
        localStorage.setItem(`cafe90_cat_image_${cat.id}`, preset.imageUrl);
        if (cat.nameAr) localStorage.setItem(`cafe90_cat_image_${cat.nameAr}`, preset.imageUrl);
        if (cat.nameEn) localStorage.setItem(`cafe90_cat_image_${cat.nameEn}`, preset.imageUrl);
      } catch (e) {}

      toast.success(isRtl ? `تم تطبيق صورة "${preset.titleAr}" المتجاوبة للموبايل بنجاح ✨` : `Responsive image applied successfully ✨`);
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'تعذر تطبيق الصورة' : 'Failed to apply image'));
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  };

  // Form states
  const [catForm, setCatForm] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    imageUrl: '',
    active: true
  });

  const [subcatForm, setSubcatForm] = useState({
    categoryId: '',
    nameEn: '',
    nameAr: '',
    active: true
  });

  const normalizeCategory = (cat) => {
    const nameAr = cat.name_ar || cat.nameAr || (typeof cat.name === 'object' ? cat.name?.ar : (cat.name || '')) || '';
    const nameEn = cat.name_en || cat.nameEn || (typeof cat.name === 'object' ? cat.name?.en : (cat.name || '')) || '';
    const primaryName = isRtl ? (nameAr || nameEn || cat.name) : (nameEn || nameAr || cat.name);
    const secondaryName = isRtl ? (nameEn || '') : (nameAr || '');

    // Match with high-res responsive presets
    const matchedPreset = CATEGORY_PRESETS.find((p) =>
      p.categoryMatch.some((m) =>
        (nameAr && nameAr.toLowerCase().includes(m)) ||
        (nameEn && nameEn.toLowerCase().includes(m)) ||
        (primaryName && primaryName.toLowerCase().includes(m))
      )
    );

    let localCachedImg = null;
    try {
      localCachedImg = localStorage.getItem(`cafe90_cat_image_${cat.id}`) ||
                       localStorage.getItem(`cafe90_cat_image_${nameAr}`) ||
                       localStorage.getItem(`cafe90_cat_image_${nameEn}`);
    } catch (e) {}

    let imageUrl = localCachedImg || '';
    if (!imageUrl) {
      if (cat.image && typeof cat.image === 'string' && cat.image.trim()) {
        if (cat.image.startsWith('http') || cat.image.startsWith('data:')) {
          imageUrl = cat.image;
        } else {
          const cleanPath = cat.image.startsWith('/') ? cat.image.slice(1) : cat.image;
          imageUrl = `https://backend.ninety90degree.com/public/storage/${cleanPath}`;
        }
      } else if (cat.image_url && typeof cat.image_url === 'string' && cat.image_url.trim()) {
        imageUrl = cat.image_url;
      } else if (cat.imageUrl && typeof cat.imageUrl === 'string' && cat.imageUrl.trim()) {
        imageUrl = cat.imageUrl;
      }
    }

    // Auto-standardize preset images for known categories (Food, Beverages, Desserts, Offers)
    if (matchedPreset) {
      const isKnownCategory =
        (nameAr && (nameAr.includes('عروض') || nameAr.includes('حلويات') || nameAr.includes('المشروبات') || nameAr.includes('اكلات') || nameAr.includes('هدية') || nameAr.includes('هدايا'))) ||
        (nameEn && (nameEn.toLowerCase().includes('offer') || nameEn.toLowerCase().includes('deal') || nameEn.toLowerCase().includes('gift') || nameEn.toLowerCase().includes('candies') || nameEn.toLowerCase().includes('dessert') || nameEn.toLowerCase().includes('beverage') || nameEn.toLowerCase().includes('food')));

      if (isKnownCategory || !imageUrl || imageUrl.includes('default') || !localCachedImg || localCachedImg.includes('/storage/')) {
        imageUrl = matchedPreset.imageUrl;
        try {
          localStorage.setItem(`cafe90_cat_image_${cat.id}`, matchedPreset.imageUrl);
          if (nameAr) localStorage.setItem(`cafe90_cat_image_${nameAr}`, matchedPreset.imageUrl);
          if (nameEn) localStorage.setItem(`cafe90_cat_image_${nameEn}`, matchedPreset.imageUrl);
        } catch (e) {}
      }
    }

    const subcats = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    
    // Calculate items count if items are nested inside subcategories
    let totalItems = 0;
    if (Array.isArray(cat.items)) {
      totalItems += cat.items.length;
    }
    subcats.forEach((sub) => {
      if (Array.isArray(sub.items)) {
        totalItems += sub.items.length;
      }
    });

    const desc = cat.description || cat.description_ar || cat.description_en || '';

    return {
      id: cat.id,
      name: primaryName || (isRtl ? 'قسم رئيسي' : 'Category'),
      nameAr,
      nameEn,
      secondaryName,
      description: desc,
      descriptionAr: cat.description_ar || desc,
      descriptionEn: cat.description_en || desc,
      imageUrl: imageUrl || '',
      createdAt: cat.created_at || null,
      updatedAt: cat.updated_at || null,
      subcategories: subcats,
      subcategoriesCount: subcats.length,
      itemCount: totalItems || cat.items_count || cat.itemCount || 0,
      active: true
    };
  };

  // View Category Live Details via GET /categories/:id
  const handleViewCategory = async (cat) => {
    setViewingCategory(cat);
    setLoadingCatDetails(true);
    try {
      const fresh = await api.getCategoryById(cat.id);
      if (fresh) {
        setViewingCategory(normalizeCategory(fresh));
      }
    } catch (err) {
      console.warn('Live category fetch notice:', err?.message);
    } finally {
      setLoadingCatDetails(false);
    }
  };

  const normalizeSubcategory = (sub) => {
    const nameAr = sub.name_ar || sub.nameAr || (typeof sub.name === 'object' ? sub.name?.ar : (sub.name || '')) || '';
    const nameEn = sub.name_en || sub.nameEn || (typeof sub.name === 'object' ? sub.name?.en : (sub.name || '')) || '';
    const primaryName = isRtl ? (nameAr || nameEn || sub.name) : (nameEn || nameAr || sub.name);
    const secondaryName = isRtl ? (nameEn || '') : (nameAr || '');

    return {
      id: sub.id,
      categoryId: String(sub.category_id || sub.categoryId || ''),
      name: primaryName || (isRtl ? 'تصنيف فرعي' : 'Subcategory'),
      nameAr,
      nameEn,
      secondaryName,
      createdAt: sub.created_at || null,
      updatedAt: sub.updated_at || null,
      active: sub.active !== false && sub.is_active !== 0
    };
  };

  // View Subcategory Live Details via GET /subcategories/:id
  const handleViewSubcategory = async (sub) => {
    setViewingSubcategory(sub);
    setLoadingSubDetails(true);
    try {
      const fresh = await api.getSubcategoryById(sub.id);
      if (fresh) {
        setViewingSubcategory(normalizeSubcategory(fresh));
      }
    } catch (err) {
      console.warn('Live subcategory fetch notice:', err?.message);
    } finally {
      setLoadingSubDetails(false);
    }
  };

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial || categories.length === 0) {
        setLoading(true);
      }
      const [catsRes, subsRes] = await Promise.all([
        api.getCategories(),
        api.getSubcategories()
      ]);
      const cats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
      const subs = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);

      setCategories(cats.map(normalizeCategory));
      setSubcategories(subs.map(normalizeSubcategory));
      fetchTrashedCatCount();
    } catch (e) {
      toast.error(isRtl ? 'فشل تحميل بيانات الأقسام' : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(categories.length === 0);
  }, []);

  const handleOpenAddCat = () => {
    setEditingCategory(null);
    setCatImageFile(null);
    setCatForm({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      imageUrl: ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCategory(cat);
    setCatImageFile(null);
    setCatForm({
      nameEn: cat.nameEn || '',
      nameAr: cat.nameAr || '',
      descriptionEn: cat.descriptionEn || '',
      descriptionAr: cat.descriptionAr || '',
      imageUrl: cat.imageUrl || ''
    });
    setIsCategoryModalOpen(true);
  };

  // Auto-match and pre-select high-res preset when typing category name
  const handleCatNameInput = (field, val) => {
    setCatForm((prev) => {
      const next = { ...prev, [field]: val };
      if (!catImageFile && (!next.imageUrl || CATEGORY_PRESETS.some((p) => p.imageUrl === next.imageUrl))) {
        const found = CATEGORY_PRESETS.find((p) =>
          p.categoryMatch.some((m) =>
            (next.nameAr && next.nameAr.toLowerCase().includes(m)) ||
            (next.nameEn && next.nameEn.toLowerCase().includes(m))
          )
        );
        if (found) {
          next.imageUrl = found.imageUrl;
        }
      }
      return next;
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.nameAr && !catForm.nameEn) {
      toast.warning(isRtl ? 'اسم القسم مطلوب بالعربية أو الإنجليزية' : 'Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('name_ar', catForm.nameAr || catForm.nameEn);
      fd.append('name_en', catForm.nameEn || catForm.nameAr);
      fd.append('name', catForm.nameAr || catForm.nameEn);
      if (catForm.descriptionAr) fd.append('description_ar', catForm.descriptionAr);
      if (catForm.descriptionEn) fd.append('description_en', catForm.descriptionEn);
      if (catForm.descriptionAr || catForm.descriptionEn) {
        fd.append('description', catForm.descriptionAr || catForm.descriptionEn);
      }
      if (catImageFile) {
        fd.append('image', catImageFile);
      } else if (catForm.imageUrl && catForm.imageUrl.startsWith('/category_')) {
        try {
          const resImg = await fetch(catForm.imageUrl);
          const blob = await resImg.blob();
          const file = new File([blob], 'category_cover.jpg', { type: 'image/jpeg' });
          fd.append('image', file);
        } catch (e) {
          fd.append('image_url', catForm.imageUrl);
        }
      } else if (catForm.imageUrl && !catForm.imageUrl.startsWith('data:')) {
        fd.append('image_url', catForm.imageUrl);
      }

      let res = null;
      let savedCatData = null;
      if (editingCategory) {
        res = await api.updateCategory(editingCategory.id, fd);
        toast.success(res?.message || (isRtl ? 'تم تحديث القسم بنجاح' : 'Category updated successfully'));
        savedCatData = res?.category || res?.data?.category || res?.data || res;
      } else {
        res = await api.createCategory(fd);
        toast.success(res?.message || (isRtl ? 'تم إنشاء الفئة بنجاح' : 'Category created successfully'));
        savedCatData = res?.category || res?.data?.category || res?.data || res;
      }

      const targetId = savedCatData?.id || editingCategory?.id;
      if (targetId && catForm.imageUrl) {
        try {
          localStorage.setItem(`cafe90_cat_image_${targetId}`, catForm.imageUrl);
          if (catForm.nameAr) localStorage.setItem(`cafe90_cat_image_${catForm.nameAr}`, catForm.imageUrl);
          if (catForm.nameEn) localStorage.setItem(`cafe90_cat_image_${catForm.nameEn}`, catForm.imageUrl);
        } catch (err) {}
      }

      setIsCategoryModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حفظ القسم' : 'Failed to save category'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddSubcat = (categoryId = '') => {
    setEditingSubcategory(null);
    const targetCatId = categoryId || (categories[0]?.id ? String(categories[0].id) : '');
    setSubcatForm({
      categoryId: targetCatId,
      nameEn: '',
      nameAr: '',
      active: true
    });
    setIsSubcategoryModalOpen(true);
  };

  // Quick inline add subcategory right from the category card
  const handleQuickAddSubcategory = async (e, categoryId) => {
    e.preventDefault();
    const name = quickSubNames[categoryId]?.trim();
    if (!name) return;

    try {
      setSubmitting(true);
      const payload = {
        category_id: categoryId,
        name_ar: name,
        name_en: name,
        name: name
      };
      const res = await api.createSubcategory(payload);
      toast.success(res?.message || (isRtl ? `تمت إضافة التصنيف الفرعي "${name}" بنجاح ✨` : `Subcategory "${name}" added successfully ✨`));
      setQuickSubNames((prev) => ({ ...prev, [categoryId]: '' }));
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل إضافة التصنيف الفرعي' : 'Failed to add subcategory'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditSubcat = async (subcat) => {
    setEditingSubcategory(subcat);
    setSubcatForm({
      categoryId: String(subcat.categoryId || categories[0]?.id || ''),
      nameEn: subcat.nameEn || '',
      nameAr: subcat.nameAr || '',
      active: subcat.active !== false
    });
    setIsSubcategoryModalOpen(true);

    // Fetch live subcategory details from server (GET /subcategories/:id)
    try {
      const fresh = await api.getSubcategoryById(subcat.id);
      if (fresh) {
        const norm = normalizeSubcategory(fresh);
        setEditingSubcategory(norm);
        setSubcatForm({
          categoryId: String(norm.categoryId || subcat.categoryId || categories[0]?.id || ''),
          nameEn: norm.nameEn || '',
          nameAr: norm.nameAr || '',
          active: norm.active !== false
        });
      }
    } catch (err) {
      console.warn('Could not fetch latest subcategory edit data:', err?.message);
    }
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    const effectiveCategoryId = subcatForm.categoryId || (categories[0]?.id ? String(categories[0].id) : '');
    if ((!subcatForm.nameAr && !subcatForm.nameEn) || !effectiveCategoryId) {
      toast.warning(isRtl ? 'اسم التصنيف الفرعي والقسم الرئيسي مطلوبان' : 'Subcategory name and parent category are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category_id: effectiveCategoryId,
        name_ar: subcatForm.nameAr || subcatForm.nameEn,
        name_en: subcatForm.nameEn || subcatForm.nameAr,
        name: subcatForm.nameAr || subcatForm.nameEn
      };

      let res;
      if (editingSubcategory) {
        res = await api.updateSubcategory(editingSubcategory.id, payload);
        toast.success(res?.message || (isRtl ? 'تم تحديث التصنيف الفرعي بنجاح' : 'Subcategory updated successfully'));
        if (viewingSubcategory && viewingSubcategory.id === editingSubcategory.id) {
          setViewingSubcategory((prev) => ({
            ...prev,
            ...payload,
            categoryId: effectiveCategoryId
          }));
        }
      } else {
        res = await api.createSubcategory(payload);
        toast.success(res?.message || (isRtl ? 'تم إنشاء التصنيف الفرعي بنجاح' : 'Subcategory created successfully'));
      }
      setIsSubcategoryModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حفظ التصنيف الفرعي' : 'Failed to save subcategory'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    const target = deletingItem;
    if (target.type === 'cat') {
      setCategories(prev => prev.filter(c => String(c.id) !== String(target.item.id)));
    } else if (target.type === 'subcat') {
      setSubcategories(prev => prev.filter(s => String(s.id) !== String(target.item.id)));
    }
    setDeletingItem(null);

    try {
      setSubmitting(true);
      if (target.type === 'cat') {
        await api.deleteCategory(target.item.id);
        setTrashedCatCount(prev => prev + 1);
        toast.success(isRtl ? 'تم حذف القسم ونقله إلى سلة المحذوفات' : 'Category moved to recycle bin');
        window.dispatchEvent(new CustomEvent('notification:received'));
      } else if (target.type === 'subcat') {
        await api.deleteSubcategory(target.item.id);
        toast.success(isRtl ? 'تم حذف التصنيف الفرعي بنجاح' : 'Subcategory deleted successfully');
      }
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حذف العنصر' : 'Failed to delete item'));
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Filter categories and subcategories by search term
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchCat = (cat.nameAr && cat.nameAr.toLowerCase().includes(q)) ||
                     (cat.nameEn && cat.nameEn.toLowerCase().includes(q)) ||
                     (cat.name && cat.name.toLowerCase().includes(q));
    const catSubs = subcategories.filter((s) => String(s.categoryId) === String(cat.id));
    const matchSub = catSubs.some((s) => 
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q))
    );
    return matchCat || matchSub;
  });

  const orphanedSubcategories = subcategories.filter(
    (s) => !categories.some((c) => String(c.id) === String(s.categoryId))
  );

  const filteredSubcategories = subcategories.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (sub.nameAr && sub.nameAr.toLowerCase().includes(q)) ||
      (sub.nameEn && sub.nameEn.toLowerCase().includes(q)) ||
      (sub.name && sub.name.toLowerCase().includes(q))
    );
  });

  const handleDeleteAllOrphaned = async () => {
    if (!orphanedSubcategories.length) return;
    const confirmMsg = isRtl
      ? `هل أنت متأكد من حذف جميع التصنيفات الفرعية غير المرتبطة (${orphanedSubcategories.length}) نهائياً؟`
      : `Are you sure you want to delete all ${orphanedSubcategories.length} orphaned subcategories?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingAllOrphaned(true);
      await Promise.allSettled(orphanedSubcategories.map((s) => api.deleteSubcategory(s.id)));
      toast.success(isRtl ? 'تم حذف التصنيفات الفرعية بنجاح' : 'Orphaned subcategories deleted successfully');
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete subcategories'));
    } finally {
      setDeletingAllOrphaned(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="hidden sm:flex w-11 h-11 rounded-xl items-center justify-center shrink-0 ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/70">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-chocolate-900">
                {t('categoriesTitle', 'أقسام وتصنيفات القائمة')}
              </h2>
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
                {categories.length} {isRtl ? 'أقسام رئيسية' : 'Categories'}
              </span>
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200/70 text-xs font-semibold tabular-nums">
                {subcategories.length} {isRtl ? 'تصنيفات فرعية' : 'Subcategories'}
              </span>
            </div>
            <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
              {t('categoriesDesc', 'تنظيم وتصنيف المشروبات المختصة، المخبوزات الفرنسية، والمأكولات.')}
            </p>
          </div>
        </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="md"
              icon={Plus}
              onClick={() => handleOpenAddSubcat()}
            >
              {isRtl ? 'إضافة تصنيف فرعي' : 'Add Subcategory'}
            </Button>
            <Button
              variant="gold"
              size="md"
              icon={Plus}
              onClick={handleOpenAddCat}
            >
              {isRtl ? 'إضافة قسم رئيسي' : 'Add Category'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-stone-100">
          {/* Quick Search */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث في الأقسام والتصنيفات...' : 'Search categories & subs...'}
              className="w-full h-10 px-3 ps-10 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
            />
            <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            className="h-10 w-10 inline-flex items-center justify-center bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 rounded-xl shadow-2xs transition cursor-pointer"
            title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTrashModalOpen(true);
              loadTrashedCategories();
            }}
            className="inline-flex items-center gap-2 h-10 px-3.5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-sm font-semibold rounded-xl shadow-2xs transition cursor-pointer"
            title={isRtl ? 'عرض سلة محذوفات الأقسام' : 'View Trashed Categories'}
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>{isRtl ? 'سلة المحذوفات' : 'Recycle Bin'}</span>
            {trashedCatCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/70 font-semibold tabular-nums">
                {trashedCatCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="inline-flex items-center p-1 bg-stone-200/50 rounded-xl max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
              : 'font-medium text-stone-500 hover:text-chocolate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isRtl ? 'الأقسام الرئيسية' : 'Categories'}</span>
          <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
            activeTab === 'categories' ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
          }`}>
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subcategories')}
          className={`flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'subcategories'
              ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
              : 'font-medium text-stone-500 hover:text-chocolate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{isRtl ? 'كل التصنيفات الفرعية' : 'All Subcategories'}</span>
          <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
            activeTab === 'subcategories' ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
          }`}>
            {subcategories.length}
          </span>
        </button>
      </div>


      {/* Subcategories Dedicated Table View */}
      {activeTab === 'subcategories' && (
        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card overflow-hidden animate-fade-in">
          <div className="px-5 py-4 sm:px-6 border-b border-stone-200/70 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-chocolate-900">
                {isRtl ? 'قائمة جميع التصنيفات الفرعية' : 'All Subcategories List'}
              </h3>
              <p className="text-[13px] text-stone-500 mt-0.5">
                {isRtl ? 'عرض وإدارة وحذف جميع التصنيفات الفرعية المسجلة في القائمة' : 'View, edit and delete all registered subcategories'}
              </p>
            </div>
            <Button
              variant="gold"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenAddSubcat()}
            >
              {isRtl ? 'إضافة تصنيف فرعي جديد' : 'New Subcategory'}
            </Button>
          </div>

          {filteredSubcategories.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto text-lg">
                🏷️
              </div>
              <p className="text-sm text-chocolate-900 font-semibold">
                {isRtl ? 'لا توجد أي تصنيفات فرعية مسجلة حالياً' : 'No subcategories found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-[13px]">
                <thead className="bg-stone-50/80 border-b border-stone-200/70 text-xs text-stone-500">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold text-center w-12">#</th>
                    <th className="py-2.5 px-4 font-semibold text-start">{isRtl ? 'اسم التصنيف الفرعي' : 'Subcategory Name'}</th>
                    <th className="py-2.5 px-4 font-semibold text-start">{isRtl ? 'القسم الرئيسي التابع له' : 'Parent Category'}</th>
                    <th className="py-2.5 px-4 font-semibold text-start">{isRtl ? 'تاريخ الإنشاء' : 'Created Date'}</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-32">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredSubcategories.map((sub, idx) => {
                    const parentCat = categories.find((c) => String(c.id) === String(sub.categoryId));
                    return (
                      <tr key={sub.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 text-center tabular-nums text-stone-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-chocolate-900 text-[13px]">
                            {sub.name}
                          </div>
                          {sub.secondaryName && (
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              {sub.secondaryName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {parentCat ? (
                            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium bg-gold-50 text-gold-800 border border-gold-200/70">
                              <Layers className="w-3 h-3 text-gold-600" />
                              {parentCat.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                              ⚠️ {isRtl ? 'غير مرتبط بأي قسم' : 'Orphaned (No Category)'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-xs text-stone-500 whitespace-nowrap">
                          {formatDate(sub.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewSubcategory(sub)}
                              className="h-8 w-8 inline-flex items-center justify-center text-stone-500 hover:text-chocolate-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'عرض التفاصيل' : 'View details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSubcat(sub)}
                              className="h-8 w-8 inline-flex items-center justify-center text-stone-500 hover:text-chocolate-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'تعديل التصنيف' : 'Edit subcategory'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem({ type: 'subcat', item: sub })}
                              className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={isRtl ? 'حذف التصنيف الفرعي' : 'Delete subcategory'}
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <>
          {/* Loading Skeleton */}
          {loading && categories.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white rounded-2xl border border-stone-200/70 shadow-card animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-12 border border-stone-200/70 text-center space-y-4 shadow-card">
              <div className="w-11 h-11 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center mx-auto text-lg">
                📂
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-chocolate-900">
                  {isRtl ? 'لم يتم العثور على أقسام مضافة بعد' : 'No Categories Found'}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {isRtl
                    ? 'ابدأ بإضافة الأقسام الرئيسية وتصنيفاتها الفرعية لتنظيم أصناف ومشروبات كافيه 90'
                    : 'Start by creating main categories and subcategories for Cafe 90 menu'}
                </p>
              </div>
              <Button variant="gold" size="sm" icon={Plus} onClick={handleOpenAddCat}>
                {isRtl ? 'إضافة أول قسم الآن' : 'Create First Category'}
              </Button>
            </div>
          ) : (
            /* Categories Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {filteredCategories.map((cat) => {
            const catSubs = subcategories.filter((s) => String(s.categoryId) === String(cat.id));
            const matchedPreset = CATEGORY_PRESETS.find((p) =>
              p.categoryMatch.some((m) =>
                (cat.nameAr && cat.nameAr.toLowerCase().includes(m)) ||
                (cat.nameEn && cat.nameEn.toLowerCase().includes(m)) ||
                (cat.name && cat.name.toLowerCase().includes(m))
              )
            );

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Header Cover Image */}
                <div className="relative aspect-[16/7] sm:aspect-[2/1] w-full overflow-hidden bg-stone-900 rounded-t-2xl">
                  <img
                    src={cat.imageUrl || matchedPreset?.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    onError={(e) => {
                      const currentSrc = e.target.src;
                      if (matchedPreset && currentSrc !== matchedPreset.imageUrl) {
                        e.target.src = matchedPreset.imageUrl;
                        return;
                      }
                      try {
                        const cached = localStorage.getItem(`cafe90_cat_image_${cat.id}`) ||
                                       localStorage.getItem(`cafe90_cat_image_${cat.nameAr}`) ||
                                       localStorage.getItem(`cafe90_cat_image_${cat.nameEn}`) ||
                                       localStorage.getItem(`cafe90_cat_image_${cat.name}`);
                        if (cached && currentSrc !== cached) {
                          e.target.src = cached;
                          return;
                        }
                      } catch (err) {}

                      if (!e.target.dataset.tried1 && currentSrc.includes('/public/storage/')) {
                        e.target.dataset.tried1 = 'true';
                        e.target.src = currentSrc.replace('/public/storage/', '/storage/');
                        return;
                      }
                      if (!e.target.dataset.tried2 && currentSrc.includes('.com/storage/')) {
                        e.target.dataset.tried2 = 'true';
                        e.target.src = currentSrc.replace('.com/storage/', '.com/storage/app/public/');
                        return;
                      }
                      if (!e.target.dataset.tried3 && currentSrc.includes('.com/storage/')) {
                        e.target.dataset.tried3 = 'true';
                        e.target.src = currentSrc.replace('.com/storage/', '.com/public/storage/');
                        return;
                      }
                      e.target.onerror = null;
                      if (matchedPreset) {
                        e.target.src = matchedPreset.imageUrl;
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 start-3 flex items-center gap-1.5">
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-black/45 backdrop-blur text-white ring-1 ring-white/15 text-xs font-medium tabular-nums">
                      {cat.itemCount} {isRtl ? 'أصناف مسجلة' : 'items'}
                    </span>
                  </div>

                  {matchedPreset && cat.imageUrl !== matchedPreset.imageUrl && (
                    <div className="absolute top-3 end-3">
                      <button
                        type="button"
                        onClick={() => handleApplyCategoryPreset(cat, matchedPreset)}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-gradient-to-b from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-chocolate-950 font-semibold text-xs shadow-gold-glow transition cursor-pointer"
                        title={isRtl ? 'تطبيق صورة مقترحة عالية الجودة' : 'Apply HD image'}
                      >
                        <Sparkles className="w-3 h-3 text-chocolate-950" />
                        <span>{isRtl ? 'تحسين الصورة' : 'Apply HD'}</span>
                      </button>
                    </div>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-3 inset-x-4 flex items-end justify-between text-white">
                    <div>
                      <h3 className="text-lg font-bold leading-tight drop-shadow-sm">
                        {cat.name}
                      </h3>
                      {cat.secondaryName && (
                        <p className="text-xs text-white/80 font-medium mt-0.5">
                          {cat.secondaryName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subcategories & Quick-Add Area */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[13px] font-semibold text-chocolate-900">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gold-600" />
                        <span>{isRtl ? 'التصنيفات الفرعية' : 'Subcategories'}</span>
                        <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-stone-100 text-stone-600 text-[11px] font-semibold tabular-nums">
                          {catSubs.length}
                        </span>
                      </div>
                    </div>

                    {/* Subcategories Chips */}
                    {catSubs.length === 0 ? (
                      <p className="text-xs text-stone-500 py-1">
                        {isRtl ? 'لا توجد تصنيفات فرعية بعد — أضف من الحقل أدناه 👇' : 'No subcategories yet — add below 👇'}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {catSubs.map((sub) => (
                          <div
                            key={sub.id}
                            className="group/sub inline-flex items-center gap-1 h-8 ps-3 pe-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/70 text-xs font-medium text-chocolate-900 transition-colors"
                          >
                            <span className="me-0.5">{sub.name}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSubcat(sub)}
                              className="h-6 w-6 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-chocolate-800 hover:bg-white transition-colors cursor-pointer"
                              title={isRtl ? 'تعديل التصنيف الفرعي' : 'Edit subcategory'}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem({ type: 'subcat', item: sub })}
                              className="h-6 w-6 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={isRtl ? 'حذف التصنيف الفرعي' : 'Delete subcategory'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fast Inline Add Subcategory */}
                    <form
                      onSubmit={(e) => handleQuickAddSubcategory(e, cat.id)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        value={quickSubNames[cat.id] || ''}
                        onChange={(e) => setQuickSubNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                        placeholder={isRtl ? 'اسم تصنيف فرعي جديد (اضغط Enter)...' : 'New subcategory name (Enter)...'}
                        className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-white border border-stone-200 text-[13px] text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                      />
                      <button
                        type="submit"
                        disabled={!quickSubNames[cat.id]?.trim() || submitting}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-chocolate-900 hover:bg-chocolate-800 text-white text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إضافة' : 'Add'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingItem({ type: 'cat', item: cat })}
                      className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={isRtl ? 'حذف القسم الرئيسي' : 'Delete category'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewCategory(cat)}
                        title={isRtl ? 'عرض التفاصيل' : 'View details'}
                      >
                        {isRtl ? 'التفاصيل' : 'Details'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEditCat(cat)}
                        title={isRtl ? 'تعديل القسم' : 'Edit category'}
                      >
                        {isRtl ? 'تعديل' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Category Modal (Add / Edit) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? (isRtl ? "تعديل القسم" : "Edit Category") : (isRtl ? "إضافة قسم جديد للقائمة" : "Add Menu Category")}
        subtitle={isRtl ? "تحديد الاسم الإنجليزي والعربي وصورة الغلاف" : "Configure primary menu grouping for items"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={submitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveCategory}
              loading={submitting}
            >
              {editingCategory ? (isRtl ? "حفظ التعديلات" : "Save Changes") : (isRtl ? "إنشاء القسم" : "Create Category")}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'اسم القسم (بالعربية) *' : 'Category Name (Arabic) *'}
              </label>
              <input
                type="text"
                value={catForm.nameAr}
                onChange={(e) => handleCatNameInput('nameAr', e.target.value)}
                placeholder={isRtl ? "مثال: حلويات / المشروبات / اكلات" : "e.g. حلويات / المشروبات"}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'اسم القسم (بالإنجليزية - اختياري)' : 'Category Name (English - Optional)'}
              </label>
              <input
                type="text"
                value={catForm.nameEn}
                onChange={(e) => handleCatNameInput('nameEn', e.target.value)}
                placeholder={isRtl ? "مثال: Desserts / Beverages" : "e.g. Desserts / Beverages"}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'وصف القسم (بالعربية)' : 'Description (Arabic)'}
              </label>
              <textarea
                rows="2"
                dir="rtl"
                value={catForm.descriptionAr}
                onChange={(e) => setCatForm({ ...catForm, descriptionAr: e.target.value })}
                placeholder={isRtl ? "مثال: مشروبات ساقعة وساخنة..." : "e.g. مشروبات ساقعة وساخنة..."}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'وصف القسم (بالإنجليزية)' : 'Description (English)'}
              </label>
              <textarea
                rows="2"
                dir="ltr"
                value={catForm.descriptionEn}
                onChange={(e) => setCatForm({ ...catForm, descriptionEn: e.target.value })}
                placeholder="e.g. Hot and cold beverages..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Category Image Upload & Mobile Optimization */}
          <div className="space-y-3 rounded-xl border border-stone-200/70 p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-[13px] font-semibold text-chocolate-800">
                {isRtl ? 'صورة غلاف القسم (تلقائية التجاوب للموبايل 2:1)' : 'Category Cover Image (Auto-Mobile 2:1)'}
              </label>
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <Smartphone className="w-3 h-3" />
                <span>{isRtl ? 'متوافق مع أندرويد و iOS' : 'Android & iOS Ready'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-stone-200/70 bg-stone-100 shrink-0 flex items-center justify-center">
                {catForm.imageUrl ? (
                  <img
                    src={catForm.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-stone-400 m-auto" />
                )}
                {optimizingCatImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-gold-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setOptimizingCatImage(true);
                      const optimized = await optimizeImageForMobile(file, 'category');
                      setCatImageFile(optimized.file);
                      setCatForm((prev) => ({ ...prev, imageUrl: optimized.previewUrl }));
                      toast.success(
                        isRtl
                          ? 'تم تحسين وتنسيق الصورة تلقائياً لتناسب شاشات الموبايل (2:1 بدون قص عشوائي) ✨'
                          : 'Image optimized automatically for mobile screens (2:1 aspect ratio) ✨'
                      );
                    } catch (err) {
                      setCatImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (evt.target?.result) setCatForm((prev) => ({ ...prev, imageUrl: evt.target.result }));
                      };
                      reader.readAsDataURL(file);
                    } finally {
                      setOptimizingCatImage(false);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={optimizingCatImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 bg-chocolate-900 hover:bg-chocolate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold-400" />
                    <span>{optimizingCatImage ? (isRtl ? 'جاري التحسين...' : 'Optimizing...') : (isRtl ? 'رفع صورة (تحسين تلقائي للموبايل)' : 'Upload & Auto-Optimize')}</span>
                  </button>
                  {catForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatImageFile(null);
                        setCatForm({ ...catForm, imageUrl: '' });
                      }}
                      className="inline-flex items-center h-8 px-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      {isRtl ? 'حذف الصورة' : 'Clear'}
                    </button>
                  )}
                </div>

                <input
                  type="url"
                  value={catForm.imageUrl.startsWith('data:') ? '' : catForm.imageUrl}
                  onChange={(e) => setCatForm({ ...catForm, imageUrl: e.target.value })}
                  placeholder={catForm.imageUrl.startsWith('data:') ? (isRtl ? 'تم ضبط صورة مخصصة من الجهاز بنجاح' : 'Custom optimized image selected') : (isRtl ? 'أو أدخل رابط مباشر https://...' : 'Or paste image URL...')}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-stone-200 text-[13px] text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                />
              </div>
            </div>

            {/* Responsive Mobile Category Presets */}
            <div className="space-y-2.5 pt-3 border-t border-stone-200/70">
              <label className="text-[13px] font-semibold text-chocolate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                <span>{isRtl ? 'أو اختر من صور الأقسام الجاهزة المتوافقة مع شاشات الهواتف:' : 'Or choose a mobile-optimized preset:'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {CATEGORY_PRESETS.map((preset) => {
                  const isSelected = catForm.imageUrl === preset.imageUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={async () => {
                        setCatForm((prev) => ({ ...prev, imageUrl: preset.imageUrl }));
                        try {
                          const res = await fetch(preset.imageUrl);
                          const blob = await res.blob();
                          const f = new File([blob], `${preset.key}_cover.jpg`, { type: 'image/jpeg' });
                          setCatImageFile(f);
                        } catch (e) {}
                        toast.success(isRtl ? `تم اختيار صورة "${preset.titleAr}" المتجاوبة` : `Selected ${preset.titleEn}`);
                      }}
                      className={`p-2 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-gold-400 bg-gold-50/60 ring-4 ring-gold-400/15'
                          : 'border-stone-200/70 bg-white hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      <div className="w-12 h-9 rounded-lg overflow-hidden shrink-0 border border-stone-200/70 bg-chocolate-950">
                        <img src={preset.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block font-semibold text-xs text-chocolate-900 truncate">
                          {isRtl ? preset.titleAr : preset.titleEn}
                        </span>
                        <span className="text-[11px] text-stone-500 block truncate">
                          {preset.key === 'beverages'
                            ? (isRtl ? 'المشروبات والقهوة' : 'Beverages & Coffee')
                            : preset.key === 'food'
                            ? (isRtl ? 'المأكولات والبرنش' : 'Food & Brunch')
                            : preset.key === 'desserts'
                            ? (isRtl ? 'حلويات ومخبوزات' : 'Desserts & Pastries')
                            : (isRtl ? 'عروض وباقات خاصة' : 'Offers & Combos')}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-gold-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal (Add / Edit) */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={editingSubcategory ? (isRtl ? "تعديل التصنيف الفرعي" : "Edit Subcategory") : (isRtl ? "إضافة تصنيف فرعي جديد" : "Add Subcategory")}
        subtitle={isRtl ? "ربط تصنيف فرعي جديد بقسم رئيسي" : "Link secondary classification to a parent category"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubcategoryModalOpen(false)}
              disabled={submitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveSubcategory}
              loading={submitting}
            >
              {editingSubcategory ? (isRtl ? "حفظ التعديلات" : "Save Changes") : (isRtl ? "إنشاء التصنيف" : "Create Subcategory")}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'القسم الرئيسي *' : 'Parent Category *'}
            </label>
            {categories.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                {isRtl ? 'يرجى إنشاء قسم رئيسي أولاً قبل إضافة تصنيف فرعي.' : 'Please create a parent category first.'}
              </div>
            ) : (
              <select
                value={subcatForm.categoryId || (categories[0]?.id ? String(categories[0].id) : '')}
                onChange={(e) => setSubcatForm({ ...subcatForm, categoryId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition cursor-pointer"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr ? `${cat.nameAr} (${cat.nameEn || cat.name})` : (cat.nameEn || cat.name)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'اسم التصنيف الفرعي (بالعربية) *' : 'Subcategory Name (Arabic) *'}
            </label>
            <input
              type="text"
              value={subcatForm.nameAr}
              onChange={(e) => setSubcatForm({ ...subcatForm, nameAr: e.target.value })}
              placeholder={isRtl ? "مثال: تشيز كيك / دونتس" : "e.g. تشيز كيك"}
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'اسم التصنيف الفرعي (بالإنجليزية)' : 'Subcategory Name (English)'}
            </label>
            <input
              type="text"
              value={subcatForm.nameEn}
              onChange={(e) => setSubcatForm({ ...subcatForm, nameEn: e.target.value })}
              placeholder={isRtl ? "مثال: Cheesecake / Donuts" : "e.g. Cheesecake / Donuts"}
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
            />
          </div>
        </form>
      </Modal>

      {/* Live View Category Details Modal (GET /categories/:id) */}
      {viewingCategory && (
        <Modal
          isOpen={Boolean(viewingCategory)}
          onClose={() => setViewingCategory(null)}
          title={isRtl ? `تفاصيل القسم #${viewingCategory.id}: ${viewingCategory.name}` : `Category Details #${viewingCategory.id}: ${viewingCategory.name}`}
          subtitle={isRtl ? 'بيانات القسم المباشرة والتصنيفات والأصناف التابعة (GET /categories/:id)' : 'Live category data with subcategories & items from server'}
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="hidden sm:inline text-[11px] tabular-nums text-stone-400">
                Endpoint: /categories/{viewingCategory.id}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingCategory(null)}
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    const catId = viewingCategory.id;
                    setViewingCategory(null);
                    handleOpenAddSubcat(catId);
                  }}
                >
                  {isRtl ? 'إضافة فرعي' : 'Add Subcategory'}
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  icon={Edit2}
                  onClick={() => {
                    const cat = viewingCategory;
                    setViewingCategory(null);
                    handleOpenEditCat(cat);
                  }}
                >
                  {isRtl ? 'تعديل القسم' : 'Edit Category'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {loadingCatDetails && (
              <div className="h-10 px-3 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{isRtl ? 'جاري جلب أحدث بيانات القسم من السيرفر...' : 'Fetching latest live category data...'}</span>
              </div>
            )}

            {/* Category Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-stone-200/70 shadow-card flex flex-col sm:flex-row items-center gap-4 p-4">
              <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/70 shrink-0 flex items-center justify-center">
                {viewingCategory.imageUrl ? (
                  <img
                    src={viewingCategory.imageUrl}
                    alt={viewingCategory.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Coffee className="w-8 h-8 text-stone-400" />
                )}
                <span className="absolute top-1.5 start-1.5 inline-flex items-center h-5 px-1.5 rounded-full bg-black/45 backdrop-blur ring-1 ring-white/15 text-[11px] font-medium text-white tabular-nums">
                  #{viewingCategory.id}
                </span>
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-start">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-chocolate-900">
                    {viewingCategory.name}
                  </h3>
                  {viewingCategory.secondaryName && (
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-medium">
                      {viewingCategory.secondaryName}
                    </span>
                  )}
                </div>
                {viewingCategory.description && (
                  <p className="text-[13px] text-stone-500 line-clamp-2 leading-relaxed">
                    {viewingCategory.description}
                  </p>
                )}
              </div>
            </div>

            {/* Bilingual Names & Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70">
                    AR
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {isRtl ? 'الاسم والوصف بالعربية' : 'Arabic Name & Description'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-chocolate-900">
                  {viewingCategory.nameAr || viewingCategory.name || '—'}
                </p>
                <p className="text-[13px] text-stone-500 leading-relaxed">
                  {viewingCategory.descriptionAr || viewingCategory.description || (isRtl ? 'لا يوجد وصف مضاف' : 'No description')}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70">
                    EN
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {isRtl ? 'الاسم والوصف بالإنجليزية' : 'English Name & Description'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-chocolate-900">
                  {viewingCategory.nameEn || viewingCategory.name || '—'}
                </p>
                <p className="text-[13px] text-stone-500 leading-relaxed">
                  {viewingCategory.descriptionEn || viewingCategory.description || (isRtl ? 'No English description' : 'No description')}
                </p>
              </div>
            </div>

            {/* Timestamps & Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-white rounded-xl border border-stone-200/70 text-start">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'التصنيفات الفرعية' : 'Subcategories'}
                </span>
                <span className="block mt-1 text-lg leading-tight font-semibold text-chocolate-950 tabular-nums">
                  {viewingCategory.subcategories?.length || 0}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200/70 text-start">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'إجمالي الأصناف' : 'Total Items'}
                </span>
                <span className="block mt-1 text-lg leading-tight font-semibold text-gold-700 tabular-nums">
                  {viewingCategory.itemCount || 0}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200/70 text-start">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'تاريخ الإنشاء' : 'Created'}
                </span>
                <span className="block mt-1 text-[13px] font-semibold text-chocolate-900 tabular-nums">
                  {formatDate(viewingCategory.createdAt)}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200/70 text-start">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'آخر تحديث' : 'Updated'}
                </span>
                <span className="block mt-1 text-[13px] font-semibold text-chocolate-900 tabular-nums">
                  {formatDate(viewingCategory.updatedAt)}
                </span>
              </div>
            </div>

            {/* Nested Subcategories & Items Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                <div className="flex items-center gap-1.5 font-semibold text-chocolate-900 text-[13px]">
                  <Layers className="w-4 h-4 text-gold-600" />
                  <span>{isRtl ? 'التصنيفات الفرعية والأصناف التابعة لهذا القسم' : 'Subcategories & Attached Items'}</span>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {viewingCategory.subcategories?.length || 0} {isRtl ? 'تصنيف' : 'subs'}
                </span>
              </div>

              {(!viewingCategory.subcategories || viewingCategory.subcategories.length === 0) ? (
                <div className="p-6 rounded-xl border border-dashed border-stone-200 text-center bg-stone-50/50 space-y-2">
                  <Coffee className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">
                    {isRtl ? 'لا توجد تصنيفات فرعية مسجلة تحت هذا القسم حتى الآن.' : 'No subcategories linked to this category yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const catId = viewingCategory.id;
                      setViewingCategory(null);
                      handleOpenAddSubcat(catId);
                    }}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold text-gold-700 hover:bg-gold-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إضافة تصنيف فرعي جديد الآن' : 'Add subcategory now'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pe-1">
                  {viewingCategory.subcategories.map((sub) => {
                    const subItems = Array.isArray(sub.items) ? sub.items : [];
                    return (
                      <div key={sub.id} className="bg-stone-50/60 rounded-xl border border-stone-200/70 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold-500" />
                            <span className="font-semibold text-chocolate-900 text-[13px]">
                              {sub.name || sub.name_ar || sub.name_en}
                            </span>
                            <span className="text-[11px] text-stone-400 tabular-nums">
                              #{sub.id}
                            </span>
                          </div>
                          <span className="inline-flex items-center h-6 px-2 rounded-full bg-white border border-stone-200/70 text-xs font-medium text-stone-600 tabular-nums">
                            {subItems.length} {isRtl ? 'أصناف' : 'items'}
                          </span>
                        </div>

                        {subItems.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {subItems.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white p-2.5 rounded-xl border border-stone-200/70 flex items-center justify-between gap-2 shadow-2xs hover:border-stone-300 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200/70">
                                    {(item.image_url || item.image) ? (
                                      <img
                                        src={item.image_url || (item.image?.startsWith('http') ? item.image : `https://backend.ninety90degree.com/public/storage/${item.image?.replace(/^\//, '')}`)}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <Coffee className="w-4 h-4 text-stone-300 m-auto mt-2" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-chocolate-900 truncate text-xs">
                                      {item.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      {item.rating && Number(item.rating) > 0 && (
                                        <span className="text-amber-600 font-semibold flex items-center gap-0.5 tabular-nums">
                                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                          {item.rating}
                                        </span>
                                      )}
                                      {item.redeemable_with_points && (
                                        <span className="text-violet-600 font-semibold tabular-nums">
                                          {item.points_price || 150} pts
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-end shrink-0">
                                  <span className="text-xs font-semibold tabular-nums text-chocolate-900 block">
                                    EGP {item.final_price || item.price}
                                  </span>
                                  {(item.is_on_offer || item.offer_active) && item.offer_price && (
                                    <span className="inline-flex items-center h-5 px-1.5 mt-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                                      {isRtl ? 'عرض' : 'Offer'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-stone-400 px-1">
                            {isRtl ? 'لا توجد أصناف مضافة في هذا التصنيف الفرعي حالياً.' : 'No items added in this subcategory yet.'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Live View Subcategory Details Modal (GET /subcategories/:id) */}
      {viewingSubcategory && (
        <Modal
          isOpen={Boolean(viewingSubcategory)}
          onClose={() => setViewingSubcategory(null)}
          title={isRtl ? `تفاصيل التصنيف الفرعي #${viewingSubcategory.id}` : `Subcategory Details #${viewingSubcategory.id}`}
          subtitle={isRtl ? 'بيانات التصنيف الفرعي المباشرة من السيرفر (GET /subcategories/:id)' : 'Live subcategory data fetched directly from server'}
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="hidden sm:inline text-[11px] tabular-nums text-stone-400">
                Endpoint: /subcategories/{viewingSubcategory.id}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingSubcategory(null)}
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  icon={Edit2}
                  onClick={() => {
                    const target = viewingSubcategory;
                    setViewingSubcategory(null);
                    handleOpenEditSubcat(target);
                  }}
                >
                  {isRtl ? 'تعديل التصنيف' : 'Edit Subcategory'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {loadingSubDetails && (
              <div className="h-10 px-3 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{isRtl ? 'جاري جلب أحدث بيانات التصنيف الفرعي من السيرفر...' : 'Fetching latest live subcategory data...'}</span>
              </div>
            )}

            {/* Parent Category Card */}
            <div className="p-4 bg-white rounded-xl border border-stone-200/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block font-medium">
                    {isRtl ? 'القسم الرئيسي التابع له:' : 'Parent Category:'}
                  </span>
                  <span className="text-sm font-semibold text-chocolate-900">
                    {(() => {
                      const parent = categories.find(c => String(c.id) === String(viewingSubcategory.categoryId));
                      return parent ? (parent.nameAr || parent.nameEn || parent.name) : (isRtl ? `قسم #${viewingSubcategory.categoryId}` : `Category #${viewingSubcategory.categoryId}`);
                    })()}
                  </span>
                </div>
              </div>
              <Badge variant="gold">
                Category #{viewingSubcategory.categoryId}
              </Badge>
            </div>

            {/* Bilingual Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70">
                    AR
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {isRtl ? 'الاسم بالعربية' : 'Arabic Name'}
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-chocolate-900">
                  {viewingSubcategory.nameAr || viewingSubcategory.name || '—'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/70 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70">
                    EN
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    {isRtl ? 'الاسم بالإنجليزية' : 'English Name'}
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-chocolate-900">
                  {viewingSubcategory.nameEn || viewingSubcategory.name || '—'}
                </p>
              </div>
            </div>

            {/* Timestamps & Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-stone-50/80 rounded-xl border border-stone-200/70 text-xs text-stone-500 tabular-nums [&_strong]:font-semibold [&_strong]:text-chocolate-900">
              <span>{isRtl ? 'تاريخ الإنشاء:' : 'Created:'} <strong>{formatDate(viewingSubcategory.createdAt)}</strong></span>
              <span>{isRtl ? 'آخر تحديث:' : 'Updated:'} <strong>{formatDate(viewingSubcategory.updatedAt)}</strong></span>
              <span>ID: <strong>#{viewingSubcategory.id}</strong></span>
            </div>
          </div>
        </Modal>
      )}

      {/* Trashed Categories Modal (GET /api/admin/categories/trashed & POST /api/admin/categories/:id/restore) */}
      <Modal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        maxWidth="max-w-3xl"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200/60 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-chocolate-900">
                {isRtl ? 'سلة محذوفات الأقسام (Soft Deleted)' : 'Trashed Categories'}
              </h3>
              <p className="text-[13px] text-stone-500 font-normal mt-0.5">
                {isRtl ? 'الأقسام المحذوفة مؤقتاً، يمكنك استعادتها لتعود للقائمة فوراً' : 'Restore soft-deleted categories back to active catalog'}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {loadingTrashed ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
              <p className="text-xs font-medium text-stone-500">{isRtl ? 'جاري جلب الأقسام المحذوفة...' : 'Loading trashed categories...'}</p>
            </div>
          ) : trashedCategories.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/60 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-chocolate-900">{isRtl ? 'سلة محذوفات الأقسام فارغة' : 'No Trashed Categories'}</h4>
              <p className="text-xs text-stone-500">{isRtl ? 'لا توجد أي أقسام محذوفة حالياً.' : 'All categories are active.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {trashedCategories.map((cat) => {
                const namePrimary = isRtl ? (cat.name_ar || cat.nameAr || cat.name) : (cat.name_en || cat.nameEn || cat.name);
                const nameSecondary = isRtl ? (cat.name_en || cat.nameEn || '') : (cat.name_ar || cat.nameAr || '');
                const desc = isRtl ? (cat.description_ar || cat.description) : (cat.description_en || cat.description);
                const imageUrl = cat.image_url || cat.imageUrl || cat.image || '';
                const isRestoring = restoringCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-white rounded-xl border border-stone-200/70 flex items-center justify-between gap-3 hover:border-stone-300 hover:shadow-card transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200/70 flex items-center justify-center">
                        {imageUrl ? (
                          <img src={imageUrl} alt={namePrimary} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <Layers className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-[13px] font-semibold text-chocolate-900 truncate">{namePrimary}</h5>
                        {nameSecondary && <p className="text-[11px] text-stone-400 truncate">{nameSecondary}</p>}
                        {desc && <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{desc}</p>}
                        <span className="text-[11px] tabular-nums text-stone-400 mt-1 block">{formatDate(cat.deleted_at || cat.updated_at)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleRestoreCategory(cat)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? (isRtl ? 'جاري...' : 'Restoring...') : (isRtl ? 'استعادة' : 'Restore')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title={deletingItem?.type === 'cat' ? (isRtl ? "حذف القسم؟" : "Delete Category?") : (isRtl ? "حذف التصنيف الفرعي؟" : "Delete Subcategory?")}
        message={isRtl
          ? (deletingItem?.type === 'cat' ? `هل أنت متأكد من حذف قسم "${deletingItem?.item?.nameAr || deletingItem?.item?.name}"؟ سيتم حذف جميع التصنيفات الفرعية التابعة له.` : `هل أنت متأكد من حذف التصنيف الفرعي "${deletingItem?.item?.name}"؟`)
          : (deletingItem?.type === 'cat' ? `Are you sure you want to delete "${deletingItem?.item?.name}"? All attached subcategories will also be removed.` : `Are you sure you want to delete "${deletingItem?.item?.name}"?`)
        }
        loading={submitting}
      />
    </div>
  );
};
