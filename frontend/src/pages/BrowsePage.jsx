import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { resourcesAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import ResourceCard from '../components/Resources/ResourceCard';
import UploadForm from '../components/Resources/UploadForm';
import {
  Squares2X2Icon,
  ListBulletIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const BrowsePage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Layout preference
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem('sources_layout') || 'grid';
  });

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('sources_layout', newLayout);
  };

  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    university: searchParams.get('university') || '',
    department: searchParams.get('department') || '',
    year: searchParams.get('year') || '',
    file_type: searchParams.get('file_type') || '',
    sort: searchParams.get('sort') || '-uploaded_at',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  // Load distinct Universities & Departments from student registrations in database (no hardcoding / mock data)
  const { data: filterOptions, refetch: refetchFilterOptions } = useQuery(
    'browse_registered_filter_options',
    () => resourcesAPI.getFilterOptions().then((res) => res.data).catch(() => ({ universities: [], departments: [] })),
    { refetchOnWindowFocus: false }
  );

  const uniList = filterOptions?.universities || [];
  const deptList = filterOptions?.departments || [];

  // Main Resources Query
  const { data, isLoading, refetch } = useQuery(
    ['resources_browse', filters],
    () => {
      const queryParams = { ...filters };
      if (!queryParams.search) delete queryParams.search;
      if (!queryParams.university) delete queryParams.university;
      if (!queryParams.department) delete queryParams.department;
      if (!queryParams.year) delete queryParams.year;
      if (!queryParams.file_type) delete queryParams.file_type;
      return resourcesAPI.getAll(queryParams).then((res) => res.data);
    },
    { keepPreviousData: true }
  );

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== '-uploaded_at' && (k !== 'page' || v !== 1)) {
        params.set(k, v);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      university: '',
      department: '',
      year: '',
      file_type: '',
      sort: '-uploaded_at',
      page: 1,
    });
  };

  const handleShareClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowUploadModal(true);
  };

  const resultsList = data?.results || (Array.isArray(data) ? data : []);
  const totalCount = data?.count !== undefined ? data.count : resultsList.length;
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.university ||
    filters.department ||
    filters.year ||
    filters.file_type ||
    filters.sort !== '-uploaded_at'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl my-8">
            <UploadForm
              onSuccess={() => {
                setShowUploadModal(false);
                refetch();
                refetchFilterOptions();
              }}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Top Banner Header: Title + Share a Resource Button & Layout Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('browse_title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('browse_subtitle')}
          </p>
        </div>

        {/* Right CTA & Controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Share / Publish Resource Button */}
          <button
            type="button"
            onClick={handleShareClick}
            className="btn-primary text-xs sm:text-sm font-semibold flex items-center space-x-2 py-2 px-4 shadow-md shadow-blue-500/20 active:scale-95"
            title="Publish your study notes or exam solutions"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>{t('browse_publish_btn')}</span>
          </button>

          {/* Layout Toggle (Grid vs List) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleLayoutChange('grid')}
              title={t('browse_layout_grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                layout === 'grid'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleLayoutChange('list')}
              title={t('browse_layout_list')}
              className={`p-1.5 rounded-lg transition-colors ${
                layout === 'list'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TOP FILTERS TOOLBAR (Moved from left sidebar to top horizontal bar beside/in front of Share a Resource) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 sm:p-5 shadow-sm mb-6 space-y-4">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('browse_search_label')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('browse_search_input_ph')}
                className="input-field text-xs pl-8 py-2"
              />
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* University Dropdown - Fetched directly from student registration time in database */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('browse_filter_university')}
            </label>
            <select
              value={filters.university}
              onChange={(e) => handleFilterChange('university', e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">{t('browse_all_unis')}</option>
              {uniList.map((u, idx) => (
                <option key={u.value || u.name || idx} value={u.value}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Dropdown - Fetched directly from student registration time in database */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('browse_filter_department')}
            </label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">{t('browse_all_depts')}</option>
              {deptList.map((d, idx) => (
                <option key={d.value || d.name || idx} value={d.value}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('browse_filter_year')}
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">{t('browse_all_years')}</option>
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  {t('resource_year')} {y}
                </option>
              ))}
            </select>
          </div>

          {/* File Format Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {t('browse_filter_type')}
            </label>
            <select
              value={filters.file_type}
              onChange={(e) => handleFilterChange('file_type', e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="">{t('browse_all_types')}</option>
              <option value="PDF">PDF Document (.pdf)</option>
              <option value="DOC">Word Document (.docx)</option>
              <option value="PPT">PowerPoint (.pptx)</option>
              <option value="XLS">Excel Sheet (.xlsx)</option>
              <option value="IMG">Images (.jpg, .png)</option>
              <option value="TXT">Text Notes (.txt)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sort By, Clear Filters & Results count */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/80 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {t('browse_sort_by')}:
            </span>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="input-field text-xs py-1.5 w-auto"
            >
              <option value="-uploaded_at">{t('browse_sort_newest')}</option>
              <option value="-average_rating">{t('browse_sort_top_rated')}</option>
              <option value="-downloads">{t('browse_sort_most_downloaded')}</option>
              <option value="-views">{t('browse_sort_views')}</option>
              <option value="title">{t('browse_sort_az')}</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1"
              >
                <ArrowPathIcon className="h-3 w-3" />
                <span>{t('browse_clear_filters')}</span>
              </button>
            )}

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t('browse_results_count')}: <strong className="text-blue-600 dark:text-blue-400">{totalCount}</strong>
            </p>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {filters.search && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <span>"{filters.search}"</span>
                <button type="button" onClick={() => handleFilterChange('search', '')}>
                  <XMarkIcon className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {filters.university && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <span>Uni: {filters.university}</span>
                <button type="button" onClick={() => handleFilterChange('university', '')}>
                  <XMarkIcon className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {filters.department && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <span>Dept: {filters.department}</span>
                <button type="button" onClick={() => handleFilterChange('department', '')}>
                  <XMarkIcon className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {filters.file_type && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <span>Format: {filters.file_type}</span>
                <button type="button" onClick={() => handleFilterChange('file_type', '')}>
                  <XMarkIcon className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {filters.year && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <span>Year {filters.year}</span>
                <button type="button" onClick={() => handleFilterChange('year', '')}>
                  <XMarkIcon className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Results Section (Full Width, No Left Sidebar) */}
      <div className="w-full">
        {isLoading ? (
          <div
            className={
              layout === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
                : 'space-y-3'
            }
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : resultsList.length > 0 ? (
          layout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {resultsList.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} layout="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {resultsList.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} layout="list" />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-8 shadow-sm">
            <DocumentTextIcon className="h-14 w-14 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('browse_empty_title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {t('browse_empty_desc')}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-secondary text-xs"
                >
                  {t('browse_clear_filters')}
                </button>
              )}
              <button
                type="button"
                onClick={handleShareClick}
                className="btn-primary text-xs flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>{t('browse_publish_btn')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 text-xs">
            <button
              type="button"
              disabled={Number(filters.page) <= 1}
              onClick={() => handleFilterChange('page', Number(filters.page) - 1)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Page {filters.page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={Number(filters.page) >= totalPages}
              onClick={() => handleFilterChange('page', Number(filters.page) + 1)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;