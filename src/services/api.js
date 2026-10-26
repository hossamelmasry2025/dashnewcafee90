/**
 * Cafe 90 Admin API Service
 * Centralized API integration with live Laravel Backend.
 */

import { apiClient } from './apiClient';

// Helper to normalize array responses if backend wraps in data: [...] or specific keys
const extractData = (res) => {
  if (!res) return null;
  if (Array.isArray(res)) return res;
  if (res.data !== undefined) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data && typeof res.data === 'object') {
      if (Array.isArray(res.data.categories)) return res.data.categories;
      if (Array.isArray(res.data.subcategories)) return res.data.subcategories;
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data.orders)) return res.data.orders;
      if (Array.isArray(res.data.data)) return res.data.data;
      if (Array.isArray(res.data.rooms)) return res.data.rooms;
      if (Array.isArray(res.data.facilities)) return res.data.facilities;
      if (Array.isArray(res.data.bookings)) return res.data.bookings;
      if (Array.isArray(res.data.tables)) return res.data.tables;
      if (Array.isArray(res.data.coupons)) return res.data.coupons;
      if (res.data.points_settings) return res.data.points_settings;
      if (res.data.table) return res.data.table;
      if (res.data.coupon) return res.data.coupon;
      if (res.data.subcategory) return res.data.subcategory;
      if (res.data.category) return res.data.category;
      if (res.data.item) return res.data.item;
      if (res.data.order && typeof res.data.order === 'object') return res.data.order;
      if (res.data.banner) return res.data.banner;
      if (res.data.banner2) return res.data.banner2;
      if (res.data.banner3) return res.data.banner3;
      if (Array.isArray(res.data.users)) return res.data.users;
      if (res.data.user && typeof res.data.user === 'object') return res.data.user;
      if (Array.isArray(res.data.banners)) return res.data.banners;
      if (Array.isArray(res.data.banner2s)) return res.data.banner2s;
      if (Array.isArray(res.data.banner3s)) return res.data.banner3s;
    }
    return res.data;
  }
  if (res.order && typeof res.order === 'object') return res.order;
  if (Array.isArray(res.orders)) return res.orders;
  if (Array.isArray(res.categories)) return res.categories;
  if (Array.isArray(res.subcategories)) return res.subcategories;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.rooms)) return res.rooms;
  if (Array.isArray(res.facilities)) return res.facilities;
  if (Array.isArray(res.bookings)) return res.bookings;
  if (Array.isArray(res.tables)) return res.tables;
  if (Array.isArray(res.coupons)) return res.coupons;
  if (Array.isArray(res.reviews)) return res.reviews;
  if (Array.isArray(res.banners)) return res.banners;
  if (Array.isArray(res.banner2s)) return res.banner2s;
  if (Array.isArray(res.banner3s)) return res.banner3s;
  if (res.table && typeof res.table === 'object') return res.table;
  if (res.subcategory && typeof res.subcategory === 'object') return res.subcategory;
  if (res.category && typeof res.category === 'object') return res.category;
  if (res.item && typeof res.item === 'object') return res.item;
  if (res.points_settings && typeof res.points_settings === 'object') return res.points_settings;
  if (res.coupon && typeof res.coupon === 'object') return res.coupon;
  if (res.banner && typeof res.banner === 'object') return res.banner;
  if (res.banner2 && typeof res.banner2 === 'object') return res.banner2;
  if (res.banner3 && typeof res.banner3 === 'object') return res.banner3;
  if (res.room && typeof res.room === 'object') return res.room;
  if (res.booking && typeof res.booking === 'object') return res.booking;
  if (res.order && typeof res.order === 'object') return res.order;
  return res;
};

// In-memory request deduplication and caching for high-frequency endpoints
const pendingRequests = new Map();
const responseCache = new Map();
const DEFAULT_BANNER_CACHE_TTL = 15000; // 15 seconds

const fetchWithDedupe = async (key, fetcher, ttl = DEFAULT_BANNER_CACHE_TTL) => {
  const cached = responseCache.get(key);
  if (cached && (Date.now() - cached.time < ttl)) {
    return cached.data;
  }
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = (async () => {
    try {
      const res = await fetcher();
      responseCache.set(key, { data: res, time: Date.now() });
      return res;
    } finally {
      pendingRequests.delete(key);
    }
  })();
  pendingRequests.set(key, promise);
  return promise;
};

const invalidateBannerCache = () => {
  responseCache.delete('/banners');
  responseCache.delete('/banner2s');
  responseCache.delete('/banner3s');
};

// Reviews may come back as a flat array or as { cafe_reviews, room_reviews } — always return one flat array
export const flattenReviews = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const cafe = Array.isArray(val.cafe_reviews) ? val.cafe_reviews : [];
  const room = Array.isArray(val.room_reviews) ? val.room_reviews : [];
  if (cafe.length || room.length) return [...cafe, ...room];
  if (Array.isArray(val.reviews)) return val.reviews;
  if (Array.isArray(val.data)) return val.data;
  return [];
};

export const api = {
  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------
  async login(credentials) {
    let body;
    if (credentials instanceof FormData) {
      body = credentials;
    } else {
      const fd = new FormData();
      fd.append('email', credentials.email);
      fd.append('password', credentials.password);
      body = fd;
    }
    return apiClient.post('/login', body);
  },

  async logout() {
    return apiClient.post('/logout', {});
  },

  async getProfile() {
    const res = await apiClient.get('/me');
    return extractData(res);
  },

  // ----------------------------------------------------
  // USERS & GUESTS DIRECTORY (/admin/users)
  // ----------------------------------------------------
  /**
   * Fetch users list with search, role and pagination parameters
   * Endpoint: GET /admin/users?search=...&role=...&per_page=...&page=...
   */
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'all') query.append('role', params.role);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.page) query.append('page', params.page);
    const qs = query.toString();
    const endpoint = qs ? `/admin/users?${qs}` : '/admin/users';
    const res = await apiClient.get(endpoint, {}, { forceFresh: true });
    return res;
  },

  /**
   * Fetch single user details (Profile + Recent Activity: orders, bookings, reviews)
   * Endpoint: GET /admin/users/{id}
   */
  async getUserDetails(id) {
    const res = await apiClient.get(`/admin/users/${id}`, {}, { forceFresh: true });
    // Keep complete payload if it includes relations (orders, bookings, reviews, activity)
    if (res && res.data !== undefined) {
      return res.data;
    }
    return res;
  },

  // ----------------------------------------------------
  // ADMIN KPI STATS (GET /admin/stats)
  // ----------------------------------------------------
  /**
   * Fetch live KPI stats from GET /admin/stats
   * Supports date filtering with { from, to } formatted as YYYY-MM-DD
   */
  async getAdminStats(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    const qs = query.toString();
    const endpoint = qs ? `/admin/stats?${qs}` : '/admin/stats';
    const res = await apiClient.get(endpoint, {}, { forceFresh: true });
    return extractData(res) || res;
  },

  async getDashboardStats(params = {}) {
    try {
      const [ordersRes, pendingOrdersRes, roomsRes, reviewsRes, usersRes, backendStatsRes] = await Promise.allSettled([
        this.getOrders({ per_page: 200, force: true }),
        this.getPendingOrders({ force: true }),
        this.getRooms ? this.getRooms() : apiClient.get('/rooms'),
        this.getReviews ? this.getReviews() : apiClient.get('/reviews'),
        this.getUsers(),
        this.getAdminStats(params)
      ]);

      const rawOrders = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      const orders = Array.isArray(rawOrders) ? rawOrders : [];

      const rawPending = pendingOrdersRes.status === 'fulfilled' ? pendingOrdersRes.value : [];
      const pendingOrders = Array.isArray(rawPending) ? rawPending : [];

      const rawRooms = roomsRes.status === 'fulfilled' ? (extractData(roomsRes.value) || roomsRes.value) : [];
      const rooms = Array.isArray(rawRooms) ? rawRooms : [];

      const rawReviews = reviewsRes.status === 'fulfilled' ? (extractData(reviewsRes.value) || reviewsRes.value) : [];
      const reviews = flattenReviews(rawReviews);

      const rawUsers = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const users = Array.isArray(rawUsers) ? rawUsers : [];

      const rawBackendStats = backendStatsRes.status === 'fulfilled' ? (extractData(backendStatsRes.value) || backendStatsRes.value) : null;
      const backendByStatus = rawBackendStats?.orders_by_status || rawBackendStats?.ordersByStatus || null;

      // Calculate total revenue: from backend stats or sum of confirmed + ready + completed per specification
      const totalRevenue = (rawBackendStats && (rawBackendStats.total_revenue ?? rawBackendStats.revenue ?? rawBackendStats.totalRevenue) != null)
        ? Number(rawBackendStats.total_revenue ?? rawBackendStats.revenue ?? rawBackendStats.totalRevenue)
        : orders.reduce((sum, o) => {
            const s = String(o.status || '').toLowerCase();
            // Confirmed, Ready, and Completed count towards revenue
            if (s === 'confirmed' || s === 'ready' || s === 'completed' || s === 'delivered') {
              return sum + (Number(o.total_price || o.total || o.price || 0));
            }
            return sum;
          }, 0);

      const totalOrders = rawBackendStats?.total_orders != null ? Number(rawBackendStats.total_orders) : orders.length;

      const pendingOrdersCount = backendByStatus?.pending != null 
        ? Number(backendByStatus.pending)
        : (pendingOrders.length || orders.filter(o => {
            const s = String(o.status || '').toLowerCase();
            return s === 'pending' || s === 'new' || s === 'open';
          }).length);

      const newReviewsThisWeek = reviews.filter(r => {
        const s = String(r.status || '').toLowerCase();
        return s === 'pending' || (!r.adminReply && !r.admin_reply);
      }).length;

      // Real status distribution (strictly from real orders / backend stats, supports ready & completed)
      const completedCount = backendByStatus?.completed != null
        ? Number(backendByStatus.completed)
        : orders.filter(o => {
            const s = String(o.status || '').toLowerCase();
            return s === 'completed' || s === 'delivered';
          }).length;

      const preparingCount = backendByStatus?.confirmed != null || backendByStatus?.preparing != null
        ? Number(backendByStatus.confirmed ?? backendByStatus.preparing ?? 0)
        : orders.filter(o => {
            const s = String(o.status || '').toLowerCase();
            return s === 'confirmed' || s === 'preparing' || s === 'in_kitchen' || s === 'cooking';
          }).length;

      const readyCount = backendByStatus?.ready != null
        ? Number(backendByStatus.ready)
        : orders.filter(o => {
            const s = String(o.status || '').toLowerCase();
            return s === 'ready' || s === 'served';
          }).length;

      const cancelledCount = backendByStatus?.rejected != null || backendByStatus?.cancelled != null
        ? Number(backendByStatus.rejected ?? backendByStatus.cancelled ?? 0)
        : orders.filter(o => {
            const s = String(o.status || '').toLowerCase();
            return s === 'cancelled' || s === 'rejected';
          }).length;

      // Unique customers / loyalty members
      const activeCustomers = users.length > 0 
        ? users.filter(u => u.role !== 'admin').length || users.length
        : new Set(orders.map(o => o.user_id || o.user?.id || o.customerPhone || o.customer_phone).filter(Boolean)).size;

      // Average rating
      const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
        : '0.0';

      // Growth calculations based on real data
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      let thisWeekRevenue = 0;
      let lastWeekRevenue = 0;
      let thisWeekOrders = 0;
      let lastWeekOrders = 0;

      orders.forEach(o => {
        const t = new Date(o.created_at || o.createdAt || 0).getTime();
        const price = Number(o.total_price || o.total || o.price || 0);
        if (t >= now - sevenDaysMs) {
          thisWeekRevenue += price;
          thisWeekOrders += 1;
        } else if (t >= now - fourteenDaysMs) {
          lastWeekRevenue += price;
          lastWeekOrders += 1;
        }
      });

      const calcGrowthPct = (current, previous) => {
        if (!previous || previous === 0) {
          return current > 0 ? '+100%' : '0%';
        }
        const diff = Math.round(((current - previous) / previous) * 100);
        return diff >= 0 ? `+${diff}%` : `${diff}%`;
      };

      const revenueGrowth = orders.length > 0 ? calcGrowthPct(thisWeekRevenue, lastWeekRevenue) : '0%';
      const ordersGrowth = orders.length > 0 ? calcGrowthPct(thisWeekOrders, lastWeekOrders) : '0%';
      const customersGrowth = '0%';

      // Real Revenue Analytics (Real sales grouped by timeframe, zeroed out when no orders)
      const curDate = new Date();
      const dailySlots = [
        { name: '08:00', revenue: 0 },
        { name: '12:00', revenue: 0 },
        { name: '16:00', revenue: 0 },
        { name: '20:00', revenue: 0 },
        { name: '00:00', revenue: 0 }
      ];

      const weekDaySlots = [
        { dayIndex: 1, name: 'Mon', revenue: 0 },
        { dayIndex: 2, name: 'Tue', revenue: 0 },
        { dayIndex: 3, name: 'Wed', revenue: 0 },
        { dayIndex: 4, name: 'Thu', revenue: 0 },
        { dayIndex: 5, name: 'Fri', revenue: 0 },
        { dayIndex: 6, name: 'Sat', revenue: 0 },
        { dayIndex: 0, name: 'Sun', revenue: 0 }
      ];

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlySlots = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
        monthlySlots.push({ monthIndex: d.getMonth(), name: monthNames[d.getMonth()], revenue: 0 });
      }

      orders.forEach(o => {
        const s = String(o.status || '').toLowerCase();
        if (s === 'cancelled' || s === 'rejected') return;
        const val = Number(o.total_price || o.total || o.price || 0);
        if (!val) return;
        const oDate = new Date(o.created_at || o.createdAt || 0);
        if (isNaN(oDate.getTime())) return;

        // Daily (if today)
        if (oDate.toDateString() === curDate.toDateString()) {
          const h = oDate.getHours();
          if (h < 10) dailySlots[0].revenue += val;
          else if (h < 14) dailySlots[1].revenue += val;
          else if (h < 18) dailySlots[2].revenue += val;
          else if (h < 22) dailySlots[3].revenue += val;
          else dailySlots[4].revenue += val;
        }

        // Weekly (if in last 7 days)
        const diffMs = curDate.getTime() - oDate.getTime();
        if (diffMs <= sevenDaysMs && diffMs >= 0) {
          const w = weekDaySlots.find(slot => slot.dayIndex === oDate.getDay());
          if (w) w.revenue += val;
        }

        // Monthly (match month)
        const m = monthlySlots.find(slot => slot.monthIndex === oDate.getMonth());
        if (m) m.revenue += val;
      });

      // Top Selling Items aggregated from real orders
      const itemCounts = new Map();
      orders.forEach(o => {
        const rawItems = o.items || o.order_items || [];
        if (Array.isArray(rawItems)) {
          rawItems.forEach(it => {
            const id = it.item_id || it.id || it.name;
            if (!id) return;
            const existing = itemCounts.get(id) || {
              id,
              name: it.name || it.name_ar || it.name_en || 'صنف',
              nameAr: it.name_ar || it.name || '',
              nameEn: it.name_en || '',
              price: Number(it.price || 0),
              imageUrl: it.image_url || it.image || '',
              rating: '5.0',
              reviewCount: 0,
              stockStatus: 'in_stock',
              stockCount: 0,
              soldCount: 0
            };
            existing.soldCount += Number(it.quantity || 1);
            itemCounts.set(id, existing);
          });
        }
      });
      const topSellingItems = Array.from(itemCounts.values())
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5);

      // Recent orders normalized for table display
      const recentOrders = orders.slice(0, 6).map(o => ({
        id: o.id,
        orderNumber: o.order_number || o.orderNumber || o.id,
        customerName: o.user?.name || o.customer_name || o.customerName || (o.sender_name || 'عميل كافيه 90'),
        customerPhone: o.user?.phone || o.customerPhone || o.customer_phone || '—',
        diningType: o.dining_type || o.diningType || 'Takeaway',
        totalPrice: Number(o.total_price || o.total || o.price || 0),
        status: (o.status || 'pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1).toLowerCase(),
        raw: o
      }));

      return {
        totalRevenue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        activeCustomers,
        customersGrowth,
        averageRating,
        totalReviews: reviews.length,
        newReviewsThisWeek,
        averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
        pendingOrdersCount,
        activeRoomsCount: rooms.length,
        revenueAnalytics: {
          daily: dailySlots.map(({ name, revenue }) => ({ name, revenue })),
          weekly: weekDaySlots.map(({ name, revenue }) => ({ name, revenue })),
          monthly: monthlySlots.map(({ name, revenue }) => ({ name, revenue }))
        },
        orderDistribution: [
          { name: 'Completed', value: completedCount, color: '#10B981' },
          { name: 'Preparing', value: preparingCount, color: '#F97316' },
          { name: 'Pending', value: pendingOrdersCount, color: '#F59E0B' },
          { name: 'Ready', value: readyCount, color: '#3B82F6' },
          { name: 'Cancelled', value: cancelledCount, color: '#EF4444' }
        ],
        topSellingItems,
        recentOrders
      };
    } catch (e) {
      console.warn('Dashboard stats fallback calculation:', e);
      return {
        totalRevenue: 0,
        revenueGrowth: '0%',
        totalOrders: 0,
        ordersGrowth: '0%',
        activeCustomers: 0,
        customersGrowth: '0%',
        averageRating: '0.0',
        totalReviews: 0,
        newReviewsThisWeek: 0,
        averageOrderValue: 0,
        pendingOrdersCount: 0,
        activeRoomsCount: 0,
        revenueAnalytics: {
          daily: [
            { name: '08:00', revenue: 0 },
            { name: '12:00', revenue: 0 },
            { name: '16:00', revenue: 0 },
            { name: '20:00', revenue: 0 },
            { name: '00:00', revenue: 0 }
          ],
          weekly: [
            { name: 'Mon', revenue: 0 },
            { name: 'Tue', revenue: 0 },
            { name: 'Wed', revenue: 0 },
            { name: 'Thu', revenue: 0 },
            { name: 'Fri', revenue: 0 },
            { name: 'Sat', revenue: 0 },
            { name: 'Sun', revenue: 0 }
          ],
          monthly: [
            { name: 'Jan', revenue: 0 },
            { name: 'Feb', revenue: 0 },
            { name: 'Mar', revenue: 0 }
          ]
        },
        orderDistribution: [
          { name: 'Completed', value: 0, color: '#10B981' },
          { name: 'Preparing', value: 0, color: '#D4A037' },
          { name: 'Pending', value: 0, color: '#F59E0B' },
          { name: 'Ready for Pickup', value: 0, color: '#3B82F6' },
          { name: 'Cancelled', value: 0, color: '#EF4444' }
        ],
        topSellingItems: [],
        recentOrders: []
      };
    }
  },

  // ----------------------------------------------------
  // ORDERS MANAGEMENT (/admin/orders)
  // ----------------------------------------------------
  async getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.payment_type && params.payment_type !== 'all') query.append('payment_type', params.payment_type);
    if (!params.per_page) query.append('per_page', '100');
    const qs = query.toString() ? `?${query.toString()}` : '';
    const getOptions = { force: params.force === true };
    try {
      const res = await apiClient.get(`/admin/orders${qs}`, {}, getOptions);
      const extracted = extractData(res);
      if (Array.isArray(extracted) && extracted.length > 0) return extracted;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
      if (res?.orders && Array.isArray(res.orders)) return res.orders;
      return Array.isArray(extracted) ? extracted : [];
    } catch (err) {
      console.warn('GET /admin/orders failed, trying fallback /orders:', err);
      try {
        const fallback = await apiClient.get(`/orders${qs}`, {}, getOptions);
        const fbExtracted = extractData(fallback);
        return Array.isArray(fbExtracted) ? fbExtracted : [];
      } catch {
        return [];
      }
    }
  },

  async getPendingOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.payment_type && params.payment_type !== 'all') query.append('payment_type', params.payment_type);
    if (!params.per_page) query.append('per_page', '100');
    const qs = query.toString() ? `?${query.toString()}` : '';
    const getOptions = { force: params.force === true };
    try {
      const res = await apiClient.get(`/admin/orders/pending${qs}`, {}, getOptions);
      const extracted = extractData(res);
      if (Array.isArray(extracted) && extracted.length > 0) return extracted;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
      if (res?.orders && Array.isArray(res.orders)) return res.orders;
      return Array.isArray(extracted) ? extracted : [];
    } catch (err) {
      console.warn('GET /admin/orders/pending failed:', err);
      return [];
    }
  },

  async getOrderDetails(id, options = {}) {
    const getOptions = { force: options.force === true };
    try {
      const res = await apiClient.get(`/admin/orders/${id}`, {}, getOptions);
      return extractData(res);
    } catch (err) {
      try {
        const fallback = await apiClient.get(`/orders/${id}`, {}, getOptions);
        return extractData(fallback);
      } catch {
        throw err;
      }
    }
  },

  async confirmOrder(id) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    return await apiClient.post(`/admin/orders/${id}/confirm`, {});
  },

  async markOrderReady(id) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    return await apiClient.post(`/admin/orders/${id}/ready`, {});
  },

  async completeOrder(id) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    return await apiClient.post(`/admin/orders/${id}/complete`, {});
  },

  async updateOrderStatus(id, status) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'complete') {
      return await this.completeOrder(id);
    }
    if (s === 'ready') {
      return await this.markOrderReady(id);
    }
    if (s === 'confirmed' || s === 'confirm') {
      return await this.confirmOrder(id);
    }
    if (s === 'rejected' || s === 'cancelled') {
      return await this.rejectOrder(id);
    }
    try {
      return await apiClient.post(`/admin/orders/${id}/${s}`, {});
    } catch (err) {
      try {
        return await apiClient.post(`/admin/orders/${id}/status`, { status });
      } catch {
        return await apiClient.put(`/admin/orders/${id}`, { status });
      }
    }
  },

  async createOrder(data) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    try {
      return await apiClient.post('/orders', data);
    } catch (err) {
      return await apiClient.post('/admin/orders', data);
    }
  },

  async rejectOrder(id, note = '') {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    const res = await apiClient.post(`/admin/orders/${id}/reject`, {
      note,
      reason: note,
      admin_note: note
    });
    return extractData(res) || res?.order || res;
  },

  async receiveOrder(id) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    try {
      return await apiClient.post(`/admin/orders/${id}/receive`, {});
    } catch (err) {
      return await apiClient.post(`/admin/orders/${id}/received`, {});
    }
  },

  async acknowledgeRound(orderId, roundId, data = {}) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    const res = await apiClient.post(`/admin/orders/${orderId}/rounds/${roundId}/acknowledge`, data);
    return res;
  },

  async serveRound(orderId, roundId, data = {}) {
    apiClient.invalidateCache('/admin/orders');
    apiClient.invalidateCache('/orders');
    const res = await apiClient.post(`/admin/orders/${orderId}/rounds/${roundId}/serve`, data);
    return res;
  },

  async getOpenOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.payment_type && params.payment_type !== 'all') query.append('payment_type', params.payment_type);
    if (!params.per_page) query.append('per_page', '100');
    const qs = query.toString() ? `?${query.toString()}` : '';
    const getOptions = { force: params.force === true };
    try {
      const res = await apiClient.get(`/admin/orders/open${qs}`, {}, getOptions);
      const extracted = extractData(res);
      if (Array.isArray(extracted) && extracted.length > 0) return extracted;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
      if (res?.orders && Array.isArray(res.orders)) return res.orders;
      return Array.isArray(extracted) ? extracted : [];
    } catch (err) {
      try {
        const res2 = await apiClient.get(`/admin/orders?status=open${qs ? `&${qs.slice(1)}` : ''}`, {}, getOptions);
        const fb = extractData(res2);
        return Array.isArray(fb) ? fb : [];
      } catch {
        return [];
      }
    }
  },

  async getConfirmedOrders(params = {}) {
    const getOptions = { force: params.force === true };
    try {
      const res = await apiClient.get('/admin/orders/confirmed', {}, getOptions);
      return extractData(res);
    } catch (err) {
      try {
        const res2 = await apiClient.get('/admin/orders?status=confirmed', {}, getOptions);
        return extractData(res2);
      } catch {
        return [];
      }
    }
  },

  async getRejectedOrders(params = {}) {
    const getOptions = { force: params.force === true };
    try {
      const res = await apiClient.get('/admin/orders/rejected', {}, getOptions);
      return extractData(res);
    } catch (err) {
      try {
        const res2 = await apiClient.get('/admin/orders?status=rejected', {}, getOptions);
        return extractData(res2);
      } catch {
        return [];
      }
    }
  },

  // ----------------------------------------------------
  // CATEGORIES & SUBCATEGORIES
  // ----------------------------------------------------
  async getCategories(options = {}) {
    const res = await apiClient.get('/categories', {}, { force: options.force === true });
    return extractData(res);
  },

  async getCategoryById(id) {
    const res = await apiClient.get(`/categories/${id}`);
    return extractData(res);
  },

  async createCategory(formData) {
    return apiClient.post('/categories', formData);
  },

  async updateCategory(id, formData) {
    return apiClient.postMultipartPut(`/categories/${id}`, formData);
  },

  async deleteCategory(id) {
    return apiClient.delete(`/categories/${id}`);
  },

  // Trashed Categories (Soft Delete) - GET /api/admin/categories/trashed
  async getTrashedCategories() {
    try {
      const res = await apiClient.get('/admin/categories/trashed', {}, { force: true });
      return extractData(res) || [];
    } catch (err) {
      console.warn('getTrashedCategories notice:', err?.message);
      return [];
    }
  },

  // Restore Category - POST /api/admin/categories/{id}/restore
  async restoreCategory(id) {
    try {
      const res = await apiClient.post(`/admin/categories/${id}/restore`);
      apiClient.invalidateCache('/categories');
      apiClient.invalidateCache('/admin/categories');
      return res;
    } catch (err) {
      try {
        const res = await apiClient.post(`/categories/${id}/restore`);
        apiClient.invalidateCache('/categories');
        return res;
      } catch {
        throw err;
      }
    }
  },

  async getSubcategories(options = {}) {
    const res = await apiClient.get('/subcategories', {}, { force: options.force === true });
    return extractData(res);
  },

  async getSubcategoriesByCategory(categoryId) {
    const res = await apiClient.get(`/categories/${categoryId}/subcategories`);
    return extractData(res);
  },

  async getSubcategoryById(id) {
    const res = await apiClient.get(`/subcategories/${id}`);
    return extractData(res);
  },

  async createSubcategory(data) {
    let body;
    if (data instanceof FormData) {
      body = data;
    } else {
      body = data;
    }
    return apiClient.post('/subcategories', body);
  },

  async updateSubcategory(id, data) {
    try {
      if (data instanceof FormData) {
        return await apiClient.postMultipartPut(`/subcategories/${id}`, data);
      }
      return await apiClient.put(`/subcategories/${id}`, data);
    } catch (err) {
      if (err?.status === 405) {
        if (data instanceof FormData) {
          return await apiClient.put(`/subcategories/${id}`, data);
        } else {
          return await apiClient.postMultipartPut(`/subcategories/${id}`, data);
        }
      }
      throw err;
    }
  },

  async deleteSubcategory(id) {
    return apiClient.delete(`/subcategories/${id}`);
  },

  // ----------------------------------------------------
  // MENU ITEMS (/items)
  // ----------------------------------------------------
  async getItems(params = {}) {
    let query = '';
    if (typeof params === 'object' && params !== null && Object.keys(params).length > 0) {
      const sp = new URLSearchParams();
      if (params.search && String(params.search).trim()) {
        sp.set('search', String(params.search).trim());
      }
      if (params.category_id && params.category_id !== 'all') {
        sp.set('category_id', String(params.category_id));
      }
      if (params.subcategory_id && params.subcategory_id !== 'all') {
        sp.set('subcategory_id', String(params.subcategory_id));
      }
      if (params.page) {
        sp.set('page', String(params.page));
      }
      if (params.per_page) {
        sp.set('per_page', String(params.per_page));
      } else if (params.limit) {
        sp.set('per_page', String(params.limit));
      }
      const qs = sp.toString();
      if (qs) query = `?${qs}`;
    }
    const res = await apiClient.get(`/items${query}`, {}, { force: true });
    
    // Normalize response items array
    let items = [];
    if (Array.isArray(res?.items)) {
      items = res.items;
    } else if (Array.isArray(res?.data?.items)) {
      items = res.data.items;
    } else if (Array.isArray(res?.data)) {
      items = res.data;
    } else if (Array.isArray(res)) {
      items = res;
    }

    // Extract pagination metadata (handling backend format: current_page, last_page, per_page, total)
    const rawPagination = res?.pagination || res?.data?.pagination || null;
    const currentPage = Number(rawPagination?.current_page ?? rawPagination?.currentPage ?? rawPagination?.page ?? params.page ?? 1);
    const perPage = Number(rawPagination?.per_page ?? rawPagination?.perPage ?? rawPagination?.limit ?? params.per_page ?? params.limit ?? 20);
    const total = Number(rawPagination?.total ?? rawPagination?.total_items ?? rawPagination?.totalItems ?? items.length);
    const lastPage = Number(rawPagination?.last_page ?? rawPagination?.lastPage ?? rawPagination?.total_pages ?? rawPagination?.totalPages ?? Math.max(1, Math.ceil(total / (perPage || 1))));

    const pagination = {
      current_page: currentPage,
      currentPage,
      page: currentPage,
      per_page: perPage,
      perPage,
      limit: perPage,
      last_page: lastPage,
      lastPage,
      total_pages: lastPage,
      totalPages: lastPage,
      total,
      total_items: total,
      totalItems: total,
      from: total > 0 ? (currentPage - 1) * perPage + 1 : 0,
      to: total > 0 ? Math.min(currentPage * perPage, total) : 0,
      has_more: currentPage < lastPage,
      hasMore: currentPage < lastPage
    };

    return {
      items,
      pagination,
      data: items,
      raw: res,
      length: items.length,
      [Symbol.iterator]: function* () {
        yield* items;
      }
    };
  },

  async getBestSellers(limit = 10) {
    const res = await apiClient.get(`/items/best-sellers?limit=${limit}`);
    return extractData(res);
  },

  async getItemById(id) {
    const res = await apiClient.get(`/items/${id}`);
    return extractData(res);
  },

  async getItemsBySubcategory(subcategoryId) {
    const res = await apiClient.get(`/subcategories/${subcategoryId}/items`);
    return extractData(res);
  },

  async getOffers() {
    const res = await apiClient.get('/items/offers');
    return extractData(res);
  },

  async getItemsRedeemableWithPoints() {
    const res = await apiClient.get('/items/redeemable-with-points');
    return extractData(res);
  },

  async createItem(formData) {
    return apiClient.post('/items', formData);
  },

  async updateItem(id, formData) {
    return apiClient.postMultipartPut(`/items/${id}`, formData);
  },

  async setItemOffer(id, offerPrice, offerActive = true) {
    const fd = new FormData();
    fd.append('offer_price', String(offerPrice));
    fd.append('offer_active', offerActive ? '1' : '0');
    fd.append('is_on_offer', offerActive ? '1' : '0');
    return apiClient.postMultipartPut(`/items/${id}`, fd);
  },

  async deactivateItemOffer(id) {
    const fd = new FormData();
    fd.append('offer_active', '0');
    fd.append('is_on_offer', '0');
    fd.append('offer_price', '');
    fd.append('discount_value', '');
    return apiClient.postMultipartPut(`/items/${id}`, fd);
  },

  async toggleItemRedeemablePoints(id, pointsPrice, redeemable = true) {
    const fd = new FormData();
    if (pointsPrice !== undefined && pointsPrice !== null) {
      fd.append('points_price', String(pointsPrice));
    }
    fd.append('redeemable_with_points', redeemable ? '1' : '0');
    return apiClient.postMultipartPut(`/items/${id}`, fd);
  },

  async deleteItem(id) {
    try {
      return await apiClient.delete(`/items/${id}`);
    } catch (err) {
      try {
        return await apiClient.delete(`/admin/items/${id}`);
      } catch {
        try {
          const fd = new FormData();
          fd.append('_method', 'DELETE');
          return await apiClient.post(`/items/${id}`, fd);
        } catch {
          try {
            const fd = new FormData();
            fd.append('_method', 'DELETE');
            return await apiClient.post(`/admin/items/${id}`, fd);
          } catch {
            try {
              return await apiClient.post(`/items/delete/${id}`);
            } catch {
              try {
                return await apiClient.post(`/admin/items/delete/${id}`);
              } catch {
                throw err;
              }
            }
          }
        }
      }
    }
  },

  // Trashed Items (Soft Delete) - GET /api/admin/items/trashed
  async getTrashedItems() {
    try {
      const res = await apiClient.get('/admin/items/trashed', {}, { force: true });
      return extractData(res) || [];
    } catch (err) {
      console.warn('getTrashedItems notice:', err?.message);
      return [];
    }
  },

  // Restore Item - POST /api/admin/items/{id}/restore
  async restoreItem(id) {
    try {
      const res = await apiClient.post(`/admin/items/${id}/restore`);
      apiClient.invalidateCache('/items');
      apiClient.invalidateCache('/admin/items');
      return res;
    } catch (err) {
      try {
        const res = await apiClient.post(`/items/${id}/restore`);
        apiClient.invalidateCache('/items');
        return res;
      } catch {
        throw err;
      }
    }
  },

  // ----------------------------------------------------
  // BANNERS (Slider 1: /banners, Slider 2: /banner2s, Slider 3: /banner3s)
  // With request deduplication & in-memory cache to prevent PHP-FPM 500 errors
  // ----------------------------------------------------
  // Banner 1 (Main Slider 1)
  async getBanners(force = false) {
    try {
      return await fetchWithDedupe('/banners', async () => {
        const res = await apiClient.get('/banners');
        return extractData(res) || [];
      }, force ? 0 : DEFAULT_BANNER_CACHE_TTL);
    } catch (e) {
      console.warn('Banners endpoint warning:', e?.message);
      return [];
    }
  },
  async getBannerById(id) {
    const res = await apiClient.get(`/banners/${id}`);
    return extractData(res);
  },
  async createBanner(formData) {
    invalidateBannerCache();
    return apiClient.post('/banners', formData);
  },
  async updateBanner(id, formData) {
    invalidateBannerCache();
    try {
      return await apiClient.postMultipartPut(`/banners/${id}`, formData);
    } catch (err) {
      if (err?.status === 405) {
        return await apiClient.put(`/banners/${id}`, formData);
      }
      throw err;
    }
  },
  async deleteBanner(id) {
    invalidateBannerCache();
    return apiClient.delete(`/banners/${id}`);
  },
  async deleteBannerImage(bannerId, imageId) {
    invalidateBannerCache();
    return apiClient.delete(`/banners/${bannerId}/images/${imageId}`);
  },

  // Banner 2 (Special Offers Slider 2)
  async getBanner2s(force = false) {
    try {
      return await fetchWithDedupe('/banner2s', async () => {
        const res = await apiClient.get('/banner2s');
        return extractData(res) || [];
      }, force ? 0 : DEFAULT_BANNER_CACHE_TTL);
    } catch (e) {
      console.warn('Banner2s endpoint warning:', e?.message);
      return [];
    }
  },
  async getBanner2ById(id) {
    const res = await apiClient.get(`/banner2s/${id}`);
    return extractData(res);
  },
  async createBanner2(formData) {
    invalidateBannerCache();
    return apiClient.post('/banner2s', formData);
  },
  async updateBanner2(id, formData) {
    invalidateBannerCache();
    try {
      return await apiClient.postMultipartPut(`/banner2s/${id}`, formData);
    } catch (err) {
      if (err?.status === 405) {
        return await apiClient.put(`/banner2s/${id}`, formData);
      }
      throw err;
    }
  },
  async deleteBanner2(id) {
    invalidateBannerCache();
    return apiClient.delete(`/banner2s/${id}`);
  },
  async deleteBanner2Image(bannerId, imageId) {
    invalidateBannerCache();
    return apiClient.delete(`/banner2s/${bannerId}/images/${imageId}`);
  },

  // Banner 3 (VIP Rooms Slider 3)
  async getBanner3s(force = false) {
    try {
      return await fetchWithDedupe('/banner3s', async () => {
        const res = await apiClient.get('/banner3s');
        return extractData(res) || [];
      }, force ? 0 : DEFAULT_BANNER_CACHE_TTL);
    } catch (e) {
      console.warn('Banner3s endpoint warning:', e?.message);
      return [];
    }
  },
  async getBanner3ById(id) {
    const res = await apiClient.get(`/banner3s/${id}`);
    return extractData(res);
  },
  async createBanner3(formData) {
    invalidateBannerCache();
    return apiClient.post('/banner3s', formData);
  },
  async updateBanner3(id, formData) {
    invalidateBannerCache();
    try {
      return await apiClient.postMultipartPut(`/banner3s/${id}`, formData);
    } catch (err) {
      if (err?.status === 405) {
        return await apiClient.put(`/banner3s/${id}`, formData);
      }
      throw err;
    }
  },
  async deleteBanner3(id) {
    invalidateBannerCache();
    return apiClient.delete(`/banner3s/${id}`);
  },
  async deleteBanner3Image(bannerId, imageId) {
    invalidateBannerCache();
    return apiClient.delete(`/banner3s/${bannerId}/images/${imageId}`);
  },

  // ----------------------------------------------------
  // POINTS & REWARDS SETTINGS
  // ----------------------------------------------------
  async getPointsSettings() {
    try {
      const res = await apiClient.get('/points-settings');
      return extractData(res);
    } catch {
      try {
        const res = await apiClient.get('/admin/points-settings');
        return extractData(res);
      } catch (err) {
        throw err;
      }
    }
  },

  async updatePointsSettings(data) {
    try {
      return await apiClient.put('/points-settings', data);
    } catch {
      return await apiClient.put('/admin/points-settings', data);
    }
  },

  // ----------------------------------------------------
  // COUPONS (/admin/coupons)
  // ----------------------------------------------------
  async getCoupons(options = {}) {
    const getOptions = { force: options.force === true };
    try {
      const res = await apiClient.get('/admin/coupons', {}, getOptions);
      return extractData(res) || [];
    } catch {
      try {
        const res2 = await apiClient.get('/coupons', {}, getOptions);
        return extractData(res2) || [];
      } catch {
        return [];
      }
    }
  },

  async createCoupon(data) {
    apiClient.invalidateCache('/admin/coupons');
    apiClient.invalidateCache('/coupons');
    try {
      return await apiClient.post('/admin/coupons', data);
    } catch (err) {
      if (err?.message?.includes('404')) {
        return await apiClient.post('/coupons', data);
      }
      throw err;
    }
  },

  async updateCoupon(id, data) {
    apiClient.invalidateCache('/admin/coupons');
    apiClient.invalidateCache('/coupons');
    try {
      return await apiClient.put(`/admin/coupons/${id}`, data);
    } catch (err) {
      if (err?.message?.includes('404') && !err?.message?.includes('الكوبون')) {
        return await apiClient.put(`/coupons/${id}`, data);
      }
      throw err;
    }
  },

  async deleteCoupon(id) {
    apiClient.invalidateCache('/admin/coupons');
    apiClient.invalidateCache('/coupons');
    try {
      return await apiClient.delete(`/admin/coupons/${id}`);
    } catch (err) {
      if (err?.message?.includes('404') && !err?.message?.includes('الكوبون')) {
        return await apiClient.delete(`/coupons/${id}`);
      }
      throw err;
    }
  },

  // ----------------------------------------------------
  // MEETING ROOMS & BOOKINGS (/rooms)
  // ----------------------------------------------------
  async getRooms() {
    try {
      const res = await apiClient.get('/rooms');
      const data = extractData(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray(data.rooms)) return data.rooms;
      if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
      return [];
    } catch (err) {
      console.warn('GET /rooms failed:', err);
      return [];
    }
  },

  async getRoomById(id) {
    const res = await apiClient.get(`/rooms/${id}`);
    return extractData(res);
  },

  async createRoom(formData) {
    return apiClient.post('/rooms', formData);
  },

  async updateRoom(id, formData) {
    return apiClient.postMultipartPut(`/rooms/${id}`, formData);
  },

  async deleteRoom(id) {
    const res = await apiClient.delete(`/rooms/${id}`);
    return res;
  },

  // ----------------------------------------------------
  // ADMIN ROOM BOOKINGS (/admin/bookings)
  // ----------------------------------------------------
  async getBookings(options = {}) {
    const getOptions = { force: options.force === true };
    try {
      const res = await apiClient.get('/admin/bookings', {}, getOptions);
      const data = extractData(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray(data.bookings)) return data.bookings;
      if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
      return [];
    } catch (err) {
      console.warn('GET /admin/bookings failed:', err);
      return [];
    }
  },

  async getPendingBookings(options = {}) {
    const getOptions = { force: options.force === true };
    try {
      const res = await apiClient.get('/admin/bookings/pending', {}, getOptions);
      const data = extractData(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray(data.bookings)) return data.bookings;
      if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
      return [];
    } catch (err) {
      console.warn('GET /admin/bookings/pending failed:', err);
      return [];
    }
  },

  async getBookingDetails(id) {
    const res = await apiClient.get(`/admin/bookings/${id}`);
    return extractData(res);
  },

  async confirmBooking(id, data = {}) {
    const res = await apiClient.post(`/admin/bookings/${id}/confirm`, data);
    return res;
  },

  async rejectBooking(id, reason = '') {
    const res = await apiClient.post(`/admin/bookings/${id}/reject`, {
      reason,
      note: reason,
      rejection_reason: reason
    });
    return res;
  },

  // ----------------------------------------------------
  // FACILITIES (/facilities)
  // ----------------------------------------------------
  async getFacilities() {
    try {
      const res = await apiClient.get('/facilities');
      return extractData(res) || [];
    } catch {
      return [];
    }
  },

  async createFacility(formData) {
    return apiClient.post('/facilities', formData);
  },

  async updateFacility(id, formData) {
    return apiClient.postMultipartPut(`/facilities/${id}`, formData);
  },

  async deleteFacility(id) {
    return apiClient.delete(`/facilities/${id}`);
  },

  // ----------------------------------------------------
  // DINING TABLES (/tables)
  // ----------------------------------------------------
  async getTables() {
    try {
      const res = await apiClient.get('/tables', {}, { force: true });
      const data = extractData(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.tables)) return data.tables;
        if (Array.isArray(data.data)) return data.data;
      }
      return [];
    } catch (err) {
      console.warn('GET /tables failed, checking /admin/tables fallback:', err);
      try {
        const res2 = await apiClient.get('/admin/tables', {}, { force: true });
        const data2 = extractData(res2);
        if (Array.isArray(data2)) return data2;
        if (data2 && Array.isArray(data2.tables)) return data2.tables;
        if (data2 && Array.isArray(data2.data)) return data2.data;
      } catch (err2) {
        console.warn('GET /admin/tables failed:', err2);
      }
      return [];
    }
  },

  async createTable(payload) {
    // Expected Payload: { number: 1, capacity: 4 }
    const body = {
      number: Number(payload.number),
      capacity: Number(payload.capacity)
    };
    apiClient.invalidateCache('/tables');
    return apiClient.post('/tables', body);
  },

  async updateTable(id, payload) {
    const body = {
      number: Number(payload.number),
      capacity: Number(payload.capacity)
    };
    apiClient.invalidateCache('/tables');
    return apiClient.put(`/tables/${id}`, body);
  },

  async deleteTable(id) {
    apiClient.invalidateCache('/tables');
    return apiClient.delete(`/tables/${id}`);
  },

  // ----------------------------------------------------
  // CAFE INFO & GALLERY (/cafe, /admin/cafe, /cafe/gallery)
  // ----------------------------------------------------
  async getCafeInfo() {
    return apiClient.get('/cafe');
  },

  async updateCafeInfo(formData) {
    return apiClient.postMultipartPut('/admin/cafe', formData);
  },

  async uploadGalleryPhotos(formData) {
    return apiClient.post('/cafe/gallery', formData);
  },

  async updateGalleryPhoto(id, data) {
    return apiClient.put(`/cafe/gallery/${id}`, data);
  },

  async deleteGalleryPhoto(id) {
    return apiClient.delete(`/cafe/gallery/${id}`);
  },

  // ----------------------------------------------------
  // REVIEWS (/reviews)
  // ----------------------------------------------------
  async getReviews() {
    return apiClient.get('/reviews');
  },

  async submitReview(formData) {
    return apiClient.post('/reviews', formData);
  },

  async deleteReview(id) {
    return apiClient.delete(`/reviews/${id}`);
  },

  // ----------------------------------------------------
  // POINTS SETTINGS (/points-settings & /admin/points-settings)
  // ----------------------------------------------------
  async getPointsSettings() {
    try {
      const res = await apiClient.get('/points-settings');
      return extractData(res);
    } catch (err) {
      try {
        const res2 = await apiClient.get('/admin/points-settings');
        return extractData(res2);
      } catch {
        return {
          id: 1,
          amount_egp: '100.00',
          points_per_amount: 10
        };
      }
    }
  },

  async updatePointsSettings(payload) {
    const data = {
      amount_egp: Number(payload.amount_egp || 100),
      points_per_amount: Number(payload.points_per_amount || 10)
    };
    try {
      const res = await apiClient.put('/admin/points-settings', data);
      return res;
    } catch (err) {
      try {
        const res2 = await apiClient.put('/points-settings', data);
        return res2;
      } catch {
        const fd = new FormData();
        fd.append('_method', 'PUT');
        fd.append('amount_egp', String(data.amount_egp));
        fd.append('points_per_amount', String(data.points_per_amount));
        return apiClient.postMultipartPut('/admin/points-settings', fd);
      }
    }
  },


  // ----------------------------------------------------
  // CAFE STORE INFO (/cafe & /admin/cafe)
  // ----------------------------------------------------
  async getCafeInfo() {
    try {
      const res = await apiClient.get('/cafe');
      return extractData(res);
    } catch {
      return {
        name_ar: 'كافيه 90',
        name_en: 'Cafe 90',
        tagline_ar: 'مكان لمساحات اجتماعية ومكتبية',
        tagline_en: 'A place for social and workspace areas',
        description_ar: 'مكان مثالي للاسترخاء والعمل، نقدم قهوة مختصة وأجواء هادئة ومساحات مريحة للاجتماعات',
        description_en: 'The ideal place to relax and work, we offer specialty coffee, calm ambiance, and comfortable meeting spaces',
        address_ar: 'شرق النيل، بني سويف الجديدة، مصر',
        address_en: 'East Nile, New Beni Suef, Egypt',
        contact_phone: '01500973739',
        working_hours_ar: 'الأحد - الخميس: 8ص - 12م',
        working_hours_en: 'Sun - Thu: 8am - 12am'
      };
    }
  },

  async updateCafeInfo(formData) {
    return apiClient.postMultipartPut('/admin/cafe', formData);
  },

  // ----------------------------------------------------
  // REVIEWS (/reviews)
  // ----------------------------------------------------
  async getReviews(params = {}) {
    const res = await apiClient.get('/reviews');
    let data = extractData(res) || [];
    if (params.rating && params.rating !== 'all') {
      data = data.filter(r => Number(r.rating) === Number(params.rating));
    }
    return data;
  },

  async deleteReview(id) {
    return apiClient.delete(`/reviews/${id}`);
  },

  // ----------------------------------------------------
  // NOTIFICATIONS (/admin/notifications & /notifications)
  // ----------------------------------------------------
  async sendNotification(data) {
    let body = data;
    if (!(data instanceof FormData) && typeof data === 'object' && data !== null) {
      const fd = new FormData();
      const title = data.title || data.title_ar || data.title_en || '';
      const bodyText = data.body || data.body_ar || data.body_en || '';

      if (title) fd.append('title', title);
      if (data.title_ar || title) fd.append('title_ar', data.title_ar || title);
      if (data.title_en || title) fd.append('title_en', data.title_en || title);

      if (bodyText) fd.append('body', bodyText);
      if (data.body_ar || bodyText) fd.append('body_ar', data.body_ar || bodyText);
      if (data.body_en || bodyText) fd.append('body_en', data.body_en || bodyText);

      if (data.user_id) {
        fd.append('user_id', data.user_id);
        fd.append('user_ids[]', data.user_id);
      }
      if (data.user_ids) {
        if (Array.isArray(data.user_ids)) {
          data.user_ids.forEach(uid => fd.append('user_ids[]', uid));
          if (data.user_ids[0]) fd.append('user_id', data.user_ids[0]);
        } else {
          fd.append('user_ids[]', data.user_ids);
          fd.append('user_id', data.user_ids);
        }
      }
      if (data.audience) fd.append('audience', data.audience);
      if (data.image instanceof File) fd.append('image', data.image);
      body = fd;
    } else if (data instanceof FormData) {
      const title = data.get('title') || data.get('title_ar');
      const bodyText = data.get('body') || data.get('body_ar');
      if (title) {
        if (!data.has('title')) data.append('title', title);
        if (!data.has('title_ar')) data.append('title_ar', title);
        if (!data.has('title_en')) data.append('title_en', title);
      }
      if (bodyText) {
        if (!data.has('body')) data.append('body', bodyText);
        if (!data.has('body_ar')) data.append('body_ar', bodyText);
        if (!data.has('body_en')) data.append('body_en', bodyText);
      }
      const uid = data.get('user_id') || data.get('user_ids[]');
      if (uid) {
        if (!data.has('user_id')) data.append('user_id', uid);
        if (!data.has('user_ids[]')) data.append('user_ids[]', uid);
      }
    }
    return apiClient.post('/admin/notifications', body);
  },

  async getNotifications(page = 1) {
    return apiClient.get(`/notifications?page=${page}`);
  },

  async getUnreadNotificationsCount() {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      if (typeof res === 'number') return res;
      if (typeof res?.unread_count === 'number') return res.unread_count;
      if (typeof res?.count === 'number') return res.count;
      return 0;
    } catch {
      return 0;
    }
  },

  async markNotificationAsRead(id) {
    return apiClient.post(`/notifications/${id}/read`);
  },

  async markAllNotificationsAsRead() {
    return apiClient.post('/notifications/read-all');
  },

  async registerDevice(payload = {}) {
    let body = payload;
    if (!(payload instanceof FormData) && typeof payload === 'object' && payload !== null) {
      body = payload;
    }
    return apiClient.post('/notifications/register-device', body);
  },

  async unregisterDevice(payload = {}) {
    let body = payload;
    if (!(payload instanceof FormData) && typeof payload === 'object' && payload !== null) {
      body = payload;
    }
    return apiClient.post('/notifications/unregister-device', body);
  },

  // ----------------------------------------------------
  // USERS & ADMINS (Roles Mock/Live Fallback)
  // ----------------------------------------------------
  async getAdminUsers() {
    return this.getUsers({ role: 'admin' });
  },

  async createAdminUser(user) {
    return { ...user, id: `usr-${Date.now()}` };
  },

  async updateAdminUser(id, user) {
    return { ...user, id };
  },

  async deleteAdminUser(id) {
    return { success: true };
  },

  // ----------------------------------------------------
  // APP VERSION & SYSTEM MAINTENANCE SETTINGS
  // ----------------------------------------------------
  async getAppVersion() {
    try {
      const res = await apiClient.get('/app-version/check', {}, { force: true });
      const data = extractData(res);
      return data || res;
    } catch (err) {
      console.warn('GET /app-version/check failed:', err);
      return {
        androidVersion: '1.0.0',
        androidEndDate: null,
        androidUrl: null,
        iosVersion: '1.0.0',
        iosEndDate: null,
        iosUrl: null,
        isOpen: true,
        maintenance: false
      };
    }
  },

  async updateAppVersion(payload) {
    apiClient.invalidateCache('/app-version');
    const res = await apiClient.put('/admin/app-version', payload);
    return res;
  }
};

