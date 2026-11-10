import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { resourcesAPI, ratingsAPI } from '../services/api';
import CommentSection from '../components/Resources/CommentSection';
import { getFileIcon } from '../components/Resources/ResourceCard';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  ChevronLeftIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch resource details
  const { data: resource, isLoading } = useQuery(
    ['resource', id],
    () => resourcesAPI.getById(id).then((res) => res.data),
    {
      onSuccess: () => {
        // Increment view count in backend
        resourcesAPI.view(id).catch(console.error);
      },
    }
  );

  // Fetch user's rating for this resource
  const { data: userRatingData } = useQuery(
    ['userRating', id],
    () =>
      ratingsAPI.getByResource(id).then((res) => {
        const rating = res.data?.results?.find((r) => r.user?.id === user?.id);
        return rating;
      }),
    { enabled: !!user }
  );

  useEffect(() => {
    if (userRatingData) {
      setUserRating(userRatingData.value);
    }
  }, [userRatingData]);

  // Rating mutation
  const ratingMutation = useMutation(
    (value) => ratingsAPI.create({ resource: id, value }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['resource', id]);
        queryClient.invalidateQueries(['userRating', id]);
        toast.success('Your rating has been recorded!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit rating');
      },
    }
  );

  // Download handler
  const handleDownload = async () => {
    const targetUrl = resource?.download_url || resource?.file_url;
    if (!targetUrl) {
      toast.error('File link not available');
      return;
    }
    try {
      await resourcesAPI.download(id);
      queryClient.invalidateQueries(['resource', id]);
      queryClient.invalidateQueries(['download_history']);
    } catch (error) {
      console.error('Download counter update error:', error);
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleRatingClick = (value) => {
    if (!user) {
      toast.error('Please login to rate academic resources');
      return;
    }
    setUserRating(value);
    ratingMutation.mutate(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative text-center">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 animate-spin"></div>
          <p className="mt-4 text-xs font-semibold text-gray-500">{t('resource_loading')}</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('resource_not_found')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('resource_not_found_desc')}</p>
        <Link to="/browse" className="btn-primary text-sm inline-flex items-center space-x-2">
          <span>{t('sources_view_all')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span>{t('resource_back')}</span>
      </button>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xl overflow-hidden mb-8 transition-colors">
        {/* Header Hero Banner inside Card */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 flex-shrink-0">
                {getFileIcon(resource.file_type, 'h-10 w-10')}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {resource.file_type || 'ACADEMIC FILE'}
                  </span>
                  {resource.year && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {t('resource_year')} {resource.year}
                    </span>
                  )}
                  {resource.semester && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {t('resource_semester')} {resource.semester}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                  {resource.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3">
                  <span className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {resource.views} {t('resource_views')}
                  </span>
                  <span className="flex items-center">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {resource.downloads} {t('resource_downloads')}
                  </span>
                  {resource.uploaded_at && (
                    <span>
                      {formatDistanceToNow(new Date(resource.uploaded_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Download & Share */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleShare}
                title="Share link"
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="btn-primary py-3 px-6 text-sm font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span>{t('resource_download_btn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Academic Context Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 sm:p-8 bg-gray-50/70 dark:bg-gray-950/40 border-b border-gray-100 dark:border-gray-800 text-xs sm:text-sm">
          <div>
            <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">
              {t('upload_field_uni')}
            </span>
            <p className="font-bold text-gray-900 dark:text-white">
              {resource.university_name || 'N/A'}
            </p>
          </div>

          <div>
            <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">
              {t('upload_field_dept')}
            </span>
            <p className="font-bold text-gray-900 dark:text-white">
              {resource.department_name || 'General Studies'}
            </p>
          </div>

          <div>
            <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">
              {t('upload_field_course')}
            </span>
            <p className="font-bold text-gray-900 dark:text-white">
              {resource.course_name ? `${resource.course_code || ''} ${resource.course_name}`.trim() : 'N/A'}
            </p>
          </div>

          <div>
            <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">
              {t('resource_uploaded_by')}
            </span>
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {resource.uploaded_by_full_name || resource.uploaded_by_username || 'Student Contributor'}
            </p>
          </div>
        </div>

        {/* Description Section */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
            {t('upload_desc_label')}
          </h2>
          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-amharic">
            {resource.description || 'No detailed description provided for this resource.'}
          </div>
        </div>

        {/* Tags */}
        {resource.tags && (
          <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Tags & Subjects
            </h2>
            <div className="flex flex-wrap gap-2">
              {resource.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-900/60"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Rating Widget */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Rate this Academic Resource
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Current Average: <strong className="text-amber-500">{Number(resource.average_rating || 0).toFixed(1)} ★</strong> from {resource.rating_count || 0} student ratings
            </p>
          </div>

          {/* Star Buttons */}
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(star)}
                className="p-1 hover:scale-125 transition-transform focus:outline-none"
              >
                <StarIconSolid
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoverRating || userRating)
                      ? 'text-amber-400'
                      : 'text-gray-300 dark:text-gray-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Discussion Forum / Comment Section */}
      <CommentSection resourceId={id} />
    </div>
  );
};

export default ResourceDetailPage;
