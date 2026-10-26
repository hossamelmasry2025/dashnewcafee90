import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLanguage } from '../../context/LanguageContext';

const COLLAPSE_KEY = 'cafe90_sidebar_collapsed';

export const Layout = ({
  children,
  currentView,
  onNavigate,
  stats,
  onGlobalSearch,
  onViewOrder
}) => {
  const { isRtl, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e) => e.key === 'Escape' && setIsMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileOpen]);

  const offset = isRtl
    ? collapsed ? 'lg:mr-[76px]' : 'lg:mr-[264px]'
    : collapsed ? 'lg:ml-[76px]' : 'lg:ml-[264px]';

  return (
    <div className="min-h-screen bg-canvas text-chocolate-900 flex flex-col antialiased overflow-x-hidden max-w-[100vw]">
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        stats={stats}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className={`flex-1 min-w-0 flex flex-col min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${offset}`}>
        <Header
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          currentView={currentView}
          onNavigate={onNavigate}
          onGlobalSearch={onGlobalSearch}
          onViewOrder={onViewOrder}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>

        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-stone-200/70 text-xs text-stone-500">
          <div className="mx-auto w-full max-w-[1600px] flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-chocolate-800">{t('cafeName', 'Cafe 90')}</span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">{t('tagline', 'Coffee, Moments, Elevated')}</span>
            </div>
            <p className="text-[11px] text-stone-400">
              &copy; {new Date().getFullYear()} {t('cafeName', 'Cafe 90')}. {isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
