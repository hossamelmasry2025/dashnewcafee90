import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Star,
  Search,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  DoorOpen,
  Coffee,
  User,
  Upload,
  Camera,
  X,
  Maximize2,
  Calendar
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';

export const ReviewsView = ({ initialFilter = 'all' }) => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const imageInputRef = useRef(null);

  const [cafeReviews, setCafeReviews] = useState([]);
  const [roomReviews, setRoomReviews] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category Tab: 'all' | 'cafe' | 'room'
  const [activeCategoryTab, setActiveCategoryTab] = useState(initialFilter === 'room' ? 'room' : 'all');

  // Secondary Filters
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deletingReview, setDeletingReview] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Full-size image preview modal state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Submit Review modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRoomId, setReviewRoomId] = useState('');
  const [reviewImageFiles, setReviewImageFiles] = useState([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);

  const normalizeReview = (r, type = 'cafe') => {
    const rawImages = Array.isArray(r.image_urls) && r.image_urls.length > 0
      ? r.image_urls
      : (Array.isArray(r.images) ? r.images : []);

    const imageUrls = rawImages.map(img => {
      if (typeof img === 'string') {
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        const clean = img.startsWith('/') ? img.slice(1) : img;
        return `https://backend.ninety90degree.com/public/storage/${clean}`;
      }
      return '';
    }).filter(Boolean);

    return {
      id: r.id,
      type: r.room_id ? 'room' : type,
      userId: r.user_id,
      roomId: r.room_id || null,
      rating: Number(r.rating) || 5,
      comment: r.comment || '',
      imageUrls,
      createdAt: r.created_at,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : '',
      userName: r.user?.name || (isRtl ? 'عميل كافيه 90' : 'Cafe 90 Guest'),
      userAvatar: r.user?.avatar_url || (r.user?.avatar ? (r.user.avatar.startsWith('http') ? r.user.avatar : `https://backend.ninety90degree.com/public/storage/${r.user.avatar.replace(/^\//, '')}`) : '')
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, roomsRes] = await Promise.allSettled([
        api.getReviews(),
        api.getRooms()
      ]);

      if (reviewsRes.status === 'fulfilled' && reviewsRes.value) {
        const val = reviewsRes.value;
        // Support both { cafe_reviews, room_reviews } and a flat array (split by room_id)
        const flat = Array.isArray(val) ? val : null;
        const rawCafe = flat ? flat.filter(r => !r.room_id && !r.room) : (Array.isArray(val?.cafe_reviews) ? val.cafe_reviews : []);
        const rawRoom = flat ? flat.filter(r => r.room_id || r.room) : (Array.isArray(val?.room_reviews) ? val.room_reviews : []);

        setCafeReviews(rawCafe.map(r => normalizeReview(r, 'cafe')));
        setRoomReviews(rawRoom.map(r => normalizeReview(r, 'room')));
      }

      if (roomsRes.status === 'fulfilled' && roomsRes.value) {
        const rVal = roomsRes.value;
        const roomsList = Array.isArray(rVal) ? rVal : (Array.isArray(rVal?.rooms) ? rVal.rooms : (Array.isArray(rVal?.data) ? rVal.data : []));
        setAvailableRooms(roomsList);
      }
    } catch (e) {
      console.error('Error loading reviews:', e);
      toast.error(isRtl ? 'فشل تحميل التقييمات من السيرفر' : 'Failed to load reviews from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combined all reviews
  const allReviews = useMemo(() => {
    return [...cafeReviews, ...roomReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [cafeReviews, roomReviews]);

  // Key KPI stats computed from real live reviews
  const stats = useMemo(() => {
    const total = allReviews.length;
    const avg = total > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : '5.0';
    const fiveStars = allReviews.filter(r => r.rating === 5).length;
    const withPhotos = allReviews.filter(r => r.imageUrls.length > 0).length;

    return {
      total,
      avg,
      fiveStars,
      withPhotos,
      cafeCount: cafeReviews.length,
      roomCount: roomReviews.length
    };
  }, [allReviews, cafeReviews, roomReviews]);

  // Filtered reviews list
  const filteredReviews = useMemo(() => {
    return allReviews.filter(r => {
      // 1. Category Tab Filter
      if (activeCategoryTab === 'cafe' && r.type !== 'cafe') return false;
      if (activeCategoryTab === 'room' && r.type !== 'room') return false;

      // 2. Rating Filter
      if (ratingFilter !== 'all' && String(r.rating) !== String(ratingFilter)) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = String(r.userName || '').toLowerCase().includes(q);
        const matchComment = String(r.comment || '').toLowerCase().includes(q);
        if (!matchName && !matchComment) return false;
      }

      return true;
    });
  }, [allReviews, activeCategoryTab, ratingFilter, searchQuery]);

  // Open Submit Review Modal
  const handleOpenSubmitReview = () => {
    setReviewRating(5);
    setReviewHoverRating(0);
    setReviewComment('');
    setReviewRoomId('');
    setReviewImageFiles([]);
    setReviewImagePreviews([]);
    setIsSubmitModalOpen(true);
  };

  // Image upload handler for review form
  const handleReviewImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setReviewImageFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReviewImagePreviews(prev => [...prev, event.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReviewImage = (index) => {
    setReviewImageFiles(prev => prev.filter((_, i) => i !== index));
    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Review (POST /reviews)
  const handleSubmitReview = async (e) => {
    e?.preventDefault?.();
    if (!reviewComment.trim()) {
      toast.warning(isRtl ? 'يرجى كتابة نص التقييم أو الملاحظة' : 'Please enter review comment');
      return;
    }

    try {
      setSubmittingReview(true);
      const fd = new FormData();
      fd.append('rating', String(reviewRating));
      fd.append('comment', reviewComment.trim());

      if (reviewRoomId) {
        fd.append('room_id', String(reviewRoomId));
      }

      reviewImageFiles.forEach((file) => {
        fd.append('images[]', file);
      });

      const res = await api.submitReview(fd);
      toast.success(res?.message || (isRtl ? 'تم إرسال التقييم بنجاح' : 'Review submitted successfully'));
      setIsSubmitModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.message || (isRtl ? 'فشل إرسال التقييم' : 'Failed to submit review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete Review (DELETE /reviews/:id)
  const handleDeleteReviewConfirm = async () => {
    if (!deletingReview) return;
    try {
      setDeleting(true);
      const res = await api.deleteReview(deletingReview.id);
      if (res?.message && (res.message.includes('غير موجود') || res.message.toLowerCase().includes('not found'))) {
        toast.warning(res.message);
        setCafeReviews(prev => prev.filter(r => r.id !== deletingReview.id));
        setRoomReviews(prev => prev.filter(r => r.id !== deletingReview.id));
        setDeletingReview(null);
        await loadData();
        return;
      }
      toast.success(res?.message || (isRtl ? 'تم حذف التقييم بنجاح' : 'Review deleted successfully'));
      setCafeReviews(prev => prev.filter(r => r.id !== deletingReview.id));
      setRoomReviews(prev => prev.filter(r => r.id !== deletingReview.id));
      setDeletingReview(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error(err.message || (isRtl ? 'فشل حذف التقييم' : 'Failed to delete review'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in w-full pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-chocolate-900">
              {t('reviewsTitle', 'التقييمات والآراء')}
            </h1>
            <Badge variant="gold">
              {stats.avg} ★ {isRtl ? 'متوسط تقييمات العملاء' : 'Average Rating'}
            </Badge>
          </div>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
            {isRtl
              ? 'متابعة تقييمات العملاء الحية لكافيه 90 وقاعات الاجتماعات VIP، ومعاينة صور تجارب العملاء.'
              : 'Monitor real customer feedback for Cafe 90 and VIP rooms with attached guest experience photos.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            icon={RotateCcw}
          >
            {isRtl ? 'تحديث' : 'Refresh'}
          </Button>

          <Button
            variant="gold"
            size="md"
            icon={Plus}
            onClick={handleOpenSubmitReview}
          >
            {isRtl ? 'إرسال تقييم جديد' : 'Submit Review'}
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Card 1: Total Reviews */}
        <div
          onClick={() => setActiveCategoryTab('all')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col justify-between group ${
            activeCategoryTab === 'all'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:border-stone-300 hover:shadow-luxury'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-gold-50 text-gold-700 ring-gold-200/60">
              <MessageSquare className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[13px] font-medium text-stone-500 leading-tight">
              {isRtl ? 'إجمالي التقييمات' : 'Total Reviews'}
            </p>
          </div>
          <h3 className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {stats.total}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={activeCategoryTab === 'all' ? 'text-gold-700 font-medium' : 'text-stone-500'}>
              {activeCategoryTab === 'all' ? (isRtl ? '● معروضة حالياً' : '● Currently Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
            </span>
          </div>
        </div>

        {/* Card 2: Cafe Reviews */}
        <div
          onClick={() => setActiveCategoryTab('cafe')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col justify-between group ${
            activeCategoryTab === 'cafe'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:border-stone-300 hover:shadow-luxury'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200/60">
              <Coffee className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[13px] font-medium text-stone-500 leading-tight">
              {isRtl ? 'تقييمات الكافيه' : 'Cafe Reviews'}
            </p>
          </div>
          <h3 className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {stats.cafeCount}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={activeCategoryTab === 'cafe' ? 'text-gold-700 font-medium' : 'text-stone-500'}>
              {activeCategoryTab === 'cafe' ? (isRtl ? '● معروضة حالياً' : '● Currently Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
            </span>
          </div>
        </div>

        {/* Card 3: Room Reviews */}
        <div
          onClick={() => setActiveCategoryTab('room')}
          className={`p-4 sm:p-5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col justify-between group ${
            activeCategoryTab === 'room'
              ? 'border-gold-400 ring-4 ring-gold-400/15 shadow-luxury'
              : 'border-stone-200/70 shadow-card hover:border-stone-300 hover:shadow-luxury'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200/60">
              <DoorOpen className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[13px] font-medium text-stone-500 leading-tight">
              {isRtl ? 'تقييمات غرف الاجتماعات' : 'Meeting Room Reviews'}
            </p>
          </div>
          <h3 className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {stats.roomCount}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={activeCategoryTab === 'room' ? 'text-gold-700 font-medium' : 'text-stone-500'}>
              {activeCategoryTab === 'room' ? (isRtl ? '● معروضة حالياً' : '● Currently Active') : (isRtl ? 'انقر للعرض' : 'Click to View')}
            </span>
          </div>
        </div>

        {/* Card 4: Reviews with Customer Photos */}
        <div className="p-4 sm:p-5 rounded-2xl border border-stone-200/70 bg-white shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200/60">
              <Camera className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[13px] font-medium text-stone-500 leading-tight">
              {isRtl ? 'تقييمات بصور مرفقة' : 'Reviews with Photos'}
            </p>
          </div>
          <h3 className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
            {stats.withPhotos}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500 tabular-nums">
            <span>{isRtl ? `${stats.fiveStars} تقييم 5 نجوم ★` : `${stats.fiveStars} 5-Star ratings`}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Category Tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-stone-200/50 rounded-xl self-start md:self-auto max-w-full overflow-x-auto">
          {[
            { id: 'all', label: isRtl ? 'الكل' : 'All', count: stats.total },
            { id: 'cafe', label: isRtl ? 'الكافيه' : 'Cafe', count: stats.cafeCount },
            { id: 'room', label: isRtl ? 'الغرف VIP' : 'Rooms', count: stats.roomCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id)}
              className={`h-8 px-3 rounded-lg text-[13px] transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                activeCategoryTab === tab.id
                  ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                  : 'font-medium text-stone-500 hover:text-chocolate-900'
              }`}
            >
              {tab.label}
              <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${activeCategoryTab === tab.id ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium cursor-pointer"
          >
            <option value="all">{isRtl ? 'كافة النجوم ★' : 'All Stars ★'}</option>
            <option value="5">5 ★★★★★</option>
            <option value="4">4 ★★★★</option>
            <option value="3">3 ★★★</option>
            <option value="2">2 ★★</option>
            <option value="1">1 ★</option>
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "ابحث باسم العميل أو التعليق..." : "Search customer or comment..."}
              className="w-full h-10 ps-10 pe-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-stone-200/70 shadow-card animate-pulse" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl px-6 py-14 border border-stone-200/70 text-center space-y-3 shadow-card">
          <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-chocolate-900">
            {isRtl ? 'لا توجد تقييمات مطابقة' : 'No reviews found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {isRtl ? 'لم يتم العثور على تقييمات تتوافق مع معايير البحث والفلترة المحددة.' : 'No reviews match your current search and filters.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setActiveCategoryTab('all'); setRatingFilter('all'); setSearchQuery(''); }}
          >
            {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-stone-500 font-medium tabular-nums">
            <span>{isRtl ? `عرض ${filteredReviews.length} من إجمالي ${allReviews.length} تقييم` : `Showing ${filteredReviews.length} of ${allReviews.length} reviews`}</span>
          </div>

          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-stone-200/70 p-5 shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gold-50 ring-1 ring-inset ring-gold-200/70 flex items-center justify-center text-chocolate-900 font-semibold overflow-hidden shrink-0">
                    {review.userAvatar ? (
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <User className="w-[18px] h-[18px] text-gold-700" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-chocolate-900 me-0.5">
                        {review.userName}
                      </h4>
                      <span className="inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-medium tabular-nums bg-stone-100 text-stone-500">
                        #{review.id}
                      </span>
                      <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ${
                        review.type === 'room'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/70'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                      }`}>
                        {review.type === 'room' ? (isRtl ? 'غرفة اجتماعات' : 'Meeting Room') : (isRtl ? 'كافيه 90' : 'Cafe')}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 mt-0.5 tabular-nums">
                      {review.date}
                    </p>
                  </div>
                </div>

                {/* Stars & Delete Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="inline-flex items-center gap-0.5 h-8 px-2.5 rounded-lg bg-stone-50 border border-stone-200/70 text-gold-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating ? 'fill-gold-500 text-gold-500' : 'text-stone-300'
                        }`}
                      />
                    ))}
                    <span className="text-[13px] font-semibold text-chocolate-900 tabular-nums ms-1.5">
                      {review.rating}.0
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-8 !w-8 !px-0 !text-stone-400 hover:!text-rose-600 hover:!bg-rose-50"
                    onClick={() => setDeletingReview(review)}
                    title={isRtl ? 'حذف التقييم' : 'Delete Review'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Review Comment Text */}
              <p className="text-[13px] sm:text-sm text-chocolate-900 leading-relaxed bg-stone-50/70 px-4 py-3 rounded-xl border border-stone-200/60">
                "{review.comment}"
              </p>

              {/* Attached Customer Photos Strip */}
              {review.imageUrls.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isRtl ? 'الصور المرفقة من العميل:' : 'Customer Attached Photos:'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {review.imageUrls.map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewImageUrl(imgUrl)}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200/70 bg-stone-100 cursor-pointer group shadow-2xs hover:border-stone-300 transition-all shrink-0"
                      >
                        <img
                          src={imgUrl}
                          alt={`Review Attachment ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-Size Image Preview Modal */}
      {previewImageUrl && (
        <Modal
          isOpen={Boolean(previewImageUrl)}
          onClose={() => setPreviewImageUrl(null)}
          title={isRtl ? "صورة تجربة العميل" : "Customer Photo Preview"}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={previewImageUrl}
              alt="Full Preview"
              className="max-h-[75vh] w-auto object-contain rounded-xl border border-stone-200/70"
            />
          </div>
        </Modal>
      )}

      {/* Delete Review Confirmation Dialog */}
      {deletingReview && (
        <ConfirmDialog
          isOpen={Boolean(deletingReview)}
          onClose={() => setDeletingReview(null)}
          onConfirm={handleDeleteReviewConfirm}
          title={isRtl ? 'حذف هذا التقييم؟' : 'Delete Customer Review?'}
          message={isRtl
            ? `هل أنت متأكد من رغبتك في حذف تقييم العميل "${deletingReview.userName}" نهائياً من السيرفر والتطبيق؟`
            : `Are you sure you want to delete this review by "${deletingReview.userName}"?`
          }
          loading={deleting}
        />
      )}

      {/* Submit Review Modal (POST /reviews) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={isRtl ? "إرسال تقييم جديد (Submit Review)" : "Submit Customer Review"}
        subtitle={isRtl ? "إرسال تقييم للكافيه أو لغرف الاجتماعات مع إمكانية إرفاق الصور" : "Post a review for Cafe 90 or meeting rooms with photo attachments"}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={submittingReview}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              icon={Plus}
              loading={submittingReview}
              onClick={handleSubmitReview}
            >
              {isRtl ? 'إرسال التقييم' : 'Submit Review'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-sm">
          {/* Interactive Star Rating Selector */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'التقييم بالنجوم (Rating) *' : 'Star Rating *'}
            </label>
            <div className="flex flex-wrap items-center gap-1 p-3 rounded-xl border border-stone-200/70">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  className="p-1 rounded-lg text-gold-500 hover:bg-gold-50 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (reviewHoverRating || reviewRating)
                        ? 'fill-gold-500 text-gold-500'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-[13px] font-semibold text-chocolate-900 tabular-nums ms-2">
                {reviewRating} {isRtl ? 'من 5 نجوم' : 'of 5 Stars'}
              </span>
            </div>
          </div>

          {/* Target Type: Cafe or Room */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'جهة التقييم (كافيه 90 أو غرفة محددة)' : 'Review Target'}
            </label>
            <select
              value={reviewRoomId}
              onChange={(e) => setReviewRoomId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition cursor-pointer"
            >
              <option value="">{isRtl ? '☕ تقييم عام لـ كافيه 90' : '☕ General Cafe 90 Review'}</option>
              {availableRooms.map(room => (
                <option key={room.id} value={room.id}>
                  🚪 {room.name_ar || room.name} (#{room.id})
                </option>
              ))}
            </select>
          </div>

          {/* Comment Text */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'نص التعليق والتقييم *' : 'Review Comment *'}
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={isRtl ? "اكتب تفاصيل التجربة والخدمة..." : "Write your experience and feedback..."}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition leading-relaxed resize-none"
              required
            />
          </div>

          {/* Photos Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-semibold text-chocolate-800">
                {isRtl ? 'إرفاق صور التجربة (اختياري)' : 'Attach Experience Photos (Optional)'}
              </label>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="h-7 px-2 rounded-lg text-xs text-gold-700 font-semibold hover:text-gold-800 hover:bg-gold-50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'اختيار صور' : 'Select Photos'}</span>
              </button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleReviewImagesChange}
              className="hidden"
            />

            {reviewImagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {reviewImagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200/70 shadow-2xs group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveReviewImage(idx)}
                      className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/55 hover:bg-rose-600 backdrop-blur text-white ring-1 ring-white/20 flex items-center justify-center text-[11px] cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
