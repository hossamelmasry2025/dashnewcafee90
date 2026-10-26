import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  RefreshCw, 
  Layers, 
  Coffee, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Badge } from '../../common/Badge';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const RecycleBinView = ({ onNavigate }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'
  const [trashedItems, setTrashedItems] = useState([]);
  const [trashedCategories, setTrashedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmRestoreTarget, setConfirmRestoreTarget] = useState(null); // { type: 'item' | 'cat', item: obj }

  // Load all trashed data
  const loadTrashedData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.allSettled([
        api.getTrashedItems(),
        api.getTrashedCategories()
      ]);

      const items = itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value) 
        ? itemsRes.value 
        : (itemsRes.value?.data || []);
      const cats = catsRes.status === 'fulfilled' && Array.isArray(catsRes.value) 
        ? catsRes.value 
        : (catsRes.value?.data || []);

      setTrashedItems(Array.isArray(items) ? items : []);
      setTrashedCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error('Error loading trashed data:', err);
      toast.error(isRtl ? 'تعذر تحميل سلة المحذوفات' : 'Failed to load recycle bin data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashedData(true);
  }, []);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return isRtl ? 'غير محدد' : 'Unknown';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateStr);
    }
  };

  // Restore Item handler
  const handleRestoreItem = async (item) => {
    try {
      setRestoringId(`item_${item.id}`);
      await api.restoreItem(item.id);
      
      // Optimistic update
      setTrashedItems(prev => prev.filter(it => String(it.id) !== String(item.id)));
      
      const itemName = isRtl 
        ? (item.name_ar || item.nameAr || item.name || item.name_en) 
        : (item.name_en || item.nameEn || item.name || item.name_ar);
        
      toast.success(
        isRtl 
          ? `تمت استعادة الصنف "${itemName}" بنجاح وإعادته للقائمة ✨` 
          : `Item "${itemName}" restored successfully ✨`
      );

      // Trigger global refresh event
      window.dispatchEvent(new CustomEvent('notification:received'));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل استعادة الصنف' : 'Failed to restore item'));
      loadTrashedData(false);
    } finally {
      setRestoringId(null);
      setConfirmRestoreTarget(null);
    }
  };

  // Restore Category handler
  const handleRestoreCategory = async (cat) => {
    try {
      setRestoringId(`cat_${cat.id}`);
      await api.restoreCategory(cat.id);

      // Optimistic update
      setTrashedCategories(prev => prev.filter(c => String(c.id) !== String(cat.id)));

      const catName = isRtl 
        ? (cat.name_ar || cat.nameAr || cat.name || cat.name_en) 
        : (cat.name_en || cat.nameEn || cat.name || cat.name_ar);

      toast.success(
        isRtl 
          ? `تمت استعادة القسم "${catName}" بنجاح وإعادته للأقسام النشطة ✨` 
          : `Category "${catName}" restored successfully ✨`
      );

      // Trigger global refresh event
      window.dispatchEvent(new CustomEvent('notification:received'));
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل استعادة القسم' : 'Failed to restore category'));
      loadTrashedData(false);
    } finally {
      setRestoringId(null);
      setConfirmRestoreTarget(null);
    }
  };

  // Filter items by search
  const filteredItems = trashedItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameAr = (item.name_ar || item.nameAr || '').toLowerCase();
    const nameEn = (item.name_en || item.nameEn || item.name || '').toLowerCase();
    const desc = (item.description_ar || item.description_en || item.description || '').toLowerCase();
    return nameAr.includes(q) || nameEn.includes(q) || desc.includes(q);
  });

  // Filter categories by search
  const filteredCategories = trashedCategories.filter(cat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameAr = (cat.name_ar || cat.nameAr || '').toLowerCase();
    const nameEn = (cat.name_en || cat.nameEn || cat.name || '').toLowerCase();
    const desc = (cat.description_ar || cat.description_en || cat.description || '').toLowerCase();
    return nameAr.includes(q) || nameEn.includes(q) || desc.includes(q);
  });

  return (
    <div className="space-y-5 w-full animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="min-w-0">
          <div className="flex items-start gap-3.5">
            <div className="hidden sm:flex w-11 h-11 rounded-xl items-center justify-center shrink-0 ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200/60">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-chocolate-900">
                  {isRtl ? 'سلة المحذوفات والأرشيف' : 'Recycle Bin & Trashed Records'}
                </h2>
                <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/70 text-xs font-semibold tabular-nums">
                  {trashedItems.length + trashedCategories.length} {isRtl ? 'عنصر محذوف' : 'Trashed'}
                </span>
              </div>
              <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
                {isRtl 
                  ? 'العناصر هنا محذوفة مؤقتاً (Soft Delete)، ويمكنك استعادتها بضغطة زر لتعود فوراً إلى القائمة وتطبيق الهاتف.' 
                  : 'Soft-deleted items & categories can be restored back to live menu and customer mobile app anytime.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search */}
          <div className="relative flex-1 sm:flex-none sm:w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث في المحذوفات...' : 'Search trashed items...'}
              className="w-full h-10 px-3 ps-10 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition"
            />
            <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => loadTrashedData(true)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-10 min-w-[40px] px-2.5 sm:px-3.5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-sm font-semibold rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
            title={isRtl ? 'تحديث السلة' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRtl ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="inline-flex items-center p-1 bg-stone-200/50 rounded-xl max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`h-9 px-3.5 rounded-lg text-[13px] whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'items'
              ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
              : 'font-medium text-stone-500 hover:text-chocolate-900'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>{isRtl ? 'الأصناف المحذوفة' : 'Trashed Menu Items'}</span>
          <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
            activeTab === 'items' ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
          }`}>
            {trashedItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`h-9 px-3.5 rounded-lg text-[13px] whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
              : 'font-medium text-stone-500 hover:text-chocolate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isRtl ? 'الأقسام المحذوفة' : 'Trashed Categories'}</span>
          <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
            activeTab === 'categories' ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
          }`}>
            {trashedCategories.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200/70 shadow-card text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-gold-600 animate-spin" />
          <p className="text-[13px] font-medium text-stone-500">
            {isRtl ? 'جاري تحميل عناصر سلة المحذوفات...' : 'Loading recycle bin items...'}
          </p>
        </div>
      ) : activeTab === 'items' ? (
        /* Trashed Menu Items Tab */
        filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200/70 shadow-card text-center flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-chocolate-900">
              {searchQuery ? (isRtl ? 'لا توجد أصناف مطابقة لبحثك' : 'No matching trashed items') : (isRtl ? 'لا توجد أصناف محذوفة في السلة' : 'No Trashed Items in Bin')}
            </h3>
            <p className="text-xs text-stone-500 max-w-md">
              {isRtl 
                ? 'كافة الأصناف تعمل وتظهر بشكل طبيعي في قائمة الكافيه وتطبيق الهاتف.' 
                : 'All menu items are currently active and available in the catalog.'}
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('menu-items')}
                className="mt-1 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <span>{isRtl ? 'الانتقال إلى إدارة الأصناف' : 'Go to Menu Items'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const namePrimary = isRtl ? (item.name_ar || item.nameAr || item.name) : (item.name_en || item.nameEn || item.name);
              const nameSecondary = isRtl ? (item.name_en || item.nameEn || '') : (item.name_ar || item.nameAr || '');
              const imageUrl = item.image_url || item.imageUrl || item.image || '';
              const isRestoring = restoringId === `item_${item.id}`;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200/70 hover:border-stone-300/70 p-4 transition-all shadow-card hover:shadow-luxury flex flex-col justify-between group"
                >
                  <div className="flex gap-3 items-start">
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200/70 flex items-center justify-center relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={namePrimary}
                          className="w-full h-full object-cover grayscale-[35%]"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Coffee className="w-6 h-6 text-stone-400" />
                      )}
                      <span className="absolute bottom-1 inset-x-1 h-4 inline-flex items-center justify-center rounded-full text-[10px] leading-none bg-rose-600/90 text-white font-semibold">
                        {isRtl ? 'محذوف' : 'Deleted'}
                      </span>
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-semibold text-chocolate-900 truncate">
                          {namePrimary}
                        </h4>
                        <span className="text-[13px] font-semibold tabular-nums text-chocolate-900 shrink-0">
                          {item.price ? `${item.price} EGP` : '—'}
                        </span>
                      </div>
                      {nameSecondary && (
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {nameSecondary}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-stone-500 flex-wrap">
                        {item.category?.name || item.category_name ? (
                          <span className="inline-flex items-center h-5 px-2 rounded-full bg-stone-100 text-stone-600 font-medium">
                            {item.category?.name || item.category_name}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1 tabular-nums text-stone-400">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatDate(item.deleted_at || item.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] tabular-nums text-stone-400">
                      ID: #{item.id}
                    </span>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleRestoreItem(item)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? (isRtl ? 'جاري الاستعادة...' : 'Restoring...') : (isRtl ? 'استعادة الصنف' : 'Restore Item')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Trashed Categories Tab */
        filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200/70 shadow-card text-center flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-chocolate-900">
              {searchQuery ? (isRtl ? 'لا توجد أقسام مطابقة لبحثك' : 'No matching trashed categories') : (isRtl ? 'لا توجد أقسام محذوفة في السلة' : 'No Trashed Categories')}
            </h3>
            <p className="text-xs text-stone-500 max-w-md">
              {isRtl 
                ? 'كافة أقسام القائمة تعمل ونشطة في النظام وتطبيق الضيوف.' 
                : 'All menu categories are active and properly organized.'}
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="mt-1 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <span>{isRtl ? 'الانتقال إلى إدارة الأقسام' : 'Go to Categories'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => {
              const namePrimary = isRtl ? (cat.name_ar || cat.nameAr || cat.name) : (cat.name_en || cat.nameEn || cat.name);
              const nameSecondary = isRtl ? (cat.name_en || cat.nameEn || '') : (cat.name_ar || cat.nameAr || '');
              const desc = isRtl ? (cat.description_ar || cat.description) : (cat.description_en || cat.description);
              const imageUrl = cat.image_url || cat.imageUrl || cat.image || '';
              const isRestoring = restoringId === `cat_${cat.id}`;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-stone-200/70 hover:border-stone-300/70 p-4 transition-all shadow-card hover:shadow-luxury flex flex-col justify-between group"
                >
                  <div className="flex gap-3 items-start">
                    {/* Category Image */}
                    <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200/70 flex items-center justify-center relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={namePrimary}
                          className="w-full h-full object-cover grayscale-[35%]"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Layers className="w-6 h-6 text-stone-400" />
                      )}
                      <span className="absolute bottom-1 inset-x-1 h-4 inline-flex items-center justify-center rounded-full text-[10px] leading-none bg-rose-600/90 text-white font-semibold">
                        {isRtl ? 'محذوف' : 'Deleted'}
                      </span>
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-chocolate-900 truncate">
                        {namePrimary}
                      </h4>
                      {nameSecondary && (
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {nameSecondary}
                        </p>
                      )}
                      {desc && (
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                          {desc}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-400 tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(cat.deleted_at || cat.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] tabular-nums text-stone-400">
                      ID: #{cat.id}
                    </span>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleRestoreCategory(cat)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? (isRtl ? 'جاري الاستعادة...' : 'Restoring...') : (isRtl ? 'استعادة القسم' : 'Restore Category')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
