import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginView } from './components/auth/LoginView';
import { Overview } from './components/modules/dashboard/Overview';
import { BannerManager } from './components/modules/dashboard/BannerManager';
import { MenuItemsTable } from './components/modules/menu/MenuItemsTable';
import { CategoriesView } from './components/modules/menu/CategoriesView';
import { OrdersView } from './components/modules/orders/OrdersView';
import { PointsAndCouponsView } from './components/modules/points/PointsAndCouponsView';
import { FacilitiesAndRoomsView } from './components/modules/facilities/FacilitiesAndRoomsView';
import { ReviewsView } from './components/modules/reviews/ReviewsView';
import { CafeInfoView } from './components/modules/cafeinfo/CafeInfoView';
import { NotificationsView } from './components/modules/notifications/NotificationsView';
import { AppVersionView } from './components/modules/appversion/AppVersionView';
import { RecycleBinView } from './components/modules/menu/RecycleBinView';
import { UsersView } from './components/modules/users/UsersView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { api, flattenReviews } from './services/api';
import { canAccessView, defaultViewFor } from './utils/permissions';

const VALID_VIEWS = [
  'overview',
  'banners',
  'menu-items',
  'categories',
  'recycle-bin',
  'orders',
  'users',
  'points-coupons',
  'facilities-rooms',
  'reviews',
  'cafe-info',
  'notifications',
  'app-version',
  'tables',
  'bookings'
];

function getInitialView() {
  try {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && VALID_VIEWS.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('cafe90_active_view');
    if (saved && VALID_VIEWS.includes(saved)) {
      return saved;
    }
  } catch (e) {}
  return 'overview';
}

function DashboardApp() {
  const { isAuthenticated, role, isCashier } = useAuth();
  const { unreadCount: contextUnreadCount } = useNotifications();
  // Navigation View State with persistence on refresh & hash routing
  const [currentView, setCurrentView] = useState(getInitialView);
  // Order to view in Order Details modal directly
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Global search query
  const [globalSearch, setGlobalSearch] = useState('');

  // Track cleared/seen views in session
  const [clearedViews, setClearedViews] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cafe90_cleared_badges');
      return stored ? JSON.parse(stored) : { [getInitialView()]: true };
    } catch {
      return { [getInitialView()]: true };
    }
  });

  // Raw counts from live API
  const [rawStats, setRawStats] = useState({
    pendingOrdersCount: 0,
    newReviewsThisWeek: 0,
    pendingBookingsCount: 0,
    bannersCount: 0,
    trashedCount: 0
  });

  // Sync hash and localStorage whenever currentView changes
  useEffect(() => {
    if (!VALID_VIEWS.includes(currentView)) {
      setCurrentView('overview');
      return;
    }
    try {
      localStorage.setItem('cafe90_active_view', currentView);
      if (window.location.hash !== `#${currentView}`) {
        window.history.replaceState(null, '', `#${currentView}`);
      }
    } catch (e) {}
  }, [currentView]);

  // Role guard: cashier can only open orders / bookings / notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!canAccessView(role, currentView)) {
      setCurrentView(currentView === 'facilities-rooms' && isCashier ? 'bookings' : defaultViewFor(role));
    }
  }, [isAuthenticated, role, isCashier, currentView]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_VIEWS.includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load live counts for sidebar badges
  const refreshStats = async () => {
    if (!isAuthenticated) return;
    if (isCashier) {
      // Cashier only needs order + booking badges (other endpoints are admin-only)
      try {
        const [ordersRes, bookingsRes] = await Promise.allSettled([api.getOrders(), api.getBookings()]);
        const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : [];
        const bookings = bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value) ? bookingsRes.value : [];
        setRawStats({
          pendingOrdersCount: orders.filter(o => ['pending', 'new', 'open'].includes(String(o.status || '').toLowerCase())).length,
          newReviewsThisWeek: 0,
          pendingBookingsCount: bookings.filter(b => String(b.status || '').toLowerCase() === 'pending').length,
          bannersCount: 0,
          trashedCount: 0
        });
      } catch (e) {
        console.error('Error refreshing stats:', e);
      }
      return;
    }
    try {
      const [ordersRes, reviewsRes, bookingsRes, bannersRes, banner2sRes, banner3sRes, trashedItemsRes, trashedCatsRes] = await Promise.allSettled([
        api.getOrders(),
        api.getReviews(),
        api.getBookings(),
        api.getBanners(),
        api.getBanner2s(),
        api.getBanner3s(),
        api.getTrashedItems(),
        api.getTrashedCategories()
      ]);

      const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : [];
      const reviews = reviewsRes.status === 'fulfilled' ? flattenReviews(reviewsRes.value) : [];
      const bookings = bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value) ? bookingsRes.value : [];
      const banners1 = bannersRes.status === 'fulfilled' && Array.isArray(bannersRes.value) ? bannersRes.value : [];
      const banners2 = banner2sRes.status === 'fulfilled' && Array.isArray(banner2sRes.value) ? banner2sRes.value : [];
      const banners3 = banner3sRes.status === 'fulfilled' && Array.isArray(banner3sRes.value) ? banner3sRes.value : [];
      const tItems = trashedItemsRes.status === 'fulfilled' && Array.isArray(trashedItemsRes.value) ? trashedItemsRes.value : (trashedItemsRes.value?.data || []);
      const tCats = trashedCatsRes.status === 'fulfilled' && Array.isArray(trashedCatsRes.value) ? trashedCatsRes.value : (trashedCatsRes.value?.data || []);

      const pendingOrdersCount = orders.filter(o => {
        const s = String(o.status || '').toLowerCase();
        return s === 'pending' || s === 'new' || s === 'open';
      }).length;

      const newReviewsCount = reviews.filter(r => {
        const s = String(r.status || '').toLowerCase();
        return s === 'pending' || (!r.adminReply && !r.admin_reply);
      }).length;

      const pendingBookingsCount = bookings.filter(b => {
        const s = String(b.status || '').toLowerCase();
        return s === 'pending';
      }).length;

      const trashedCount = (Array.isArray(tItems) ? tItems.length : 0) + (Array.isArray(tCats) ? tCats.length : 0);

      setRawStats({
        pendingOrdersCount,
        newReviewsThisWeek: newReviewsCount,
        pendingBookingsCount,
        bannersCount: banners1.length + banners2.length + banners3.length,
        trashedCount
      });
    } catch (e) {
      console.error('Error refreshing stats:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      refreshStats();

      // On-demand refresh driven 100% by real-time events, zero polling
      const handleRealtimeUpdate = () => {
        if (isMounted) refreshStats();
      };
      window.addEventListener('notification:received', handleRealtimeUpdate);
      return () => {
        isMounted = false;
        window.removeEventListener('notification:received', handleRealtimeUpdate);
      };
    }
  }, [isAuthenticated, isCashier]);

  const [menuInitialTab, setMenuInitialTab] = useState('all');

  const handleNavigate = (requestedView, params = null) => {
    let viewId = requestedView;
    if (!canAccessView(role, viewId)) {
      viewId = viewId === 'facilities-rooms' && isCashier ? 'bookings' : defaultViewFor(role);
    }
    if (viewId === 'menu-items') {
      setMenuInitialTab(params?.tab || 'all');
    }
    setCurrentView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // When user opens a view, mark its badge as seen/cleared
    setClearedViews(prev => {
      const next = { ...prev, [viewId]: true };
      try {
        sessionStorage.setItem('cafe90_cleared_badges', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleGlobalSearch = (query) => {
    setGlobalSearch(query);
    handleNavigate('menu-items');
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    handleNavigate('orders');
  };

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Dynamic badges: cleared when active or previously viewed
  const computedStats = {
    pendingOrdersCount: (currentView === 'orders' || clearedViews['orders']) ? 0 : rawStats.pendingOrdersCount,
    newReviewsThisWeek: (currentView === 'reviews' || clearedViews['reviews']) ? 0 : rawStats.newReviewsThisWeek,
    pendingBookingsCount: (currentView === 'facilities-rooms' || clearedViews['facilities-rooms'] || currentView === 'bookings' || clearedViews['bookings']) ? 0 : rawStats.pendingBookingsCount,
    bannersCount: (currentView === 'banners' || clearedViews['banners']) ? 0 : rawStats.bannersCount,
    trashedCount: (currentView === 'recycle-bin' || clearedViews['recycle-bin']) ? 0 : rawStats.trashedCount,
    unreadNotificationsCount: (currentView === 'notifications' || clearedViews['notifications']) ? 0 : (contextUnreadCount || 0)
  };

  return (
    <Layout
      currentView={currentView}
      onNavigate={handleNavigate}
      stats={computedStats}
      onGlobalSearch={handleGlobalSearch}
      onViewOrder={handleViewOrder}
    >
      {/* Dynamic Module Router */}
      {canAccessView(role, currentView) && (
      <ErrorBoundary key={currentView}>
        {currentView === 'overview' && (
          <Overview
            onNavigate={handleNavigate}
            onViewOrder={handleViewOrder}
          />
        )}

        {currentView === 'banners' && <BannerManager />}

        {currentView === 'menu-items' && (
          <MenuItemsTable initialSearch={globalSearch} initialTab={menuInitialTab} />
        )}

        {currentView === 'categories' && (
          <CategoriesView
            onSelectCategory={() => handleNavigate('menu-items')}
          />
        )}

        {currentView === 'recycle-bin' && (
          <RecycleBinView onNavigate={handleNavigate} />
        )}

        {currentView === 'orders' && (
          <OrdersView
            selectedOrderToView={selectedOrder}
            onClearSelectedOrder={() => setSelectedOrder(null)}
          />
        )}

        {currentView === 'users' && (
          <UsersView
            onNavigate={handleNavigate}
            onViewOrder={handleViewOrder}
          />
        )}

        {currentView === 'points-coupons' && <PointsAndCouponsView />}

        {currentView === 'facilities-rooms' && <FacilitiesAndRoomsView initialTab="rooms" />}

        {currentView === 'tables' && <FacilitiesAndRoomsView initialTab="tables" />}

        {currentView === 'bookings' && <FacilitiesAndRoomsView initialTab="bookings" bookingsOnly />}

        {currentView === 'reviews' && <ReviewsView />}

        {currentView === 'cafe-info' && <CafeInfoView onNavigate={handleNavigate} />}

        {currentView === 'notifications' && (
          <NotificationsView
            onNavigate={handleNavigate}
            onViewOrder={handleViewOrder}
          />
        )}

        {currentView === 'app-version' && <AppVersionView />}
      </ErrorBoundary>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <DashboardApp />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

