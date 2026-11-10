import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { notificationsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  BellIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Check if current page is dashboard/upload
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/upload');

  // Unread notifications query
  const { data: notificationsData } = useQuery(
    ['notifications_header'],
    () => notificationsAPI.getAll().then((res) => res.data),
    { enabled: !!user, refetchInterval: 30000 }
  );

  const notificationsList = notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : []);
  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  const markAllReadMutation = useMutation(
    () => notificationsAPI.markAllRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications_header']);
        queryClient.invalidateQueries(['notifications']);
      },
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleShareClick = (e) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/upload')) {
      if (e) e.preventDefault();
      window.dispatchEvent(new CustomEvent('open-upload-modal'));
    } else {
      navigate('/upload');
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setNotifDropdownOpen(false);
    setMobileNavOpen(false);
    navigate('/', { replace: true });
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    toast.success('Signed out successfully');
  };

  const handleNavClick = (hash) => {
    setMobileNavOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo (and Landing Nav Links if not dashboard) */}
        <div className="flex items-center space-x-3">
          {!isDashboard && (
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileNavOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          )}

          {isDashboard ? (
            <div className="flex flex-col justify-center py-0.5">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white leading-tight">
                {t('nav_dashboard')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate max-w-[220px] sm:max-w-md md:max-w-xl">
                Welcome back, {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Student'}
                {user?.university_name ? ` • ${user.university_name}` : ''}
                {user?.department_name ? ` (${user.department_name})` : ''}
                {user?.year_of_study ? ` • Year ${user.year_of_study}` : ''}
              </p>
            </div>
          ) : (
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white leading-none">
                  Student<span className="text-blue-600 dark:text-blue-400">Hub</span>
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                  ETHIOPIA
                </span>
              </div>
            </Link>
          )}

          {/* Desktop Nav Links - Only on Landing / Public pages */}
          {!isDashboard && (
            <nav className="hidden md:flex items-center space-x-1 ml-6">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/' && !location.hash
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                {t('nav_home')}
              </Link>
              <Link
                to="/browse"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/browse'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                {t('nav_sources')}
              </Link>
              <button
                onClick={() => handleNavClick('#contact')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                {t('nav_contact')}
              </button>
            </nav>
          )}
        </div>

        {/* Center: Search input - Only on Landing / Browse pages */}
        {!isDashboard && (
          <div className="flex-1 max-w-md mx-4 hidden lg:block">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('browse_search_placeholder')}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-gray-100/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
            </form>
          </div>
        )}

        {/* Right Section: Share Button, Language, Theme, Notification, Account Icon */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Share a Resource Button - in front of language selector */}
          <button
            type="button"
            onClick={handleShareClick}
            title={t('browse_publish_btn')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 active:scale-95 transition-all flex-shrink-0"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('browse_publish_btn')}</span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={language === 'en' ? 'Switch to Amharic' : 'ወደ እንግሊዝኛ ቀይር'}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <LanguageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'en' ? 'አማ' : 'EN'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <SunIcon className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <MoonIcon className="h-4 w-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* User authenticated actions */}
          {user ? (
            <div className="flex items-center space-x-2">

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setDropdownOpen(false);
                  }}
                  className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                  title="Notifications"
                >
                  <BellIcon className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl py-2 border border-gray-100 dark:border-gray-800 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Notifications ({unreadCount} new)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
                      {notificationsList.length > 0 ? (
                        notificationsList.slice(0, 5).map((n) => (
                          <Link
                            key={n.id}
                            to={n.resource ? `/resource/${n.resource}` : '/dashboard'}
                            onClick={() => setNotifDropdownOpen(false)}
                            className={`block p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              !n.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-gray-400">
                          No notifications yet
                        </div>
                      )}
                    </div>

                    <div className="pt-2 px-3 border-t border-gray-100 dark:border-gray-800 text-center">
                      <Link
                        to="/dashboard"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block py-1"
                      >
                        View all in Dashboard &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/30"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30">
                      {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <ChevronDownIcon className="h-3 w-3 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl py-1.5 border border-gray-100 dark:border-gray-800 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-400">{t('nav_signed_in_as')}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <Squares2X2Icon className="h-4 w-4 mr-2.5 text-blue-500" />
                      {t('nav_dashboard')}
                    </Link>

                    <Link
                      to="/upload"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-2.5 text-blue-500" />
                      {t('nav_upload')}
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-gray-100 dark:border-gray-800 mt-1"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2.5" />
                      {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t('nav_login')}
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
              >
                {t('nav_register')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer - Only on Landing / Public pages */}
      {!isDashboard && mobileNavOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 pt-3 pb-5 space-y-3 shadow-xl">
          <form onSubmit={handleSearch} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('browse_search_placeholder')}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none"
            />
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
          </form>

          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {t('nav_home')}
            </Link>
            <Link
              to="/browse"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {t('nav_sources')}
            </Link>
            <button
              onClick={() => handleNavClick('#contact')}
              className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {t('nav_contact')}
            </button>
            <button
              onClick={(e) => {
                setMobileNavOpen(false);
                handleShareClick(e);
              }}
              className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              {t('browse_publish_btn')}
            </button>
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                {t('nav_dashboard')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
