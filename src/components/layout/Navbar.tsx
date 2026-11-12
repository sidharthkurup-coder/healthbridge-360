'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HeartPulse,
  Pill,
  PhoneCall,
  Droplets,
  Recycle,
  BarChart3,
  Menu,
  X,
  LogOut,
  Shield,
  Activity,
  ChevronDown,
  LayoutDashboard,
  Bell,
  CheckCheck,
  Languages,
  Wind,
} from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '../ui/Badge';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  sectionId?: number;
}

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t, tx, ts } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchNotifs = () => {
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          fetchNotifs();
        } else {
          setUser(null);
          setNotifications([]);
          setUnreadCount(0);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    fetchNotifs();
  };

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchNotifs();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserDropdownOpen(false);
    setIsLoggingOut(false);
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: t('nav.healthcare'), href: '/healthcare', icon: HeartPulse },
    { name: t('nav.medicines'), href: '/medicines', icon: Pill },
    { name: t('nav.emergency'), href: '/emergency', icon: PhoneCall, highlight: true },
    { name: t('nav.water'), href: '/water', icon: Droplets },
    { name: t('nav.sanitation'), href: '/sanitation', icon: Recycle },
    { name: t('nav.airQuality'), href: '/air-quality', icon: Wind },
    { name: t('nav.intelligence'), href: '/intelligence', icon: BarChart3 },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'purple';
      case 'EMERGENCY_COORDINATOR':
        return 'rose';
      case 'HEALTHCARE_STAFF':
        return 'sky';
      case 'MEDICINE_STAFF':
        return 'amber';
      case 'WATER_SANITATION_OFFICER':
        return 'teal';
      default:
        return 'emerald';
    }
  };

  return (
    <header className="vt-navbar sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs transition-all">
      {/* Top emergency announcement ticker / helpline */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-slate-300 text-xs py-1.5 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-white tracking-tight">{t('topbar.portal')}</span>
            <span className="hidden sm:inline text-slate-400">• {t('topbar.location')}</span>
            <span className="hidden md:inline-flex items-center gap-1 bg-teal-500/15 border border-teal-400/30 text-teal-300 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ml-1">
              {t('topbar.event')}
            </span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 text-[11px]">
            {/* Bilingual EN / తెలుగు Pill Toggle */}
            <div
              role="group"
              aria-label="Language Switcher"
              className="inline-flex items-center bg-navy-900/90 border border-white/15 rounded-full p-0.5 shadow-inner"
            >
              <Languages className="w-3 h-3 text-teal-300 mx-1.5 hidden sm:block" />
              <button
                type="button"
                onClick={() => setLang('en')}
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90',
                  lang === 'en'
                    ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-navy-950 shadow-[0_0_12px_rgba(45,212,191,0.45)] scale-105'
                    : 'text-slate-300 hover:text-white'
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('te')}
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90',
                  lang === 'te'
                    ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-navy-950 shadow-[0_0_12px_rgba(45,212,191,0.45)] scale-105'
                    : 'text-slate-300 hover:text-white'
                )}
              >
                తెలుగు
              </button>
            </div>

            <span className="hidden md:inline text-slate-400">{t('topbar.emergencyLabel')}</span>
            <a
              href="tel:108"
              className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white font-bold flex items-center gap-1.5 transition-all"
            >
              <PhoneCall className="w-3 h-3 animate-pulse" /> {t('topbar.dial108')}
            </a>
            <a
              href="tel:104"
              className="hidden sm:flex text-teal-300 hover:text-teal-200 font-semibold items-center gap-1 transition-colors"
            >
              {t('topbar.helpline104')}
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 via-navy-800 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:shadow-glow-teal transition-all duration-300">
              <Activity className="w-5 h-5 text-teal-300 group-hover:rotate-6 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-navy-950 font-display">
                  HEALTHBRIDGE
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xs">
                  360
                </span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold -mt-0.5">
                {t('brand.sub')}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/80',
                    item.highlight &&
                      !isActive &&
                      'text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 hover:text-rose-700 border border-rose-200/60'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-teal-300'
                        : item.highlight
                        ? 'text-rose-600'
                        : 'text-slate-400 group-hover:text-teal-600'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Account / Auth Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative p-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-teal-300 transition-all text-slate-600 hover:text-navy-950 shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-scale-in">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-elevated border border-slate-200/80 z-50 text-xs animate-scale-in overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-navy-950">{t('nav.notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> {t('nav.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link || '/dashboard'}
                            onClick={() => {
                              if (!n.isRead) handleMarkRead(n.id);
                              setNotifDropdownOpen(false);
                            }}
                            className={clsx(
                              'block px-4 py-3 hover:bg-slate-50 transition-colors space-y-1',
                              !n.isRead && 'bg-teal-50/40'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-navy-950 line-clamp-1">{n.title}</span>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="p-6 text-center text-slate-500">{t('nav.noNotifs')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-teal-300 transition-all text-left shadow-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-navy-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-slate-900 max-w-[120px] truncate">{user.name}</p>
                    <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                      {ts(user.role)}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={clsx(
                      'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                      userDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-elevated border border-slate-200/80 py-1.5 z-50 text-sm animate-scale-in">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs bg-slate-50/60">
                      <p className="text-slate-400 font-medium">{tx('Authenticated Session', 'ధృవీకరించబడిన సెషన్')}</p>
                      <p className="font-bold text-slate-900 truncate mt-0.5">{user.email}</p>
                      {user.sectionId && (
                        <p className="text-teal-700 font-semibold mt-0.5">{tx(`Section ${user.sectionId} Resident`, `విభాగం ${user.sectionId} నివాసి`)}</p>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                      {t('nav.dashboard')}
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-purple-700 hover:bg-purple-50 font-semibold transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        {t('nav.admin')}
                      </Link>
                    )}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-navy-950 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-bold text-navy-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/login?demo=true"
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xs hover:shadow-glow-teal hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {t('nav.demoRoles')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-fade-up shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100',
                  item.highlight && !isActive && 'text-rose-600 bg-rose-50'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-teal-300' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="border-t border-slate-100 pt-3 mt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <Badge variant={getRoleBadgeVariant(user.role)} size="sm" className="mt-1.5">
                    {ts(user.role)}
                  </Badge>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  {t('nav.dashboard')}
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 rounded-xl"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/login?demo=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-3 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-xs"
                >
                  {t('nav.demoRoles')}
                </Link>
              </div>
            )}

            {/* Mobile Language Switcher */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-teal-600" /> Language / భాష
              </span>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                    lang === 'en' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600'
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('te')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                    lang === 'te' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600'
                  )}
                >
                  తెలుగు
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
