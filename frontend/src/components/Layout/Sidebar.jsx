import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resourcesAPI } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import {
  XMarkIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  HomeIcon,
  BookOpenIcon,
  EnvelopeIcon,
  CloudArrowUpIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const [universities, setUniversities] = useState([]);
  const [selectedUni, setSelectedUni] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (selectedUni) {
      loadDepartments(selectedUni);
    }
  }, [selectedUni]);

  const loadUniversities = async () => {
    try {
      const response = await resourcesAPI.getFilterOptions();
      const list = response.data?.universities || [];
      setUniversities(list);
    } catch (error) {
      console.error('Failed to load universities:', error);
      setUniversities([]);
    }
  };

  const uniList = universities;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-gray-900 dark:text-white">
                Student<span className="text-blue-600 dark:text-blue-400">Hub</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Nav */}
          <div className="p-4 space-y-1 border-b border-gray-200 dark:border-gray-800">
            <Link
              to="/"
              onClick={onClose}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
              }`}
            >
              <HomeIcon className="h-4 w-4" />
              <span>{t('nav_home')}</span>
            </Link>

            <Link
              to="/browse"
              onClick={onClose}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === '/browse'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
              }`}
            >
              <BookOpenIcon className="h-4 w-4" />
              <span>{t('nav_sources')}</span>
            </Link>

            <Link
              to="/upload"
              onClick={onClose}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>{t('nav_upload')}</span>
            </Link>
          </div>

          {/* University Directory List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('uni_section_tag')}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {uniList.length} Campuses
              </span>
            </div>

            <div className="space-y-1">
              {uniList.map((uni, idx) => (
                <div key={idx} className="border-b border-gray-100 dark:border-gray-900 pb-1">
                  <Link
                    to={`/browse?university=${encodeURIComponent(uni.name)}`}
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 text-left transition-colors"
                  >
                    <span className="truncate">{uni.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
