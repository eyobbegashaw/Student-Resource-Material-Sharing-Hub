import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { resourcesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  DocumentIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

export const getFileIcon = (fileType, size = 'h-9 w-9') => {
  switch (fileType) {
    case 'PDF':
      return <DocumentTextIcon className={`${size} text-red-500`} />;
    case 'DOC':
      return <DocumentTextIcon className={`${size} text-blue-500`} />;
    case 'PPT':
      return <PresentationChartBarIcon className={`${size} text-orange-500`} />;
    case 'XLS':
      return <TableCellsIcon className={`${size} text-emerald-500`} />;
    case 'IMG':
      return <PhotoIcon className={`${size} text-green-500`} />;
    default:
      return <DocumentIcon className={`${size} text-gray-500`} />;
  }
};

export const getFileBadgeStyle = (fileType) => {
  switch (fileType) {
    case 'PDF':
      return 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60';
    case 'DOC':
      return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60';
    case 'PPT':
      return 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60';
    case 'XLS':
      return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60';
    case 'IMG':
      return 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60';
    case 'TXT':
      return 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
  }
};

const ResourceCard = ({ resource, layout = 'grid' }) => {
  const { t } = useLanguage();

  if (!resource) return null;

  const {
    id,
    title,
    course_name,
    university_name,
    description,
    file_type,
    file_url,
    download_url,
    uploaded_by_full_name,
    uploaded_by_student_id,
    department_name,
    uploaded_at,
    downloads = 0,
    views = 0,
    average_rating = 0,
    rating_count = 0,
    year,
  } = resource;

  const formattedDate = uploaded_at
    ? formatDistanceToNow(new Date(uploaded_at), { addSuffix: true })
    : '';

  const handleDirectDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const targetUrl = download_url || file_url;
    if (!targetUrl) {
      toast.error('File link not available.');
      return;
    }

    try {
      await resourcesAPI.download(id);
    } catch (err) {
      console.error('Download counter increment failed:', err);
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // LIST / ROW VIEW
  if (layout === 'list') {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 sm:p-5 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200 group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Icon & Core Details */}
          <Link to={`/resource/${id}`} className="flex items-start space-x-4 min-w-0 flex-1">
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 group-hover:scale-105 transition-transform">
              {getFileIcon(file_type, 'h-8 w-8')}
            </div>

            <div className="min-w-0 flex-1">
              {/* Badges: Format, Course, University */}
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${getFileBadgeStyle(file_type)}`}>
                  {file_type || 'PDF'}
                </span>
                {course_name && (
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
                    {course_name}
                  </span>
                )}
                {university_name && (
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    &bull; {university_name}
                  </span>
                )}
                {department_name && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    &bull; {department_name}
                  </span>
                )}
                {year && (
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {t('resource_year')} {year}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {description || t('resource_academic_notes')}
              </p>

              {/* Student Poster Attribution */}
              <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 mt-2">
                <UserCircleIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  {t('resource_posted_by')} <strong className="text-gray-700 dark:text-gray-300 font-medium">{uploaded_by_full_name || 'Student'}</strong>
                  {uploaded_by_student_id ? ` (ID: ${uploaded_by_student_id})` : ''}
                </span>
                <span>&bull; {formattedDate}</span>
              </div>
            </div>
          </Link>

          {/* Right: Metrics & Download Button */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 gap-3 text-xs flex-shrink-0">
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
              <span className="flex items-center text-amber-500 font-semibold">
                <StarIconSolid className="h-3.5 w-3.5 mr-1" />
                {Number(average_rating).toFixed(1)}
                <span className="text-gray-400 text-[10px] ml-0.5">({rating_count})</span>
              </span>
              <span className="flex items-center">
                <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                {downloads}
              </span>
              <span className="flex items-center">
                <EyeIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                {views}
              </span>
            </div>

            {/* Direct Download Option */}
            <button
              type="button"
              onClick={handleDirectDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
              title="Download or open material directly"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GRID CARD VIEW (Default)
  return (
    <div className="card h-full flex flex-col justify-between p-5 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 group">
      <div>
        {/* Header row: File icon & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 group-hover:scale-105 transition-transform flex-shrink-0">
            {getFileIcon(file_type, 'h-7 w-7')}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${getFileBadgeStyle(file_type)}`}>
              {file_type || 'PDF'}
            </span>
            {year && (
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                Yr {year}
              </span>
            )}
          </div>
        </div>

        {/* Course & University Pill */}
        <div className="mb-2">
          {course_name ? (
            <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-0.5 rounded-md mb-1 max-w-full truncate">
              {course_name}
            </span>
          ) : null}
          <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
            {university_name || 'Ethiopian University'}
          </div>
          {department_name && (
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {department_name}
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/resource/${id}`}>
          <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 leading-snug">
            {title}
          </h3>
        </Link>

        {/* Description snippet */}
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
          {description || t('resource_academic_notes')}
        </p>
      </div>

      <div>
        {/* Posting Student's Actual Name & Rating */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-300 mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 truncate pr-2">
            <UserCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="truncate">
              <span className="text-gray-900 dark:text-white font-medium truncate block">
                {t('resource_posted_by')}: {uploaded_by_full_name || 'Student Contributor'}
              </span>
              {uploaded_by_student_id && (
                <span className="text-[10px] text-gray-400 block font-mono">
                  ID: {uploaded_by_student_id}
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center text-amber-500 font-bold text-xs flex-shrink-0">
            <StarIconSolid className="h-3.5 w-3.5 mr-1" />
            <span>{Number(average_rating).toFixed(1)}</span>
            <span className="text-gray-400 text-[10px] ml-0.5">({rating_count})</span>
          </div>
        </div>

        {/* Footer: Metrics & Direct Download Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-3 text-[11px] text-gray-400">
            <span className="flex items-center" title={`${downloads} downloads`}>
              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {downloads}
            </span>
            <span className="flex items-center" title={`${views} views`}>
              <EyeIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {views}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDirectDownload}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
            title="Download or open material directly"
          >
            <ArrowDownTrayIcon className="h-3 w-3" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
