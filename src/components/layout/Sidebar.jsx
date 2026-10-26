import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_GROUPS } from './navConfig';

const FALLBACK_AVATAR = null;

const resolveAvatar = (user) => {
  if (user?.avatar_url) return user.avatar_url;
  if (user?.avatar) {
    return user.avatar.startsWith('http')
      ? user.avatar
      : `https://backend.ninety90degree.com/public/storage/${user.avatar.replace(/^\//, '')}`;
  }
  return FALLBACK_AVATAR;
};

const initialsOf = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase() || 'A';

const Avatar = ({ user, size = 'w-9 h-9' }) => {
  const src = resolveAvatar(user);
  const name = user?.name || user?.username || 'Admin';
  return (
    <div className={`relative shrink-0 ${size}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${size} rounded-full object-cover ring-1 ring-white/15`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span
        className={`${size} rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-chocolate-950 text-xs font-bold items-center justify-center ring-1 ring-white/15`}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {initialsOf(name)}
      </span>
      <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1A110C]" />
    </div>
  );
};

export const Sidebar = ({
  currentView,
  onNavigate,
  collapsed,
  setCollapsed,
  stats = {},
  isMobileOpen = false,
  setIsMobileOpen
}) => {
  const { isRtl, t } = useLanguage();
  const { user, logout } = useAuth();

  // On mobile the drawer always shows full labels
  const isCompact = collapsed && !isMobileOpen;

  const getBadgeCount = (item) => {
    if (currentView === item.id) return 0;
    const map = {
      unreadNotifications: stats.unreadNotificationsCount,
      pendingOrders: stats.pendingOrdersCount,
      newReviews: stats.newReviewsThisWeek,
      banners: stats.bannersCount,
      pendingBookings: stats.pendingBookingsCount,
      trashedCount: stats.trashedCount
    };
    const value = map[item.badgeKey];
    return value > 0 ? value : 0;
  };

  const handleNavClick = (viewId) => {
    onNavigate(viewId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const CollapseIcon = collapsed
    ? (isRtl ? PanelLeftClose : PanelLeftOpen)
    : (isRtl ? PanelLeftOpen : PanelLeftClose);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-chocolate-950/60 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col text-stone-300 transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } border-white/[0.06] ${isCompact ? 'w-[76px]' : 'w-[264px]'} ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl'
            : isRtl
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background:
            'radial-gradient(120% 60% at 50% 0%, rgba(201,151,58,0.10) 0%, rgba(201,151,58,0) 55%), linear-gradient(180deg, #1F150F 0%, #170F0A 100%)'
        }}
      >
        {/* Brand */}
        <div className={`flex items-center h-[72px] shrink-0 ${isCompact ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-3 min-w-0 rounded-xl"
            title="Cafe 90"
          >
            <span className="w-11 h-11 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
              <img src={logoImg} alt="Cafe 90" className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
            </span>
            {!isCompact && (
              <span className="flex flex-col items-start min-w-0 leading-tight">
                <span className="font-serif text-[17px] font-bold text-white tracking-wide">Cafe 90</span>
                <span className="text-[11px] text-gold-300/80 font-medium truncate">
                  {isRtl ? 'لوحة الإدارة' : 'Admin Console'}
                </span>
              </span>
            )}
          </button>

          {/* Mobile close */}
          {isMobileOpen && (
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop collapse toggle (expanded state) */}
          {!isCompact && !isMobileOpen && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-2 rounded-lg text-stone-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              title={isRtl ? 'تصغير القائمة' : 'Collapse sidebar'}
              aria-label="Collapse sidebar"
            >
              <CollapseIcon className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={group.groupKey || `g-${gIdx}`} className={gIdx > 0 ? 'mt-4' : ''}>
              {group.groupKey && (
                isCompact ? (
                  <div className="mx-3 mb-2 h-px bg-white/[0.06]" />
                ) : (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold text-stone-500 tracking-wide">
                    {t(group.groupKey)}
                  </p>
                )
              )}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentView === item.id;
                  const Icon = item.icon;
                  const badgeCount = getBadgeCount(item);

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        title={isCompact ? t(item.labelKey) : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={`relative w-full flex items-center gap-3 h-10 rounded-lg text-[13.5px] transition-colors duration-150 group ${
                          isCompact ? 'justify-center px-0' : 'px-3'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-gold-400/[0.16] to-gold-400/[0.06] text-white font-semibold ring-1 ring-inset ring-gold-300/[0.14]'
                            : 'text-stone-400 hover:text-stone-100 hover:bg-white/[0.04] font-medium'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute top-2 bottom-2 start-0 w-[3px] rounded-full bg-gold-300" />
                        )}

                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive ? 'text-gold-300' : 'text-stone-500 group-hover:text-stone-300'
                          }`}
                          strokeWidth={isActive ? 2.2 : 1.9}
                        />

                        {!isCompact && <span className="truncate flex-1 text-start">{t(item.labelKey)}</span>}

                        {!isCompact && Boolean(badgeCount) && (
                          <span
                            className={`min-w-[22px] h-[20px] px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                              item.urgent
                                ? 'bg-gold-400 text-chocolate-950'
                                : 'bg-white/[0.08] text-stone-300'
                            }`}
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}

                        {isCompact && Boolean(badgeCount) && (
                          <span className="absolute top-1.5 end-3 w-2 h-2 rounded-full bg-gold-400 ring-2 ring-[#1C130D]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Expand toggle when collapsed */}
        {isCompact && (
          <div className="hidden lg:flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-2.5 rounded-lg text-stone-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              title={isRtl ? 'توسيع القائمة' : 'Expand sidebar'}
              aria-label="Expand sidebar"
            >
              <CollapseIcon className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          {!isCompact ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
              <Avatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">
                  {user?.name || user?.username || (isRtl ? 'المسؤول' : 'Cafe 90 Admin')}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  {user?.email || user?.role || t('superAdmin')}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-lg text-stone-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title={t('signOut')}
                aria-label={t('signOut')}
              >
                <LogOut className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Avatar user={user} />
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-lg text-stone-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title={t('signOut')}
                aria-label={t('signOut')}
              >
                <LogOut className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
