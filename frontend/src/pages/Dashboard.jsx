import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { resourcesAPI, ratingsAPI, authAPI, notificationsAPI, downloadsAPI } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  StarIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
  UserCircleIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  KeyIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import UploadForm from '../components/Resources/UploadForm';
import { getFileIcon } from '../components/Resources/ResourceCard';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = ({ initialTab = 'my-uploads' }) => {
  const { user, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || initialTab);
  const [showUploadModal, setShowUploadModal] = useState(initialTab === 'upload' || tabParam === 'upload');

  // Academic Onboarding Pop-up for Google & new students
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    university_name: user?.university_name || '',
    department_name: user?.department_name || '',
    year_of_study: user?.year_of_study || '',
  });
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  // Auto-detect missing academic profile for Google or newly registered students
  React.useEffect(() => {
    if (initialTab === 'upload' || tabParam === 'upload') {
      setShowUploadModal(true);
    }
    const handleOpenUpload = () => setShowUploadModal(true);
    window.addEventListener('open-upload-modal', handleOpenUpload);
    return () => window.removeEventListener('open-upload-modal', handleOpenUpload);
  }, [initialTab, tabParam]);

  React.useEffect(() => {
    if (tabParam && tabParam !== 'upload') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  React.useEffect(() => {
    if (user) {
      setOnboardingForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        university_name: user.university_name || '',
        department_name: user.department_name || '',
        year_of_study: user.year_of_study || '',
      });
      const isIncomplete = (!user.university_name && !user.university) || (!user.department_name && !user.department) || !user.year_of_study;
      if (isIncomplete) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!onboardingForm.university_name.trim()) {
      toast.error('Please enter your university name.');
      return;
    }
    if (!onboardingForm.department_name.trim()) {
      toast.error('Please enter your department name.');
      return;
    }
    if (!onboardingForm.year_of_study) {
      toast.error('Please enter your current year of study as a number.');
      return;
    }

    setSavingOnboarding(true);
    try {
      await updateProfile({
        first_name: onboardingForm.first_name.trim(),
        last_name: onboardingForm.last_name.trim(),
        university_name: onboardingForm.university_name.trim(),
        department_name: onboardingForm.department_name.trim(),
        year_of_study: parseInt(onboardingForm.year_of_study, 10),
      });
      toast.success('Academic profile completed successfully! Welcome to your dashboard.');
      setShowOnboarding(false);
    } catch (err) {
      toast.error('Failed to complete academic profile.');
    } finally {
      setSavingOnboarding(false);
    }
  };

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile preferences state
  const [prefForm, setPrefForm] = useState({
    notify_new_resources: user?.notify_new_resources ?? true,
    notify_comments: user?.notify_comments ?? true,
    email_notifications: user?.email_notifications ?? false,
    theme_preference: user?.theme_preference || (isDark ? 'dark' : 'light'),
    show_name_on_publish: user?.show_name_on_publish ?? true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Profile info state
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    university_name: user?.university_name || '',
    department_name: user?.department_name || '',
    student_id: user?.student_id || '',
    year_of_study: user?.year_of_study || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        university_name: user.university_name || '',
        department_name: user.department_name || '',
        student_id: user.student_id || '',
        year_of_study: user.year_of_study || '',
      });
      setPrefForm({
        notify_new_resources: user.notify_new_resources ?? true,
        notify_comments: user.notify_comments ?? true,
        email_notifications: user.email_notifications ?? false,
        theme_preference: user.theme_preference || (isDark ? 'dark' : 'light'),
        show_name_on_publish: user.show_name_on_publish ?? true,
      });
    }
  }, [user]);

  // Fetch user's uploads
  const { data: myUploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ['myUploads'],
    queryFn: () => resourcesAPI.getAll({ uploaded_by: user?.id }).then((res) => res.data),
    enabled: !!user,
  });

  // Fetch user's ratings
  const { data: myRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['myRatings'],
    queryFn: () => ratingsAPI.getMyRatings().then((res) => res.data),
    enabled: !!user,
  });

  // Fetch user's notifications
  const { data: notificationsData, isLoading: notifsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then((res) => res.data),
    enabled: !!user,
  });

  // Fetch user's download history
  const { data: downloadsData, isLoading: downloadsLoading } = useQuery({
    queryKey: ['downloads_history'],
    queryFn: () => downloadsAPI.getHistory().then((res) => res.data),
    enabled: !!user,
  });

  const clearDownloadsMutation = useMutation({
    mutationFn: () => downloadsAPI.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries(['downloads_history']);
      toast.success('Download history cleared');
    },
    onError: () => {
      toast.error('Failed to clear download history');
    },
  });

  // Delete resource mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => resourcesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myUploads']);
      toast.success('Resource removed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete resource');
    },
  });

  // Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread_count']);
    },
  });

  // Mark all notifications read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread_count']);
      toast.success('All notifications marked as read');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword(passwordForm);
      toast.success('Password changed successfully!');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errRes = err.response?.data;
      if (errRes?.old_password) {
        toast.error(errRes.old_password[0] || 'Current password incorrect');
      } else if (errRes?.new_password) {
        toast.error(errRes.new_password[0]);
      } else {
        toast.error('Failed to change password. Verify your current password.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTogglePreference = async (key) => {
    const nextVal = !prefForm[key];
    const updated = { ...prefForm, [key]: nextVal };
    setPrefForm(updated);
    try {
      await updateProfile({ [key]: nextVal });
      toast.success('Preference updated');
    } catch (err) {
      toast.error('Failed to update preference');
    }
  };

  const handleThemeChange = async (themeMode) => {
    if ((themeMode === 'dark' && !isDark) || (themeMode === 'light' && isDark)) {
      toggleTheme();
    }
    setPrefForm((prev) => ({ ...prev, theme_preference: themeMode }));
    try {
      await authAPI.updateProfile({ theme_preference: themeMode });
      toast.success(`Theme switched to ${themeMode} mode`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        ...profileForm,
        year_of_study: profileForm.year_of_study ? parseInt(profileForm.year_of_study, 10) : null,
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadList = myUploads?.results || (Array.isArray(myUploads) ? myUploads : []);
  const ratingsList = myRatings?.results || (Array.isArray(myRatings) ? myRatings : []);
  const downloadsList = downloadsData?.results || (Array.isArray(downloadsData) ? downloadsData : []);
  const notificationsList = notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : []);
  const unreadNotifs = notificationsList.filter((n) => !n.is_read);

  const totalDownloads = uploadList.reduce((sum, r) => sum + (r.downloads || 0), 0);
  const totalViews = uploadList.reduce((sum, r) => sum + (r.views || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Academic Profile Onboarding Pop-up Modal (Auto-triggered for Google/new accounts) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <AcademicCapIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complete Your Student Profile
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Welcome to StudentHub! Fill in your academic details to access and share learning materials.
                </p>
              </div>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              {/* Email (Pre-filled from Google/Account) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Email
                </label>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-medium truncate">{user?.email}</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md flex-shrink-0">
                    Verified
                  </span>
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardingForm.first_name}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, first_name: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardingForm.last_name}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, last_name: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              {/* University Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1 flex items-center space-x-1.5">
                  <BuildingLibraryIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span>University *</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardingForm.university_name}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, university_name: e.target.value })}
                  placeholder="e.g. Addis Ababa University, ASTU"
                  className="input-field text-sm"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1 flex items-center space-x-1.5">
                  <AcademicCapIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span>Department *</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardingForm.department_name}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, department_name: e.target.value })}
                  placeholder="e.g. Computer Science, Electrical Engineering"
                  className="input-field text-sm"
                />
              </div>

              {/* Current Year - Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Current Year of Study (Number) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  required
                  value={onboardingForm.year_of_study}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, year_of_study: e.target.value })}
                  placeholder="e.g. 1, 2, 3, 4"
                  className="input-field text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingOnboarding}
                  className="w-full btn-primary py-2.5 text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
                >
                  <span>{savingOnboarding ? 'Saving Profile...' : 'Complete & Enter Dashboard'}</span>
                  <CheckCircleIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl my-8">
            <UploadForm
              onSuccess={() => {
                setShowUploadModal(false);
                queryClient.invalidateQueries(['myUploads']);
              }}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}



      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('dash_stat_uploads')}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {uploadList.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CloudArrowUpIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('downloads')}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('dash_tab_downloads')}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {downloadsList.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownTrayIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('dash_tab_notifications')}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {unreadNotifs.length}{' '}
                <span className="text-xs font-normal text-gray-400">unread</span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BellIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('dash_tab_ratings')}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {ratingsList.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <StarIconSolid className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        <nav className="flex space-x-6 text-sm font-semibold min-w-max">
          <button
            onClick={() => setActiveTab('my-uploads')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'my-uploads'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>{t('dash_tab_materials')} ({uploadList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'downloads'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>{t('dash_tab_downloads')} ({downloadsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BellIcon className="h-4 w-4" />
            <span>{t('dash_tab_notifications')}</span>
            {unreadNotifs.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>{t('dash_tab_settings')}</span>
          </button>

          <button
            onClick={() => setActiveTab('my-ratings')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'my-ratings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <StarIcon className="h-4 w-4" />
            <span>{t('dash_tab_ratings')} ({ratingsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserCircleIcon className="h-4 w-4" />
            <span>{t('dash_tab_profile')}</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-6 sm:p-8 shadow-sm transition-colors">
        {/* TAB 1: MY UPLOADS */}
        {activeTab === 'my-uploads' && (
          <div>
            {uploadsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : uploadList.length > 0 ? (
              <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                {uploadList.map((resource) => (
                  <div
                    key={resource.id}
                    className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                        {getFileIcon(resource.file_type, 'h-7 w-7')}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {resource.course_name && (
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                              {resource.course_name}
                            </span>
                          )}
                          {resource.university_name && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              &bull; {resource.university_name}
                            </span>
                          )}
                          {resource.department_name && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              &bull; {resource.department_name}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/resource/${resource.id}`}
                          className="font-bold text-base text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                        >
                          {resource.title}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {resource.description}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-400 mt-2">
                          <span className="flex items-center text-amber-500 font-semibold">
                            <StarIconSolid className="h-3 w-3 mr-1" />
                            {Number(resource.average_rating || 0).toFixed(1)}
                          </span>
                          <span>&bull; {resource.downloads || 0} downloads</span>
                          <span>&bull; {resource.views || 0} views</span>
                          <span>
                            &bull; {resource.uploaded_at && formatDistanceToNow(new Date(resource.uploaded_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete material"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                  No materials uploaded yet
                </h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Contribute lecture slides, previous exams, or notes to help other university students.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary text-xs"
                >
                  Upload First Resource
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: DOWNLOADS HISTORY */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  My Download History
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quickly find and re-download academic materials, slides, and exam questions you saved.
                </p>
              </div>
              {downloadsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your download history?')) {
                      clearDownloadsMutation.mutate();
                    }
                  }}
                  disabled={clearDownloadsMutation.isLoading}
                  className="self-start sm:self-auto text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-950/60 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {downloadsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-20 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : downloadsList.length > 0 ? (
              <div className="space-y-3">
                {downloadsList.map((item) => {
                  const res = item.resource_details || {};
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 hover:border-blue-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase ring-1 ring-blue-500/20">
                          {item.file_type || 'DOC'}
                        </div>
                        <div>
                          <Link
                            to={`/resource/${item.resource}`}
                            className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                          >
                            {item.resource_title || res.title || 'Academic Resource'}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {res.course_name && (
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {res.course_name}
                              </span>
                            )}
                            {res.university_name && (
                              <span>• {res.university_name}</span>
                            )}
                            {res.department_name && (
                              <span>({res.department_name})</span>
                            )}
                            {item.downloaded_at && (
                              <span className="text-[11px] text-gray-400">
                                • Downloaded {formatDistanceToNow(new Date(item.downloaded_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                        <Link
                          to={`/resource/${item.resource}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                        {item.download_url && (
                          <a
                            href={item.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                          >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            <span>Download Again</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <ArrowDownTrayIcon className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  No Download History Yet
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  When you download lecture notes, exams, or study guides, they will automatically be recorded here for fast access.
                </p>
                <Link
                  to="/browse"
                  className="mt-5 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>Browse Learning Materials</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Student Activity Notifications
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time updates when peers post study materials in your courses and universities.
                </p>
              </div>
              {unreadNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : notificationsList.length > 0 ? (
              <div className="space-y-3">
                {notificationsList.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      !n.is_read
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800/80'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="mt-1 flex-shrink-0">
                        {!n.is_read ? (
                          <span className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400 block ring-4 ring-blue-100 dark:ring-blue-950" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {n.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {n.message}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-gray-400 mt-2">
                          <span>
                            {n.created_at && formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                          {n.resource && (
                            <Link
                              to={`/resource/${n.resource}`}
                              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            >
                              Open Material &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 flex-shrink-0"
                        title="Mark as read"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BellIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                  No notifications yet
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  You will be notified whenever students post new materials or notes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS & PREFERENCES */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Left Side: Password Change and Theme Settings */}
            <div className="space-y-6">
              {/* Section 1: Change Password */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                  <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Change Password
                  </h3>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      placeholder="Enter current password"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="Minimum 8 characters"
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        placeholder="Re-enter new password"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="btn-primary text-xs font-semibold py-2 px-4 flex items-center space-x-1.5"
                    >
                      <ShieldCheckIcon className="h-4 w-4" />
                      <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Section 2: Dark / Light Mode Preference */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                  <SunIcon className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Display & Theme Preference
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                      !isDark
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <SunIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Light Mode</h4>
                      <p className="text-xs text-gray-500">Standard crisp view</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                      isDark
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <MoonIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Dark Mode</h4>
                      <p className="text-xs text-gray-500">Night studying & eye comfort</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Notification Preferences & Publishing Privacy */}
            <div className="space-y-6">
              {/* Section 3: Notification Preferences */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                  <BellIcon className="h-5 w-5 text-purple-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Notification Preferences
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        New Material Alerts
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive notifications when students post new materials in courses
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePreference('notify_new_resources')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        prefForm.notify_new_resources ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          prefForm.notify_new_resources ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Comments & Discussions
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get notified when peers comment or ask questions on your uploads
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePreference('notify_comments')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        prefForm.notify_comments ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          prefForm.notify_comments ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Email Notifications
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Send important campus announcements and upload summaries to your email
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePreference('email_notifications')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        prefForm.email_notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          prefForm.email_notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 4: Publishing & Privacy Preference */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                  <EyeIcon className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Publishing & Privacy
                  </h3>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Show My Name When Publishing Files
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Others can see your name as author when you publish resources. Toggle off to publish anonymously.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('show_name_on_publish')}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prefForm.show_name_on_publish ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        prefForm.show_name_on_publish ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MY RATINGS */}
        {activeTab === 'my-ratings' && (
          <div>
            {ratingsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : ratingsList.length > 0 ? (
              <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                {ratingsList.map((rating) => (
                  <div key={rating.id} className="pt-4 first:pt-0 flex items-center justify-between">
                    <div>
                      <Link
                        to={`/resource/${rating.resource}`}
                        className="font-bold text-sm text-gray-900 dark:text-white hover:text-blue-600"
                      >
                        Academic Resource #{rating.resource}
                      </Link>
                      <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                        <span>Rated on {rating.created_at && new Date(rating.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500 font-bold text-sm">
                      <StarIconSolid className="h-4 w-4 mr-1" />
                      <span>{rating.value} / 5</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-gray-400">
                You haven't rated any resources yet. Browse resources to rate quality materials!
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="max-w-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  University
                </label>
                <input
                  type="text"
                  value={profileForm.university_name}
                  onChange={(e) => setProfileForm({ ...profileForm, university_name: e.target.value })}
                  placeholder="e.g. Addis Ababa University"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={profileForm.department_name}
                  onChange={(e) => setProfileForm({ ...profileForm, department_name: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={profileForm.student_id}
                onChange={(e) => setProfileForm({ ...profileForm, student_id: e.target.value })}
                placeholder="e.g. UGR/1234/14"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                Year of Study (Number)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={profileForm.year_of_study}
                onChange={(e) => setProfileForm({ ...profileForm, year_of_study: e.target.value })}
                placeholder="e.g. 1, 2, 3, 4"
                className="input-field text-sm"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary text-xs sm:text-sm font-semibold py-2 px-5"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
