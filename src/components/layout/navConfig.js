import {
  LayoutDashboard,
  Image as ImageIcon,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  Award,
  DoorOpen,
  Star,
  Store,
  Bell,
  Smartphone,
  Coffee,
  Trash2,
  Users,
  CalendarCheck
} from 'lucide-react';
import { canAccessView } from '../../utils/permissions';

// Single source of truth for the dashboard navigation (used by Sidebar + Header).
export const NAV_GROUPS = [
  {
    groupKey: null,
    items: [
      { id: 'overview', labelKey: 'navOverview', icon: LayoutDashboard, badgeKey: null },
      { id: 'banners', labelKey: 'navBanners', icon: ImageIcon, badgeKey: 'banners' }
    ]
  },
  {
    groupKey: 'navMenuCatalog',
    items: [
      { id: 'menu-items', labelKey: 'navMenuItems', icon: UtensilsCrossed, badgeKey: null },
      { id: 'categories', labelKey: 'navCategories', icon: Layers, badgeKey: null },
      { id: 'recycle-bin', labelKey: 'navRecycleBin', icon: Trash2, badgeKey: 'trashedCount' }
    ]
  },
  {
    groupKey: 'navOperations',
    items: [
      { id: 'orders', labelKey: 'navOrders', icon: ShoppingBag, badgeKey: 'pendingOrders', urgent: true },
      { id: 'users', labelKey: 'navUsers', icon: Users, badgeKey: null },
      { id: 'points-coupons', labelKey: 'navPointsCoupons', icon: Award, badgeKey: null },
      { id: 'facilities-rooms', labelKey: 'navFacilitiesRooms', icon: DoorOpen, badgeKey: 'pendingBookings', urgent: true },
      // Bookings-only screen (no room editing) - shown to the cashier instead of Facilities & Rooms
      { id: 'bookings', labelKey: 'navBookings', icon: CalendarCheck, badgeKey: 'pendingBookings', urgent: true, cashierOnly: true },
      { id: 'tables', labelKey: 'navDiningTables', icon: Coffee, badgeKey: null },
      { id: 'reviews', labelKey: 'navReviews', icon: Star, badgeKey: 'newReviews' }
    ]
  },
  {
    groupKey: 'navAdminGroup',
    items: [
      { id: 'notifications', labelKey: 'navNotifications', icon: Bell, badgeKey: 'unreadNotifications' },
      { id: 'cafe-info', labelKey: 'navCafeInfo', icon: Store, badgeKey: null },
      { id: 'app-version', labelKey: 'navAppVersion', icon: Smartphone, badgeKey: null }
    ]
  }
];

// Nav groups filtered by the signed-in user's role (empty groups removed)
export const getNavGroupsForRole = (role) =>
  NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        role === 'cashier' ? canAccessView(role, item.id) : !item.cashierOnly
      )
    }))
    .filter((group) => group.items.length > 0);

export const findNavItem = (viewId) => {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.id === viewId);
    if (item) return { item, group };
  }
  return { item: NAV_GROUPS[0].items[0], group: NAV_GROUPS[0] };
};
