import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Coffee,
  Sparkles,
  LayoutGrid,
  List,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Tag,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  X,
  Upload,
  Percent,
  Eye,
  Star,
  RefreshCw,
  Award,
  Smartphone,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { CustomSelect } from '../../common/CustomSelect';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { optimizeImageForMobile } from '../../../utils/imageOptimizer';

// Helper to normalize Arabic strings for accurate search matching
const normalizeArabicText = (text = '') => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel/diacritics
    .replace(/[أإآء]/g, 'ا') // Normalize Alef with hamza
    .replace(/ة/g, 'ه') // Normalize Taa Marbuta / Haa
    .replace(/[ىي]/g, 'ي') // Normalize Yaa / Alef Maksura
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[\s\-_]+/g, ' '); // Normalize spaces
};

// Helper to generate page navigation numbers with smart ellipsis
const getPageNumbers = (current, last) => {
  if (!last || last <= 1) return [1];
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < last - 2) {
    pages.push('...');
  }

  pages.push(last);
  return pages;
};

export const MenuItemsTable = ({ initialSearch = '', initialTab = 'all' }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);

  // View Mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [filterTab, setFilterTab] = useState(initialTab || 'all'); // 'all' | 'best_sellers' | 'offers' | 'points' | 'trashed'
  const [selectedStock, setSelectedStock] = useState('all');

  // Server-side & Client-side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    current_page: 1,
    currentPage: 1,
    page: 1,
    last_page: 1,
    lastPage: 1,
    total_pages: 1,
    totalPages: 1,
    per_page: 20,
    perPage: 20,
    limit: 20,
    total: 0,
    total_items: 0,
    totalItems: 0,
    from: 0,
    to: 0,
    has_more: false,
    hasMore: false
  });

  // Live View Item Modal (GET /items/:id)
  const [viewingItem, setViewingItem] = useState(null);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTab, setFormTab] = useState('basic'); // 'basic' | 'pricing' | 'customizations' | 'media'
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [trashedCount, setTrashedCount] = useState(0);
  const [restoringItemId, setRestoringItemId] = useState(null);

  // Date formatter
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

  // Helper to calculate discounted price
  const calculateFinalPrice = (price, discountVal, discountType) => {
    const p = Number(price) || 0;
    const d = Number(discountVal) || 0;
    if (d <= 0 || p <= 0) return p;
    if (discountType === 'percentage') {
      const discounted = p - (p * (d / 100));
      return Math.max(0, Math.round(discounted * 100) / 100);
    } else {
      return Math.max(0, Math.round((p - d) * 100) / 100);
    }
  };

  const [itemImageFile, setItemImageFile] = useState(null);
  const [optimizingItemImage, setOptimizingItemImage] = useState(false);

  // Beverage Customizations State (Matching Mobile Screen)
  const [hasSizes, setHasSizes] = useState(true);
  const [sizesList, setSizesList] = useState([
    { id: 's', nameAr: 'صغير', nameEn: 'Small', price: '35', isDefault: false },
    { id: 'm', nameAr: 'متوسط', nameEn: 'Medium', price: '45', isDefault: true },
    { id: 'l', nameAr: 'كبير', nameEn: 'Large', price: '55', isDefault: false }
  ]);
  const [hasSugarOptions, setHasSugarOptions] = useState(true);
  const [selectedSugarList, setSelectedSugarList] = useState(['بدون سكر', 'قليل', 'وسط', 'طبيعي', 'زيادة']);
  const [hasMilkOptions, setHasMilkOptions] = useState(true);
  const [selectedMilkList, setSelectedMilkList] = useState(['كامل الدسم', 'قليل الدسم', 'خالي الدسم', 'حليب الشوفان', 'حليب اللوز']);
  const [allowExtraNotes, setAllowExtraNotes] = useState(true);
  const [extraNotesHint, setExtraNotesHint] = useState('أضف أي تفاصيل أو نصائح إضافية...');
  const [addonsList, setAddonsList] = useState([
    { nameAr: 'شوت إسبريسو إضافي', nameEn: 'Extra Espresso Shot', price: '15' },
    { nameAr: 'صوص كراميل', nameEn: 'Caramel Sauce', price: '10' },
    { nameAr: 'كريمة مخفوقة', nameEn: 'Whipped Cream', price: '8' }
  ]);

  // Item Form state
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    categoryId: '',
    subcategoryId: '',
    price: '',
    offerPrice: '',
    offerActive: false,
    pointsPrice: '',
    redeemableWithPoints: false,
    featured: true,
    descriptionEn: '',
    descriptionAr: '',
    imageUrl: ''
  });

  const normalizeItem = (i) => {
    let localCachedImg = null;
    try {
      localCachedImg = localStorage.getItem(`cafe90_item_image_${i.id}`) ||
                       localStorage.getItem(`cafe90_item_image_${i.name_ar}`) ||
                       localStorage.getItem(`cafe90_item_image_${i.name_en}`) ||
                       localStorage.getItem(`cafe90_item_image_${i.name}`);
    } catch (e) {}

    let imageUrl = localCachedImg || '';
    if (!imageUrl) {
      if (i.image_url && typeof i.image_url === 'string' && i.image_url.trim()) {
        imageUrl = i.image_url;
      } else if (i.image && typeof i.image === 'string' && i.image.trim()) {
        if (i.image.startsWith('http') || i.image.startsWith('data:')) {
          imageUrl = i.image;
        } else {
          const cleanPath = i.image.startsWith('/') ? i.image.slice(1) : i.image;
          imageUrl = `https://backend.ninety90degree.com/public/storage/${cleanPath}`;
        }
      } else if (i.imageUrl && typeof i.imageUrl === 'string' && i.imageUrl.trim()) {
        imageUrl = i.imageUrl;
      }
    }

    const rawNameAr = i.name_ar || (typeof i.name === 'object' ? i.name?.ar : '') || (i.name && /[\u0600-\u06FF]/.test(i.name) ? i.name : '') || '';
    const rawNameEn = i.name_en || (typeof i.name === 'object' ? i.name?.en : '') || (i.name && !/[\u0600-\u06FF]/.test(i.name) ? i.name : '') || (i.name || '');

    let customConfig = null;
    try {
      const rawConfig = localStorage.getItem(`cafe90_item_config_${i.id}`) ||
                        localStorage.getItem(`cafe90_item_config_${rawNameAr}`) ||
                        localStorage.getItem(`cafe90_item_config_${rawNameEn}`);
      if (rawConfig) customConfig = JSON.parse(rawConfig);
    } catch (e) {}

    const rawPrice = Number(i.price) || 0;
    const isOfferActive = Boolean(
      (i.offer_active && i.offer_active !== '0' && i.offer_active !== 0 && i.offer_active !== 'false') ||
      (i.is_on_offer && i.is_on_offer !== '0' && i.is_on_offer !== 0 && i.is_on_offer !== 'false')
    );
    const offerPrice = isOfferActive && i.offer_price ? Number(i.offer_price) : null;
    const finalPrice = isOfferActive
      ? (i.final_price ? Number(i.final_price) : (offerPrice || rawPrice))
      : rawPrice;
    const discountValue = isOfferActive
      ? (i.discount_value || (offerPrice && offerPrice < rawPrice ? String(Math.round(((rawPrice - offerPrice) / rawPrice) * 100)) : ''))
      : '';

    return {
      id: i.id,
      name: isRtl ? (rawNameAr || rawNameEn || i.name) : (rawNameEn || rawNameAr || i.name),
      nameAr: rawNameAr,
      nameEn: rawNameEn,
      price: rawPrice,
      offerPrice,
      finalPrice,
      offerActive: isOfferActive,
      isOnOffer: isOfferActive,
      discountValue,
      discountType: i.discount_type || 'percentage',
      prepTime: i.prep_time || '4 mins',
      pointsPrice: i.points_price ? Number(i.points_price) : 0,
      redeemableWithPoints: Boolean(i.redeemable_with_points),
      totalOrdered: i.total_ordered ? Number(i.total_ordered) : (i.totalOrdered || 0),
      rating: i.rating || '4.5',
      reviewCount: i.review_count !== undefined ? Number(i.review_count) : 0,
      subcategoryId: String(i.subcategory_id || i.subcategoryId || i.subcategory?.id || ''),
      categoryId: String(i.category_id || i.subcategory?.category_id || ''),
      categoryName: isRtl ? (i.category?.name_ar || i.category?.name || '') : (i.category?.name_en || i.category?.name || ''),
      subcategoryName: isRtl ? (i.subcategory?.name_ar || i.subcategory?.name || '') : (i.subcategory?.name_en || i.subcategory?.name || ''),
      description: isRtl ? (i.description_ar || i.description) : (i.description_en || i.description),
      descriptionAr: i.description_ar || '',
      descriptionEn: i.description_en || '',
      imageUrl: imageUrl || '',
      featured: Boolean(i.featured || i.offer_active || (i.total_ordered && Number(i.total_ordered) > 0)),
      // Read availability from the backend (same fields the quick toggle sends); default to in stock
      stockStatus: (
        String(i.stock_status || '').toLowerCase() === 'out_of_stock' ||
        [false, 0, '0', 'false'].includes(i.is_available) ||
        [false, 0, '0', 'false'].includes(i.is_active)
      ) ? 'out_of_stock' : 'in_stock',
      createdAt: i.created_at || null,
      updatedAt: i.updated_at || null,
      customConfig: customConfig || null
    };
  };

  const normalizeSubcategory = (sub) => {
    const nameAr = sub.name_ar || sub.nameAr || (typeof sub.name === 'object' ? sub.name?.ar : (sub.name || '')) || '';
    const nameEn = sub.name_en || sub.nameEn || (typeof sub.name === 'object' ? sub.name?.en : (sub.name || '')) || '';
    const primaryName = isRtl ? (nameAr || nameEn || sub.name) : (nameEn || nameAr || sub.name);
    const catId = String(sub.category_id || sub.categoryId || sub.category?.id || '');

    return {
      id: String(sub.id),
      categoryId: catId,
      category_id: catId,
      name: primaryName || (isRtl ? 'تصنيف فرعي' : 'Subcategory'),
      nameAr,
      nameEn,
      name_ar: nameAr,
      name_en: nameEn,
      active: sub.active !== false && sub.is_active !== 0
    };
  };

  const normalizeCategory = (cat) => {
    const nameAr = cat.name_ar || cat.nameAr || (typeof cat.name === 'object' ? cat.name?.ar : (cat.name || '')) || '';
    const nameEn = cat.name_en || cat.nameEn || (typeof cat.name === 'object' ? cat.name?.en : (cat.name || '')) || '';
    return {
      id: String(cat.id),
      nameAr,
      nameEn,
      name_ar: nameAr,
      name_en: nameEn,
      name: isRtl ? (nameAr || nameEn || cat.name) : (nameEn || nameAr || cat.name)
    };
  };

  // Live View Item Details Modal (GET /items/:id)
  const handleViewItem = async (item) => {
    setViewingItem(item);
    setLoadingItemDetails(true);
    try {
      const fresh = await api.getItemById(item.id);
      if (fresh) {
        setViewingItem(normalizeItem(fresh));
      }
    } catch (err) {
      console.warn('Live item details fetch error:', err?.message);
    } finally {
      setLoadingItemDetails(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen || viewingItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, viewingItem]);

  const isFirstMount = useRef(true);

  const loadData = async (overrides = {}) => {
    try {
      setLoading(true);

      const activeTab = overrides.tab !== undefined ? overrides.tab : filterTab;
      const activePage = overrides.page !== undefined ? overrides.page : currentPage;
      const activePerPage = overrides.per_page !== undefined ? overrides.per_page : perPage;
      const activeSearch = overrides.search !== undefined ? overrides.search : debouncedSearch;
      const activeCategory = overrides.category_id !== undefined ? overrides.category_id : selectedCategory;
      const activeSubcategory = overrides.subcategory_id !== undefined ? overrides.subcategory_id : selectedSubcategory;

      let rawItems = [];
      let metaPagination = null;

      if (activeTab === 'best_sellers') {
        const res = await api.getBestSellers(50);
        rawItems = Array.isArray(res) ? res : (res?.items || res?.data || []);
      } else if (activeTab === 'points') {
        const res = await api.getItemsRedeemableWithPoints();
        rawItems = Array.isArray(res) ? res : (res?.items || res?.data || []);
      } else if (activeTab === 'offers') {
        const res = await api.getOffers();
        rawItems = Array.isArray(res) ? res : (res?.items || res?.data || []);
      } else if (activeTab === 'trashed') {
        const res = await api.getTrashedItems();
        rawItems = Array.isArray(res) ? res : (res?.items || res?.data || []);
      } else {
        // Main items endpoint with server-side query params matching backend specification
        const res = await api.getItems({
          search: activeSearch && activeSearch.trim() ? activeSearch.trim() : undefined,
          category_id: activeCategory !== 'all' ? activeCategory : undefined,
          subcategory_id: activeSubcategory !== 'all' ? activeSubcategory : undefined,
          page: activePage,
          per_page: activePerPage
        });
        rawItems = res?.items || [];
        metaPagination = res?.pagination || null;
      }

      // Concurrently fetch fresh categories and subcategories
      const [catsRes, subsRes] = await Promise.all([
        api.getCategories({ force: true }),
        api.getSubcategories({ force: true })
      ]);
      const rawCats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
      const rawSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);

      const cats = rawCats.map(normalizeCategory);
      const subs = rawSubs.map(normalizeSubcategory);
      const normalized = rawItems.map(normalizeItem);

      setItems(normalized);
      setCategories(cats);
      setSubcategories(subs);

      if (activeTab === 'all' && metaPagination) {
        setPagination(metaPagination);
      } else {
        const total = normalized.length;
        const lastPage = Math.max(1, Math.ceil(total / activePerPage));
        setPagination({
          current_page: activePage,
          currentPage: activePage,
          page: activePage,
          last_page: lastPage,
          lastPage: lastPage,
          total_pages: lastPage,
          totalPages: lastPage,
          per_page: activePerPage,
          perPage: activePerPage,
          limit: activePerPage,
          total,
          total_items: total,
          totalItems: total,
          from: total > 0 ? (activePage - 1) * activePerPage + 1 : 0,
          to: total > 0 ? Math.min(activePage * activePerPage, total) : 0,
          has_more: activePage < lastPage,
          hasMore: activePage < lastPage
        });
      }

      // Update trashed items counter
      if (activeTab === 'trashed') {
        setTrashedCount(rawItems.length);
      } else {
        api.getTrashedItems().then(tRes => {
          const tList = Array.isArray(tRes) ? tRes : (tRes?.data || []);
          setTrashedCount(tList.length);
        }).catch(() => {});
      }
    } catch (e) {
      toast.error(isRtl ? 'فشل تحميل قائمة الطعام' : 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Keep in sync with initialSearch from global search if provided
  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== searchQuery) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Keep in sync with initialTab if provided (e.g. from Dashboard Overview best sellers)
  useEffect(() => {
    if (initialTab && initialTab !== filterTab) {
      setFilterTab(initialTab);
      setCurrentPage(1);
      loadData({ tab: initialTab, page: 1 });
    }
  }, [initialTab]);

  // Debounce search query to fire search to backend after 300ms of user typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync debounced search to backend
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadData({ tab: initialTab || filterTab, page: 1, search: debouncedSearch });
      return;
    }
    setCurrentPage(1);
    loadData({ page: 1, search: debouncedSearch });
  }, [debouncedSearch]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setDebouncedSearch(searchQuery);
    setCurrentPage(1);
    loadData({ page: 1, search: searchQuery });
  };

  const handleTabChange = (tab) => {
    setFilterTab(tab);
    setCurrentPage(1);
    loadData({ tab, page: 1 });
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('all');
    setCurrentPage(1);
    loadData({ category_id: catId, subcategory_id: 'all', page: 1 });
  };

  const handleSubcategoryChange = (subId) => {
    setSelectedSubcategory(subId);
    setCurrentPage(1);
    loadData({ subcategory_id: subId, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (pagination.last_page || 1) || newPage === currentPage) return;
    setCurrentPage(newPage);
    loadData({ page: newPage });
  };

  const handlePerPageChange = (newPerPage) => {
    const val = Number(newPerPage);
    setPerPage(val);
    setCurrentPage(1);
    loadData({ per_page: val, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
    loadData({ search: '', page: 1 });
  };

  // Live multi-field search and filtering
  const displayedItems = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryTokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    return items.filter(item => {
      // 1. Search Query filtering (immediate on typing and matches backend results)
      if (queryTokens.length > 0) {
        const isBackendExactMatch = filterTab === 'all' && debouncedSearch && debouncedSearch.trim().toLowerCase() === rawQuery;

        if (!isBackendExactMatch) {
          const matchesAllTokens = queryTokens.every(token => {
            const normToken = normalizeArabicText(token);
            const rawToken = token;

            const itemNormName = normalizeArabicText(item.name);
            const itemNormNameAr = normalizeArabicText(item.nameAr);
            const itemRawNameEn = (item.nameEn || '').toLowerCase();
            const itemNormCat = normalizeArabicText(item.categoryName);
            const itemNormSub = normalizeArabicText(item.subcategoryName);
            const itemNormDesc = normalizeArabicText(item.description || item.descriptionAr);
            const itemPriceStr = String(item.price || '');

            return (
              itemNormName.includes(normToken) ||
              itemNormNameAr.includes(normToken) ||
              itemRawNameEn.includes(rawToken) ||
              itemNormCat.includes(normToken) ||
              itemNormSub.includes(normToken) ||
              itemNormDesc.includes(normToken) ||
              itemPriceStr.includes(rawToken)
            );
          });

          if (!matchesAllTokens) return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.categoryId && String(item.categoryId) !== String(selectedCategory)) {
        return false;
      }

      // 3. Subcategory Filter
      if (selectedSubcategory !== 'all' && item.subcategoryId && String(item.subcategoryId) !== String(selectedSubcategory)) {
        return false;
      }

      // 4. Stock Filter
      if (selectedStock === 'in_stock' && item.stockStatus !== 'in_stock') {
        return false;
      }
      if (selectedStock === 'out_of_stock' && item.stockStatus === 'in_stock') {
        return false;
      }

      // 5. Offers Tab Filter: ensure inactive offers do not show in offers tab
      if (filterTab === 'offers' && !item.isOnOffer && !item.offerActive) {
        return false;
      }

      return true;
    });
  }, [items, filterTab, searchQuery, debouncedSearch, selectedCategory, selectedSubcategory, selectedStock]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemImageFile(null);
    const initialCatId = categories[0]?.id ? String(categories[0].id) : '';
    const matchingSubs = subcategories.filter(s => String(s.categoryId) === String(initialCatId));
    const initialSubId = matchingSubs[0]?.id ? String(matchingSubs[0].id) : (subcategories[0]?.id ? String(subcategories[0].id) : '');

    setFormData({
      name: '',
      nameEn: '',
      nameAr: '',
      categoryId: initialCatId,
      subcategoryId: initialSubId,
      price: '45',
      offerPrice: '',
      offerActive: false,
      discountValue: '',
      discountType: 'percentage',
      prepTime: '4 mins',
      pointsPrice: '150',
      redeemableWithPoints: false,
      featured: false,
      descriptionEn: '',
      descriptionAr: '',
      imageUrl: ''
    });
    setHasSizes(false);
    setSizesList([]);
    setIsModalOpen(true);
    setFormTab('basic');
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setItemImageFile(null);
    setFormTab('basic');
    const nEn = item.nameEn || (item.name && !/[\u0600-\u06FF]/.test(item.name) ? item.name : '');
    const nAr = item.nameAr || (item.name && /[\u0600-\u06FF]/.test(item.name) ? item.name : '');

    // 1) Find the proper category:
    let effectiveCatId = categories.some(c => String(c.id) === String(item.categoryId))
      ? String(item.categoryId)
      : '';

    // If item.categoryId isn't in categories, check if item's subcategoryId belongs to a category
    if (!effectiveCatId && item.subcategoryId) {
      const parentSub = subcategories.find(s => String(s.id) === String(item.subcategoryId));
      if (parentSub && categories.some(c => String(c.id) === String(parentSub.categoryId))) {
        effectiveCatId = String(parentSub.categoryId);
      }
    }

    // Fallback to first available category
    if (!effectiveCatId && categories.length > 0) {
      effectiveCatId = String(categories[0].id);
    }

    // 2) Find the proper subcategory matching this category:
    const matchingSubs = subcategories.filter(s => String(s.categoryId) === String(effectiveCatId));
    const subMatches = matchingSubs.some(s => String(s.id) === String(item.subcategoryId));
    const effectiveSubId = subMatches
      ? String(item.subcategoryId)
      : (matchingSubs[0]?.id ? String(matchingSubs[0].id) : (subcategories[0]?.id ? String(subcategories[0].id) : ''));

    setFormData({
      name: nEn || item.name || '',
      nameEn: nEn || '',
      nameAr: nAr || '',
      categoryId: effectiveCatId,
      subcategoryId: effectiveSubId,
      price: (item.price || '').toString(),
      offerPrice: item.offerActive ? (item.offerPrice || '').toString() : '',
      offerActive: Boolean(item.offerActive),
      discountValue: item.offerActive ? (item.discountValue || '').toString() : '',
      discountType: item.discountType || 'percentage',
      prepTime: item.prepTime || '4 mins',
      pointsPrice: (item.pointsPrice || '').toString(),
      redeemableWithPoints: Boolean(item.redeemableWithPoints),
      featured: Boolean(item.featured),
      descriptionEn: item.descriptionEn || '',
      descriptionAr: item.descriptionAr || '',
      imageUrl: item.imageUrl || ''
    });

    let config = item.customConfig;
    if (!config) {
      try {
        const raw = localStorage.getItem(`cafe90_item_config_${item.id}`) ||
                    localStorage.getItem(`cafe90_item_config_${nAr}`) ||
                    localStorage.getItem(`cafe90_item_config_${nEn}`);
        if (raw) config = JSON.parse(raw);
      } catch (e) {}
    }

    const savedSizes = Array.isArray(config?.sizes) ? config.sizes : [];
    setHasSizes(Boolean(config?.hasSizes && savedSizes.length > 0));
    setSizesList(savedSizes);

    setIsModalOpen(true);
  };

  // Direct file upload with automatic mobile responsiveness (1:1 Retina square)
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning(isRtl ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)' : 'Please select a valid image file');
      return;
    }

    try {
      setOptimizingItemImage(true);
      const optimized = await optimizeImageForMobile(file, 'menuItem');
      setItemImageFile(optimized.file);
      setFormData((prev) => ({ ...prev, imageUrl: optimized.previewUrl }));
      toast.success(
        isRtl
          ? 'تم ضبط وتنسيق الصورة تلقائياً لتناسب شاشات الموبايل (مربعة 1:1 فائقة الوضوح لأندرويد وآيفون) ✨'
          : 'Image optimized for mobile displays (1:1 Retina square) ✨'
      );
    } catch {
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({ ...prev, imageUrl: event.target.result }));
          toast.success(isRtl ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setOptimizingItemImage(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if ((!formData.nameAr && !formData.nameEn && !formData.name) || !formData.price) {
      toast.warning(isRtl ? 'الاسم والسعر مطلوبان' : 'Name and price are required');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      if (formData.subcategoryId) {
        fd.append('subcategory_id', formData.subcategoryId);
      } else if (subcategories[0]?.id) {
        fd.append('subcategory_id', subcategories[0].id);
      }
      const nameAr = formData.nameAr || formData.nameEn || formData.name || '';
      const nameEn = formData.nameEn || formData.name || formData.nameAr || '';

      fd.append('name_ar', nameAr);
      fd.append('name_en', nameEn);
      fd.append('name', nameAr || nameEn);
      fd.append('title_ar', nameAr);
      fd.append('title_en', nameEn);
      fd.append('title', nameAr || nameEn);
      fd.append('price', formData.price);
      
      if (formData.offerActive) {
        fd.append('offer_active', '1');
        fd.append('is_on_offer', '1');
        fd.append('offer_price', formData.offerPrice || '');
        if (formData.discountValue) {
          fd.append('discount_value', formData.discountValue);
          fd.append('discount_type', formData.discountType || 'percentage');
        }
      } else {
        fd.append('offer_active', '0');
        fd.append('is_on_offer', '0');
        fd.append('offer_price', '');
        fd.append('discount_value', '');
      }
      if (formData.prepTime) {
        fd.append('prep_time', formData.prepTime);
      }
      if (formData.pointsPrice || formData.redeemableWithPoints) {
        fd.append('points_price', formData.pointsPrice || '');
        fd.append('redeemable_with_points', formData.redeemableWithPoints ? '1' : '0');
      }
      fd.append('description_ar', formData.descriptionAr || '');
      fd.append('description_en', formData.descriptionEn || '');
      fd.append('description', formData.descriptionAr || formData.descriptionEn || '');

      const validSizes = hasSizes ? sizesList.filter(s => (s.nameAr || s.nameEn || s.name) && s.price) : [];
      const configToSave = {
        hasSizes: Boolean(hasSizes && validSizes.length > 0),
        sizes: validSizes
      };

      if (hasSizes && validSizes.length > 0) {
        fd.append('sizes', JSON.stringify(validSizes));
      }
      fd.append('customizations', JSON.stringify(configToSave));

      if (itemImageFile) {
        fd.append('image', itemImageFile);
        fd.append('photo', itemImageFile);
        fd.append('item_image', itemImageFile);
        fd.append('cover_image', itemImageFile);
      } else if (formData.imageUrl && !formData.imageUrl.startsWith('data:')) {
        fd.append('image_url', formData.imageUrl);
      }

      let savedItemData = null;
      if (editingItem) {
        const res = await api.updateItem(editingItem.id, fd);
        toast.success(isRtl ? 'تم تحديث الصنف ومواصفاته بنجاح' : 'Item & customizations updated');
        savedItemData = res?.item || res?.data?.item || res?.data || res;
      } else {
        const res = await api.createItem(fd);
        toast.success(isRtl ? 'تمت إضافة الصنف الجديد ومواصفاته بنجاح' : 'New item created');
        savedItemData = res?.item || res?.data?.item || res?.data || res;
      }

      const targetId = savedItemData?.id || editingItem?.id;
      if (targetId) {
        try {
          localStorage.setItem(`cafe90_item_config_${targetId}`, JSON.stringify(configToSave));
          if (formData.nameAr) localStorage.setItem(`cafe90_item_config_${formData.nameAr}`, JSON.stringify(configToSave));
          if (formData.nameEn) localStorage.setItem(`cafe90_item_config_${formData.nameEn}`, JSON.stringify(configToSave));
          if (formData.imageUrl) {
            localStorage.setItem(`cafe90_item_image_${targetId}`, formData.imageUrl);
            if (formData.nameAr) localStorage.setItem(`cafe90_item_image_${formData.nameAr}`, formData.imageUrl);
            if (formData.nameEn) localStorage.setItem(`cafe90_item_image_${formData.nameEn}`, formData.imageUrl);
          }
        } catch (e) {}
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حفظ الصنف' : 'Failed to save menu item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    const itemToDelete = deletingItem;
    // Optimistic removal: remove immediately so UI doesn't flicker or delay
    setItems(prev => prev.filter(it => String(it.id) !== String(itemToDelete.id)));
    setDeletingItem(null);

    try {
      setSubmitting(true);
      await api.deleteItem(itemToDelete.id);
      try {
        localStorage.removeItem(`cafe90_item_image_${itemToDelete.id}`);
        if (itemToDelete.nameAr) localStorage.removeItem(`cafe90_item_image_${itemToDelete.nameAr}`);
        if (itemToDelete.nameEn) localStorage.removeItem(`cafe90_item_image_${itemToDelete.nameEn}`);
      } catch (e) {}
      toast.success(
        isRtl 
          ? `تم حذف الصنف "${itemToDelete.nameAr || itemToDelete.name}" ونقله إلى سلة المحذوفات` 
          : `Item "${itemToDelete.name}" moved to recycle bin`
      );
      setTrashedCount((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent('notification:received'));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل حذف الصنف من السيرفر' : 'Failed to delete item'));
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Restore Soft-Deleted Item (POST /api/admin/items/:id/restore)
  const handleRestoreItem = async (item) => {
    try {
      setRestoringItemId(item.id);
      await api.restoreItem(item.id);
      const itemName = isRtl ? (item.nameAr || item.name) : (item.nameEn || item.name);
      toast.success(
        isRtl
          ? `تمت استعادة الصنف "${itemName}" بنجاح وإعادته للقائمة ✨`
          : `Item "${itemName}" restored successfully ✨`
      );
      setItems((prev) => prev.filter((it) => String(it.id) !== String(item.id)));
      setTrashedCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notification:received'));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل استعادة الصنف' : 'Failed to restore item'));
    } finally {
      setRestoringItemId(null);
    }
  };

  const handleQuickToggleStock = async (item) => {
    const newStatus = item.stockStatus === 'in_stock' ? 'out_of_stock' : 'in_stock';
    const isAvail = newStatus === 'in_stock';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, stockStatus: newStatus } : it))
    );

    try {
      const fd = new FormData();
      fd.append('is_available', isAvail ? '1' : '0');
      fd.append('is_active', isAvail ? '1' : '0');
      fd.append('stock_status', newStatus);
      await api.updateItem(item.id, fd);
      toast.success(
        isRtl
          ? `تم تحديث حالة الصنف "${item.nameAr || item.name}" إلى: ${isAvail ? 'متوفر' : 'غير متوفر'}`
          : `Item marked as ${isAvail ? 'In Stock' : 'Out of Stock'}`
      );
    } catch (err) {
      toast.error(isRtl ? 'تعذر تحديث حالة التوفر على السيرفر' : 'Failed to update stock status on server');
      loadData();
    }
  };

  // Quick Toggle Offer (POST /items/:id?_method=PUT)
  const handleQuickToggleOffer = async (item) => {
    const willActivate = !item.offerActive;
    let targetOfferPrice = item.offerPrice;
    if (willActivate && (!targetOfferPrice || Number(targetOfferPrice) <= 0)) {
      targetOfferPrice = Math.max(1, Math.round(Number(item.price) * 0.8));
    }

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? {
              ...it,
              offerActive: willActivate,
              isOnOffer: willActivate,
              offerPrice: willActivate ? targetOfferPrice : null,
              discountValue: willActivate ? it.discountValue : '',
              finalPrice: willActivate ? Number(targetOfferPrice) : Number(it.price)
            }
          : it
      )
    );
    if (viewingItem && viewingItem.id === item.id) {
      setViewingItem((prev) => ({
        ...prev,
        offerActive: willActivate,
        isOnOffer: willActivate,
        offerPrice: willActivate ? targetOfferPrice : null,
        discountValue: willActivate ? prev.discountValue : '',
        finalPrice: willActivate ? Number(targetOfferPrice) : Number(prev.price)
      }));
    }

    try {
      if (willActivate) {
        await api.setItemOffer(item.id, targetOfferPrice, true);
        toast.success(isRtl ? `تم تفعيل العرض بنجاح بسعر ${targetOfferPrice} ج.م` : `Offer activated at ${targetOfferPrice} EGP`);
      } else {
        await api.deactivateItemOffer(item.id);
        toast.success(isRtl ? 'تم إلغاء تفعيل العرض بنجاح' : 'Offer deactivated');
      }
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تحديث حالة العرض' : 'Failed to update offer'));
      loadData();
    }
  };

  // Quick Toggle Redeemable With Points (POST /items/:id?_method=PUT)
  const handleQuickTogglePoints = async (item) => {
    const willRedeem = !item.redeemableWithPoints;
    const targetPoints = item.pointsPrice || 150;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, redeemableWithPoints: willRedeem, pointsPrice: targetPoints }
          : it
      )
    );
    if (viewingItem && viewingItem.id === item.id) {
      setViewingItem((prev) => ({
        ...prev,
        redeemableWithPoints: willRedeem,
        pointsPrice: targetPoints
      }));
    }

    try {
      await api.toggleItemRedeemablePoints(item.id, targetPoints, willRedeem);
      toast.success(
        isRtl
          ? (willRedeem ? `تم تفعيل الاستبدال بـ ${targetPoints} نقطة` : 'تم إيقاف الاستبدال بالنقاط')
          : `Points redemption ${willRedeem ? 'enabled' : 'disabled'}`
      );
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تحديث حالة النقاط' : 'Failed to update points'));
      loadData();
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => String(c.id) === String(catId));
    if (!cat) return isRtl ? 'صنف مميز' : 'Specialty Item';
    return isRtl ? (cat.name_ar || cat.nameAr || cat.name || cat.name_en) : (cat.name_en || cat.nameEn || cat.name || cat.name_ar);
  };

  return (
    <div className="space-y-5 w-full animate-fade-in">
      {/* Page Intro Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-chocolate-900">
              {t('menuManagementTitle', 'إدارة قائمة المشروبات والمأكولات')}
            </h2>
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
              {pagination.total || displayedItems.length} {isRtl ? 'صنف مسجل' : 'Items'}
            </span>
          </div>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed max-w-2xl">
            {t('menuSubtitle', 'التحكم في الأسعار (بالجنيه المصري)، حالة المخزون، القيم الغذائية، والأصناف المميزة.')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 w-full sm:w-auto rounded-xl bg-gradient-to-b from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-chocolate-950 text-sm font-semibold shadow-gold-glow ring-1 ring-inset ring-gold-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>{t('addNewItem', 'إضافة صنف جديد')}</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs Row */}
      <div className="w-full overflow-x-auto">
        <div className="inline-flex items-center gap-0.5 p-1 bg-stone-200/50 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`h-8 px-3 rounded-lg text-[13px] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <Coffee className={`w-3.5 h-3.5 ${filterTab === 'all' ? 'text-gold-600' : ''}`} />
            <span>{isRtl ? 'كافة الأصناف' : 'All Items'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('best_sellers')}
            className={`h-8 px-3 rounded-lg text-[13px] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterTab === 'best_sellers'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${filterTab === 'best_sellers' ? 'text-orange-500' : ''}`} />
            <span>{isRtl ? 'الأكثر مبيعاً' : 'Best Sellers'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('offers')}
            className={`h-8 px-3 rounded-lg text-[13px] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterTab === 'offers'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <Tag className={`w-3.5 h-3.5 ${filterTab === 'offers' ? 'text-rose-500' : ''}`} />
            <span>{isRtl ? 'العروض والخصومات' : 'Offers'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('points')}
            className={`h-8 px-3 rounded-lg text-[13px] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterTab === 'points'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterTab === 'points' ? 'text-violet-500' : ''}`} />
            <span>{isRtl ? 'استبدال بالنقاط' : 'Redeemable with Points'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('trashed')}
            className={`h-8 px-3 rounded-lg text-[13px] transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              filterTab === 'trashed'
                ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                : 'font-medium text-stone-500 hover:text-chocolate-900'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${filterTab === 'trashed' ? 'text-rose-500' : ''}`} />
            <span>{isRtl ? 'سلة المحذوفات' : 'Recycle Bin'}</span>
            {trashedCount > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums ${
                filterTab === 'trashed' ? 'bg-rose-100 text-rose-700' : 'bg-stone-200/70 text-stone-600'
              }`}>
                {trashedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit(e);
              }
            }}
            placeholder={isRtl ? "ابحث بالاسم، المكونات، الوصف..." : "Search items, ingredients, Arabic title..."}
            className="w-full h-10 ps-10 pe-9 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
          />
          {loading && searchQuery ? (
            <RefreshCw className="w-4 h-4 text-gold-500 animate-spin absolute top-1/2 -translate-y-1/2 start-3.5" />
          ) : (
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="absolute top-1/2 -translate-y-1/2 start-3.5 text-stone-400 hover:text-gold-600 transition-colors cursor-pointer"
              title={isRtl ? 'بحث' : 'Search'}
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute top-1/2 -translate-y-1/2 end-2 h-6 w-6 inline-flex items-center justify-center text-stone-400 hover:text-chocolate-900 hover:bg-stone-100 rounded-md cursor-pointer transition-colors"
              title={isRtl ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">

          {/* Category Filter (GET /items?category_id=...) */}
          <div className="w-full sm:w-44">
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => handleCategoryChange(val)}
              options={[
                { value: 'all', label: `${t('allCategories', 'كافة الأقسام')} (${categories.length})` },
                ...categories.map((c) => ({
                  value: c.id,
                  label: isRtl ? (c.name_ar || c.nameAr || c.name || c.name_en) : (c.name_en || c.nameEn || c.name || c.name_ar)
                }))
              ]}
              isRtl={isRtl}
              searchPlaceholder={isRtl ? 'بحث في الأقسام...' : 'Search categories...'}
            />
          </div>

          {/* Subcategory Filter (GET /items?subcategory_id=...) */}
          <div className="w-full sm:w-52">
            <CustomSelect
              value={selectedSubcategory}
              onChange={(val) => handleSubcategoryChange(val)}
              options={[
                { value: 'all', label: `${isRtl ? 'كافة التصنيفات الفرعية' : 'All Subcategories'} (${subcategories.length})` },
                ...subcategories
                  .filter((s) => selectedCategory === 'all' || String(s.categoryId || s.category_id) === String(selectedCategory))
                  .map((s) => ({
                    value: s.id,
                    label: isRtl ? (s.nameAr || s.name || s.name_ar) : (s.nameEn || s.name || s.name_en)
                  }))
              ]}
              isRtl={isRtl}
              searchPlaceholder={isRtl ? 'بحث في التصنيفات...' : 'Search subcategories...'}
            />
          </div>

          {/* View Toggle Buttons */}
          <div className="inline-flex items-center p-1 bg-stone-200/50 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-chocolate-900' : 'text-stone-500 hover:text-chocolate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-chocolate-900' : 'text-stone-500 hover:text-chocolate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading && items.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-card animate-pulse w-full space-y-3">
          <div className="h-9 bg-stone-100 rounded-lg w-full" />
          <div className="h-12 bg-stone-100/80 rounded-lg w-full" />
          <div className="h-12 bg-stone-100/70 rounded-lg w-full" />
          <div className="h-12 bg-stone-100/60 rounded-lg w-full" />
        </div>
      ) : displayedItems.length === 0 ? (
        searchQuery.trim() ? (
          /* Search Empty State */
          <div className="bg-white rounded-2xl px-6 py-12 sm:py-14 border border-stone-200/70 shadow-card text-center space-y-4 w-full animate-fade-in">
            <div className="relative w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
              <span className="absolute -bottom-1 -end-1 w-4 h-4 rounded-full bg-rose-500 text-white ring-2 ring-white flex items-center justify-center text-[9px] font-bold">
                ✕
              </span>
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-chocolate-900">
                {isRtl ? `المنتج «${searchQuery.trim()}» غير موجود في القائمة` : `Item "${searchQuery.trim()}" is not found`}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {isRtl
                  ? `لم نتمكن من العثور على أي صنف مسجل بهذا الاسم. يمكنك التأكد من كتابة الاسم أو إضافته مباشرة كصنف جديد في القائمة.`
                  : `No menu items matched your search. You can verify the name or add it as a new menu item.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <Button
                variant="gold"
                size="sm"
                icon={Plus}
                onClick={() => {
                  handleOpenAdd();
                  setFormData(prev => ({
                    ...prev,
                    nameAr: searchQuery.trim(),
                    name: searchQuery.trim()
                  }));
                }}
              >
                {isRtl ? `إضافة «${searchQuery.trim()}» كصنف جديد` : `Add "${searchQuery.trim()}" as New Item`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
              >
                {isRtl ? 'مسح البحث وعرض كل الأصناف' : 'Clear Search & Show All'}
              </Button>
            </div>
          </div>
        ) : (
          /* Generic Filter Empty State */
          <div className="bg-white rounded-2xl px-6 py-12 border border-stone-200/70 shadow-card text-center space-y-3 w-full">
            <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-chocolate-900">{isRtl ? 'لا توجد أصناف في هذا القسم' : 'No menu items found'}</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto !mt-1">
              {isRtl ? 'لم نتمكن من العثور على أصناف تطابق الفلاتر المحددة حالياً.' : 'No items matched your current filters.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
                setSelectedCategory('all');
                setSelectedSubcategory('all');
                setSelectedStock('all');
                setCurrentPage(1);
                loadData({ search: '', category_id: 'all', subcategory_id: 'all', page: 1 });
              }}
            >
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </Button>
          </div>
        )
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-start text-[13px]">
              <thead className="bg-stone-50/80 text-stone-500 text-xs border-b border-stone-200/70">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5 font-semibold text-start">{isRtl ? 'الصنف' : 'Item'}</th>
                  <th className="py-2.5 px-4 font-semibold text-start">{isRtl ? 'القسم' : 'Category'}</th>
                  <th className="py-2.5 px-4 font-semibold text-start">{isRtl ? 'السعر' : 'Price'}</th>
                  <th className="py-2.5 px-4 font-semibold text-start">{isRtl ? 'التوفر' : 'Availability'}</th>
                  <th className="py-2.5 px-4 sm:px-5 font-semibold text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {displayedItems.map((item) => {
                  const isOfferActive = Boolean(item.isOnOffer || item.offerActive);
                  const hasDiscount = isOfferActive && (
                    Number(item.discountValue) > 0 ||
                    (item.offerPrice && Number(item.offerPrice) > 0 && Number(item.offerPrice) < Number(item.price))
                  );
                  const finalPrice = isOfferActive
                    ? (Number(item.discountValue) > 0
                        ? calculateFinalPrice(item.price, item.discountValue, item.discountType)
                        : (item.offerPrice && Number(item.offerPrice) > 0 ? Number(item.offerPrice) : Number(item.price)))
                    : Number(item.price);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors group">
                      {/* 1. Item Details */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-11 h-11 rounded-xl object-cover bg-stone-100 ring-1 ring-stone-200/70 shrink-0"
                            onError={(e) => {
                              const currentSrc = e.target.src;
                              try {
                                const cached = localStorage.getItem(`cafe90_item_image_${item.id}`) ||
                                               localStorage.getItem(`cafe90_item_image_${item.nameAr}`) ||
                                               localStorage.getItem(`cafe90_item_image_${item.nameEn}`) ||
                                               localStorage.getItem(`cafe90_item_image_${item.name}`);
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
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-chocolate-900 text-sm">
                                {isRtl && item.nameAr ? item.nameAr : item.name}
                              </span>
                              {item.isOnOffer && (
                                <span className="inline-flex items-center h-5 px-1.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                                  {isRtl ? 'عرض خاص' : 'Offer'}
                                </span>
                              )}
                              {item.featured && (
                                <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                                  <Sparkles className="w-3 h-3" />
                                  <span>{isRtl ? 'مميز' : 'Featured'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 truncate mt-0.5">
                              {isRtl ? item.name : (item.nameAr || '')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category & Subcategory */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium text-chocolate-800 bg-stone-100 border border-stone-200/70 whitespace-nowrap">
                            {getCategoryName(item.categoryId)}
                          </span>
                          {item.subcategoryName && (
                            <span className="text-[11px] text-stone-500">
                              {item.subcategoryName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Price & Discount */}
                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-2 whitespace-nowrap">
                          <span className="font-semibold text-chocolate-900 text-sm tabular-nums">
                            {finalPrice} <span className="text-[11px] font-medium text-stone-400">{isRtl ? 'ج.م' : 'EGP'}</span>
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-stone-400 line-through tabular-nums">
                              {item.price} {isRtl ? 'ج.م' : 'EGP'}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="inline-flex items-center h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums text-rose-700 bg-rose-50 border border-rose-200/70">
                              -{item.discountValue || Math.round(((Number(item.price) - Number(finalPrice)) / Number(item.price)) * 100)}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Availability Toggle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            size="sm"
                            checked={item.stockStatus === 'in_stock'}
                            onChange={() => handleQuickToggleStock(item)}
                            ariaLabel={isRtl ? 'حالة التوفر' : 'Availability'}
                          />
                          <span className={`text-xs font-medium whitespace-nowrap ${item.stockStatus === 'in_stock' ? 'text-emerald-700' : 'text-stone-400'}`}>
                            {item.stockStatus === 'in_stock'
                              ? (isRtl ? 'متوفر' : 'In Stock')
                              : (isRtl ? 'غير متوفر' : 'Out of Stock')}
                          </span>
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td className="py-3 px-4 sm:px-5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {filterTab === 'trashed' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={RotateCcw}
                              className="!bg-emerald-600 hover:!bg-emerald-700 text-white cursor-pointer"
                              disabled={restoringItemId === item.id}
                              onClick={() => handleRestoreItem(item)}
                            >
                              {restoringItemId === item.id ? (isRtl ? 'جاري الاستعادة...' : 'Restoring...') : (isRtl ? 'استعادة' : 'Restore')}
                            </Button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleViewItem(item)}
                                className="h-8 w-8 inline-flex items-center justify-center text-stone-500 hover:text-chocolate-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                                title={isRtl ? 'معاينة الصنف' : 'View Item'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="h-8 px-3 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 font-semibold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                title={isRtl ? 'تعديل الصنف' : 'Edit Item'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={isRtl ? 'حذف الصنف' : 'Delete Item'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
          {displayedItems.map((item) => {
            const isOfferActive = Boolean(item.isOnOffer || item.offerActive);
            const hasDiscount = isOfferActive && (
              Number(item.discountValue) > 0 ||
              (item.offerPrice && Number(item.offerPrice) > 0 && Number(item.offerPrice) < Number(item.price))
            );
            const finalPrice = isOfferActive
              ? (Number(item.discountValue) > 0
                  ? calculateFinalPrice(item.price, item.discountValue, item.discountType)
                  : (item.offerPrice && Number(item.offerPrice) > 0 ? Number(item.offerPrice) : Number(item.price)))
              : Number(item.price);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden rounded-t-2xl">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const currentSrc = e.target.src;
                      try {
                        const cached = localStorage.getItem(`cafe90_item_image_${item.id}`) ||
                                       localStorage.getItem(`cafe90_item_image_${item.nameAr}`) ||
                                       localStorage.getItem(`cafe90_item_image_${item.nameEn}`) ||
                                       localStorage.getItem(`cafe90_item_image_${item.name}`);
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
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                    {hasDiscount && (
                      <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-semibold tabular-nums bg-rose-600 text-white ring-1 ring-white/15">
                        -{item.discountValue || Math.round(((Number(item.price) - Number(finalPrice)) / Number(item.price)) * 100)}%
                      </span>
                    )}
                    {isOfferActive && (
                      <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15">
                        {isRtl ? 'عرض' : 'Offer'}
                      </span>
                    )}
                  </div>

                  {/* Bottom bar on image */}
                  <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-white">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-semibold tabular-nums">
                        {finalPrice} <span className="text-xs font-medium text-white/80">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-white/70 line-through tabular-nums">
                          {item.price}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium backdrop-blur ring-1 ring-white/15 ${
                      item.stockStatus === 'in_stock' ? 'bg-emerald-600/85 text-white' : 'bg-black/45 text-white'
                    }`}>
                      {item.stockStatus === 'in_stock' ? (isRtl ? 'متوفر' : 'In Stock') : (isRtl ? 'غير متوفر' : 'Out of Stock')}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-medium text-gold-700 block">
                      {getCategoryName(item.categoryId)} {item.subcategoryName ? `• ${item.subcategoryName}` : ''}
                    </span>
                    <h4 className="text-sm font-semibold text-chocolate-900 mt-1 line-clamp-1">
                      {isRtl && item.nameAr ? item.nameAr : item.name}
                    </h4>
                    {item.nameEn && item.nameAr && (
                      <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                        {item.nameEn}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center gap-1">
                    {filterTab === 'trashed' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 text-white cursor-pointer"
                        icon={RotateCcw}
                        disabled={restoringItemId === item.id}
                        onClick={() => handleRestoreItem(item)}
                      >
                        {restoringItemId === item.id ? (isRtl ? 'استعادة...' : 'Restoring...') : (isRtl ? 'استعادة' : 'Restore')}
                      </Button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleViewItem(item)}
                          className="h-8 w-8 inline-flex items-center justify-center text-stone-500 hover:text-chocolate-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={isRtl ? 'معاينة الصنف' : 'View Item'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="flex-1 h-8 px-3 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 font-semibold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={isRtl ? 'حذف الصنف' : 'Delete Item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sleek Luxury Pagination Bar */}
      {displayedItems.length > 0 && (pagination.total > 0 || items.length > 0) && (
        <div className="bg-white px-4 sm:px-5 py-3 rounded-2xl border border-stone-200/70 shadow-card flex flex-col md:flex-row items-center justify-between gap-3 animate-fade-in w-full">
          {/* Left / Info & Limit / Per-Page side */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-stone-500 justify-center md:justify-start w-full md:w-auto">
            {/* Range text */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>{isRtl ? 'عرض' : 'Showing'}</span>
              <span className="font-semibold text-chocolate-900 tabular-nums">
                {pagination.from || ((currentPage - 1) * perPage + 1)} - {pagination.to || Math.min(currentPage * perPage, pagination.total || displayedItems.length)}
              </span>
              <span>{isRtl ? 'من أصل' : 'of'}</span>
              <span className="font-semibold text-chocolate-900 tabular-nums">
                {pagination.total || displayedItems.length}
              </span>
              <span>{isRtl ? 'صنف مسجل' : 'items'}</span>
            </div>

            {/* Per Page / Limit Selector */}
            <div className="flex items-center gap-2 border-s border-stone-200 ps-4">
              <span className="text-stone-500">
                {isRtl ? 'عدد العناصر بالصفحة:' : 'Per page:'}
              </span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(e.target.value)}
                className="h-8 px-2 text-xs font-semibold tabular-nums rounded-lg bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none cursor-pointer transition"
              >
                <option value={10}>10</option>
                <option value={20}>20 ({isRtl ? 'افتراضي' : 'Default'})</option>
                <option value={50}>50</option>
                <option value={100}>100 ({isRtl ? 'أقصى حد' : 'Max'})</option>
              </select>
            </div>
          </div>

          {/* Right / Page navigation side */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-end w-full md:w-auto">
            {/* First Page Button */}
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(1)}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition-colors cursor-pointer ${
                currentPage <= 1 || loading
                  ? 'opacity-40 cursor-not-allowed bg-stone-50 text-stone-400'
                  : 'bg-white shadow-2xs hover:bg-stone-50 hover:text-chocolate-900 hover:border-stone-300'
              }`}
              title={isRtl ? 'الصفحة الأولى' : 'First Page'}
            >
              {isRtl ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            </button>

            {/* Previous Page Button */}
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className={`h-8 px-2.5 rounded-lg border border-stone-200 text-xs font-semibold text-chocolate-800 inline-flex items-center gap-1 transition-colors cursor-pointer ${
                currentPage <= 1 || loading
                  ? 'opacity-40 cursor-not-allowed bg-stone-50 text-stone-400'
                  : 'bg-white shadow-2xs hover:bg-stone-50 hover:text-chocolate-900 hover:border-stone-300'
              }`}
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isRtl ? 'السابق' : 'Prev'}</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers(currentPage, pagination.last_page || 1).map((pageNum, idx) => {
                if (pageNum === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-stone-400 font-semibold select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'bg-chocolate-900 text-white border border-chocolate-900 shadow-xs'
                        : 'bg-white hover:bg-stone-50 text-chocolate-800 border border-stone-200 hover:border-stone-300 shadow-2xs'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              disabled={currentPage >= (pagination.last_page || 1) || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className={`h-8 px-2.5 rounded-lg border border-stone-200 text-xs font-semibold text-chocolate-800 inline-flex items-center gap-1 transition-colors cursor-pointer ${
                currentPage >= (pagination.last_page || 1) || loading
                  ? 'opacity-40 cursor-not-allowed bg-stone-50 text-stone-400'
                  : 'bg-white shadow-2xs hover:bg-stone-50 hover:text-chocolate-900 hover:border-stone-300'
              }`}
            >
              <span>{isRtl ? 'التالي' : 'Next'}</span>
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Last Page Button */}
            <button
              type="button"
              disabled={currentPage >= (pagination.last_page || 1) || loading}
              onClick={() => handlePageChange(pagination.last_page || 1)}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition-colors cursor-pointer ${
                currentPage >= (pagination.last_page || 1) || loading
                  ? 'opacity-40 cursor-not-allowed bg-stone-50 text-stone-400'
                  : 'bg-white shadow-2xs hover:bg-stone-50 hover:text-chocolate-900 hover:border-stone-300'
              }`}
              title={isRtl ? 'الصفحة الأخيرة' : 'Last Page'}
            >
              {isRtl ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* PREMIUM LUXURY REDESIGNED MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-2xl sm:max-w-[680px]"
        scrollable={true}
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/60 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-chocolate-900">
                {editingItem
                  ? (isRtl ? "تعديل مواصفات الصنف" : "Edit Menu Item")
                  : (isRtl ? "إضافة صنف جديد للقائمة" : "Create New Menu Item")}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {isRtl
                  ? (editingItem ? "تعديل بيانات الصنف والأسعار والإضافات" : "أدخل تفاصيل الصنف لإضافته إلى قائمة كافيه 90")
                  : (editingItem ? "Update item details, prices, and options" : "Enter item details to add to Cafe 90 menu")}
              </p>
            </div>
          </div>
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              className="h-9 px-5"
              onClick={handleSaveItem}
              loading={submitting}
            >
              {editingItem
                ? (isRtl ? "حفظ التعديلات" : "Save Changes")
                : (isRtl ? "إضافة الصنف" : "Create Item")}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveItem} className="space-y-3">
          {/* Streamlined Segmented Control Tab Bar */}
          <div className="flex items-center p-1 bg-stone-200/50 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`flex-1 min-w-0 h-8 px-3 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formTab === 'basic'
                  ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                  : 'font-medium text-stone-500 hover:text-chocolate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{isRtl ? 'البيانات الأساسية والتسعير' : 'Basic Info & Pricing'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFormTab('customizations')}
              className={`flex-1 min-w-0 h-8 px-3 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formTab === 'customizations'
                  ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                  : 'font-medium text-stone-500 hover:text-chocolate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الأحجام ونقاط الولاء (اختياري)' : 'Sizes & Loyalty (Optional)'}</span>
            </button>
          </div>

          {/* TAB 1: BASIC INFO, PRICE, IMAGE & OFFER */}
          {formTab === 'basic' && (
            <div className="space-y-3 animate-fade-in">
              {/* Row 1: Image Picker + Names */}
              <div className="flex gap-3 items-center">
                {/* Compact Clickable Image Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-[76px] h-[76px] rounded-xl overflow-hidden border border-dashed border-stone-300 hover:border-gold-400 hover:bg-gold-50/40 bg-stone-50 flex flex-col items-center justify-center shrink-0 cursor-pointer group transition-colors"
                  title={isRtl ? 'انقر لرفع صورة' : 'Click to upload image'}
                >
                  {formData.imageUrl ? (
                    <>
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-1 text-stone-400 group-hover:text-gold-600 transition-colors">
                      <ImageIcon className="w-5 h-5 mx-auto mb-0.5 opacity-70" />
                      <span className="text-[11px] font-medium block leading-none">
                        {isRtl ? 'صورة' : 'Photo'}
                      </span>
                    </div>
                  )}
                  {optimizingItemImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-gold-400 animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Arabic and English Names */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                      {isRtl ? 'اسم الصنف (بالعربية) *' : 'Name (Arabic) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="مثال: ربع فراخ مشوية"
                      className="w-full h-10 px-3 rounded-xl text-[13px] font-medium bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                      {isRtl ? 'اسم الصنف (بالإنجليزية)' : 'Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={formData.nameEn || formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value, name: e.target.value })}
                      placeholder="e.g. Quarter Grilled Chicken"
                      className="w-full h-10 px-3 rounded-xl text-[13px] bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Category + Subcategory + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'القسم الرئيسي *' : 'Category *'}
                  </label>
                  <CustomSelect
                    value={formData.categoryId}
                    onChange={(newCatId) => {
                      const matchingSubs = subcategories.filter(s => String(s.categoryId || s.category_id) === String(newCatId));
                      setFormData(prev => ({
                        ...prev,
                        categoryId: newCatId,
                        subcategoryId: matchingSubs[0]?.id ? String(matchingSubs[0].id) : (subcategories[0]?.id ? String(subcategories[0].id) : '')
                      }));
                    }}
                    options={categories.map((c) => ({
                      value: c.id,
                      label: isRtl ? (c.name_ar || c.nameAr || c.name || c.name_en) : (c.name_en || c.nameEn || c.name || c.name_ar),
                      sublabel: c.nameEn || c.name_en ? `(${c.nameEn || c.name_en})` : ''
                    }))}
                    placeholder={isRtl ? 'اختر القسم الرئيسي...' : 'Select Category...'}
                    searchPlaceholder={isRtl ? 'بحث في الأقسام...' : 'Search categories...'}
                    isRtl={isRtl}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'التصنيف الفرعي *' : 'Subcategory *'}
                  </label>
                  {(() => {
                    const matchingSubs = formData.categoryId
                      ? subcategories.filter(s => String(s.categoryId || s.category_id) === String(formData.categoryId))
                      : subcategories;
                    const listToShow = matchingSubs.length > 0 ? matchingSubs : subcategories;
                    return (
                      <CustomSelect
                        value={formData.subcategoryId}
                        onChange={(newSubId) => setFormData(prev => ({ ...prev, subcategoryId: newSubId }))}
                        options={listToShow.map((s) => ({
                          value: s.id,
                          label: isRtl ? (s.name_ar || s.nameAr || s.name || s.name_en) : (s.name_en || s.nameEn || s.name || s.name_ar),
                          sublabel: s.nameEn || s.name_en ? `(${s.nameEn || s.name_en})` : ''
                        }))}
                        placeholder={isRtl ? 'اختر التصنيف الفرعي...' : 'Select Subcategory...'}
                        searchPlaceholder={isRtl ? 'بحث في التصنيفات الفرعية...' : 'Search subcategories...'}
                        isRtl={isRtl}
                        required
                      />
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'سعر البيع (ج.م) *' : 'Price (EGP) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="45"
                      className="w-full h-10 ps-3 pe-10 rounded-xl text-[13px] font-semibold tabular-nums bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400 pointer-events-none">
                      {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Special Offer Card (Simple & Professional) */}
              <div className="min-h-[56px] px-3.5 py-2.5 bg-white rounded-xl border border-stone-200/70 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    size="sm"
                    variant="simple"
                    checked={formData.offerActive}
                    onChange={() => {
                      const next = !formData.offerActive;
                      setFormData({
                        ...formData,
                        offerActive: next,
                        offerPrice: next
                          ? ((!formData.offerPrice || Number(formData.offerPrice) <= 0)
                              ? String(Math.max(1, Math.round(Number(formData.price || 45) * 0.8)))
                              : formData.offerPrice)
                          : '',
                        discountValue: next ? formData.discountValue : ''
                      });
                    }}
                    ariaLabel={isRtl ? 'تفعيل العرض' : 'Offer'}
                  />
                  <span className="text-[13px] font-semibold text-chocolate-900">
                    {isRtl ? 'تفعيل عرض خاص للصنف' : 'Activate Special Offer'}
                  </span>
                </div>

                {formData.offerActive && (
                  <div className="flex items-center gap-2 animate-fade-in ms-auto sm:ms-0">
                    <span className="text-xs font-medium text-stone-500">
                      {isRtl ? 'سعر العرض:' : 'Offer Price:'}
                    </span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.offerPrice}
                        onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                        placeholder="35"
                        className="w-full h-9 ps-2.5 pe-9 rounded-lg text-[13px] font-semibold tabular-nums bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                      />
                      <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400 pointer-events-none">
                        {isRtl ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Description inputs (Arabic & English) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'وصف الصنف بالعربية (اختياري)' : 'Description - Arabic (Optional)'}
                  </label>
                  <textarea
                    rows={4}
                    dir="rtl"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    placeholder="وصف مختصر لمكونات وطعم الصنف..."
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] resize-y leading-relaxed bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                    {isRtl ? 'وصف الصنف بالإنجليزية (اختياري)' : 'Description - English (Optional)'}
                  </label>
                  <textarea
                    rows={4}
                    dir="ltr"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="Brief description of ingredients..."
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] resize-y leading-relaxed bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIZES & LOYALTY (SIMPLIFIED & DYNAMIC) */}
          {formTab === 'customizations' && (
            <div className="space-y-3 animate-fade-in">
              {/* Dynamic Sizes System */}
              <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-chocolate-900">
                    <span className="text-gold-600 text-sm">☕</span>
                    <span>{isRtl ? 'أحجام متعددة للصنف وتحديد أسعارها يدوياً' : 'Multiple Sizes & Manual Pricing'}</span>
                  </div>
                  <ToggleSwitch
                    size="sm"
                    variant="simple"
                    checked={hasSizes}
                    onChange={(next) => {
                      setHasSizes(next);
                      if (next && sizesList.length === 0) {
                        setSizesList([
                          { id: `sz_${Date.now()}_1`, nameAr: 'صغير', nameEn: 'Small', name: 'صغير', price: String(Math.max(10, (Number(formData.price) || 45) - 10)) },
                          { id: `sz_${Date.now()}_2`, nameAr: 'وسط', nameEn: 'Medium', name: 'وسط', price: String(Number(formData.price) || 45) },
                          { id: `sz_${Date.now()}_3`, nameAr: 'كبير', nameEn: 'Large', name: 'كبير', price: String((Number(formData.price) || 45) + 10) }
                        ]);
                      }
                    }}
                    ariaLabel={isRtl ? 'تفعيل أحجام الصنف' : 'Toggle Sizes'}
                  />
                </div>

                {hasSizes && (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    <div className="space-y-2">
                      {sizesList.map((sizeItem, idx) => (
                        <div
                          key={sizeItem.id || idx}
                          className="flex items-center gap-2 bg-stone-50/70 p-2 rounded-xl border border-stone-200/70"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              value={sizeItem.nameAr || sizeItem.name || ''}
                              onChange={(e) => {
                                const newSizes = [...sizesList];
                                newSizes[idx] = {
                                  ...newSizes[idx],
                                  nameAr: e.target.value,
                                  name: e.target.value
                                };
                                setSizesList(newSizes);
                              }}
                              placeholder={isRtl ? 'اسم الحجم (مثال: صغير، كبير، دبل، لتر...)' : 'Size Name (e.g. Small, Large...)'}
                              className="w-full h-9 px-3 rounded-lg text-[13px] font-medium bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                            />
                          </div>

                          <div className="relative w-28 sm:w-32 shrink-0">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={sizeItem.price}
                              onChange={(e) => {
                                const newSizes = [...sizesList];
                                newSizes[idx] = { ...newSizes[idx], price: e.target.value };
                                setSizesList(newSizes);
                              }}
                              placeholder={isRtl ? 'السعر' : 'Price'}
                              className="w-full h-9 ps-3 pe-9 rounded-lg text-[13px] font-semibold tabular-nums bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                            />
                            <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400 pointer-events-none">
                              {isRtl ? 'ج.م' : 'EGP'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSizesList(sizesList.filter((_, i) => i !== idx));
                            }}
                            className="h-9 w-9 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title={isRtl ? 'حذف هذا الحجم' : 'Delete Size'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* + Add Another Size Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSizesList([
                          ...sizesList,
                          { id: `sz_${Date.now()}`, nameAr: '', nameEn: '', name: '', price: '' }
                        ]);
                      }}
                      className="w-full h-9 px-3 border border-dashed border-gold-300 hover:border-gold-400 hover:bg-gold-50/60 text-gold-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-gold-700" strokeWidth={2.5} />
                      <span>{isRtl ? 'إضافة حجم آخر +' : '+ Add Another Size'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Loyalty Points Card */}
              <div className="p-4 bg-white rounded-xl border border-stone-200/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-chocolate-900">
                  <Star className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>{isRtl ? 'برنامج مكافآت ونقاط الولاء (استبدال الصنف بالنقاط)' : 'Loyalty Points Redemption'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.redeemableWithPoints && (
                    <div className="relative w-24 animate-fade-in">
                      <input
                        type="number"
                        min="0"
                        value={formData.pointsPrice}
                        onChange={(e) => setFormData({ ...formData, pointsPrice: e.target.value })}
                        placeholder="150"
                        className="w-full h-8 ps-2.5 pe-8 rounded-lg text-[13px] font-semibold tabular-nums bg-white border border-stone-200 text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
                      />
                      <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400 pointer-events-none">
                        {isRtl ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                  )}
                  <ToggleSwitch
                    size="sm"
                    variant="simple"
                    checked={formData.redeemableWithPoints}
                    onChange={() => {
                      const next = !formData.redeemableWithPoints;
                      setFormData({
                        ...formData,
                        redeemableWithPoints: next,
                        pointsPrice: next && (!formData.pointsPrice || Number(formData.pointsPrice) <= 0) ? '150' : formData.pointsPrice
                      });
                    }}
                    ariaLabel={isRtl ? 'تفعيل برنامج مكافآت ونقاط الولاء' : 'Toggle Loyalty Points'}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Live View Item Details Modal */}
      {viewingItem && (
        <Modal
          isOpen={Boolean(viewingItem)}
          onClose={() => setViewingItem(null)}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/60 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-chocolate-900">
                  {viewingItem.nameAr || viewingItem.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 tabular-nums">
                  #{viewingItem.id} • {getCategoryName(viewingItem.categoryId)} {viewingItem.subcategoryName ? `• ${viewingItem.subcategoryName}` : ''}
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingItem(null)}
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </Button>
              <Button
                variant="gold"
                size="sm"
                icon={Edit2}
                onClick={() => {
                  const target = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(target);
                }}
              >
                {isRtl ? 'تعديل الصنف' : 'Edit Item'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-[13px]">
            {loadingItemDetails && (
              <div className="px-3 py-2.5 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{isRtl ? 'جاري جلب أحدث بيانات الصنف...' : 'Fetching latest live item data...'}</span>
              </div>
            )}

            {/* Hero Card: Image & Overview */}
            <div className="flex flex-col sm:flex-row gap-4 items-start bg-white p-4 rounded-xl border border-stone-200/70">
              <img
                src={viewingItem.imageUrl}
                alt={viewingItem.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover ring-1 ring-stone-200/70 shrink-0 bg-stone-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-chocolate-900">
                    {viewingItem.nameAr || viewingItem.name}
                  </h3>
                  {viewingItem.totalOrdered > 0 && (
                    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium tabular-nums bg-amber-50 text-amber-700 border border-amber-200/70">
                      <Flame className="w-3.5 h-3.5" />
                      {viewingItem.totalOrdered} {isRtl ? 'طلب' : 'orders'}
                    </span>
                  )}
                  {viewingItem.isOnOffer && (
                    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                      <Tag className="w-3.5 h-3.5" />
                      {isRtl ? 'عرض نشط' : 'Active Offer'}
                    </span>
                  )}
                </div>

                {viewingItem.nameEn && (
                  <p className="text-xs text-stone-500">
                    {viewingItem.nameEn}
                  </p>
                )}

                {/* Rating and Badges */}
                <div className="flex items-center gap-2.5 text-xs text-stone-600 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 font-semibold tabular-nums text-amber-700">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {viewingItem.rating || '4.5'}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500 tabular-nums">{viewingItem.reviewCount || 120} {isRtl ? 'تقييم ومراجعة' : 'reviews'}</span>
                  <span className="text-stone-300">•</span>
                  <Badge variant="gold">
                    {getCategoryName(viewingItem.categoryId)}
                  </Badge>
                  {viewingItem.subcategoryName && (
                    <Badge variant="outline">
                      {viewingItem.subcategoryName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Key Metrics Grid - Unified, clean, and elegant */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Original / Final Price */}
              <div className="p-3 bg-white rounded-xl border border-stone-200/70">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'السعر' : 'Price'}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-base font-semibold text-chocolate-950 tabular-nums">
                    {viewingItem.isOnOffer ? (viewingItem.finalPrice || viewingItem.offerPrice) : viewingItem.price} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                  {viewingItem.isOnOffer && (
                    <span className="text-xs text-stone-400 line-through tabular-nums">
                      {viewingItem.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="p-3 bg-white rounded-xl border border-stone-200/70">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'حالة التوفر' : 'Stock Status'}
                </span>
                <span className="text-[13px] font-semibold text-emerald-700 flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isRtl ? 'متوفر بالمخزون' : 'In Stock'}
                </span>
              </div>

              {/* Loyalty Points */}
              <div className="p-3 bg-white rounded-xl border border-stone-200/70">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'استبدال بالنقاط' : 'Points Price'}
                </span>
                <span className="text-base font-semibold text-chocolate-950 tabular-nums mt-1.5 block">
                  {viewingItem.redeemableWithPoints ? `${viewingItem.pointsPrice} ${isRtl ? 'نقطة' : 'pts'}` : (isRtl ? 'غير متاح' : 'N/A')}
                </span>
              </div>

              {/* Total Ordered */}
              <div className="p-3 bg-white rounded-xl border border-stone-200/70">
                <span className="text-xs text-stone-500 block font-medium">
                  {isRtl ? 'المبيعات' : 'Orders'}
                </span>
                <span className="text-base font-semibold text-chocolate-950 tabular-nums mt-1.5 block">
                  {viewingItem.totalOrdered || 0} {isRtl ? 'طلب' : 'orders'}
                </span>
              </div>
            </div>

            {/* Quick Actions (Simple and clean, human-friendly) */}
            <div className="p-4 bg-white rounded-xl border border-stone-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[13px] font-semibold text-chocolate-900 block">
                  {isRtl ? 'إجراءات سريعة:' : 'Quick Actions:'}
                </span>
                <span className="text-xs text-stone-500 mt-0.5 block">
                  {isRtl ? 'التحكم في العرض ونقاط الولاء بنقرة واحدة' : 'Toggle offer or points with one click'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickToggleOffer(viewingItem)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                    viewingItem.isOnOffer || viewingItem.offerActive
                      ? 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                      : 'bg-white text-chocolate-800 border border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    {viewingItem.isOnOffer || viewingItem.offerActive
                      ? (isRtl ? 'إلغاء تفعيل العرض' : 'Deactivate Offer')
                      : (isRtl ? 'تفعيل العرض الترويجي' : 'Activate Offer')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickTogglePoints(viewingItem)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                    viewingItem.redeemableWithPoints
                      ? 'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50'
                      : 'bg-white text-chocolate-800 border border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>
                    {viewingItem.redeemableWithPoints
                      ? (isRtl ? 'تعطيل الاستبدال بالنقاط' : 'Disable Points')
                      : (isRtl ? 'إتاحة للاستبدال بالنقاط' : 'Enable Points')}
                  </span>
                </button>
              </div>
            </div>

            {/* Description */}
            {viewingItem.description && (
              <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1">
                <span className="text-[13px] font-semibold text-chocolate-900 block">
                  {isRtl ? 'الوصف والتفاصيل:' : 'Description:'}
                </span>
                <p className="text-[13px] text-stone-600 leading-relaxed">
                  {viewingItem.description}
                </p>
              </div>
            )}

            {/* Subtle Timestamps */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-400 tabular-nums">
              <span>{isRtl ? 'تاريخ الإضافة:' : 'Created:'} {formatDate(viewingItem.createdAt)}</span>
              <span>{isRtl ? 'آخر تحديث:' : 'Updated:'} {formatDate(viewingItem.updatedAt)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title={isRtl ? "حذف صنف من القائمة؟" : "Delete Menu Item?"}
        message={isRtl
          ? `هل أنت متأكد من رغبتك في حذف "${deletingItem?.nameAr || deletingItem?.name}" من قائمة كافيه 90؟`
          : `Are you sure you want to remove "${deletingItem?.name}" from the Cafe 90 menu?`
        }
        loading={submitting}
      />
    </div>
  );
};
