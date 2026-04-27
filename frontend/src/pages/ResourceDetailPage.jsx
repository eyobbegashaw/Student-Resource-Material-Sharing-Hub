import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { resourcesAPI, ratingsAPI, commentsAPI } from '../services/api';
import CommentSection from '../components/Resources/CommentSection';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  StarIcon,
  DocumentIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'PDF':
      return <DocumentTextIcon className="h-12 w-12 text-red-500" />;
    case 'DOC':
      return <DocumentTextIcon className="h-12 w-12 text-blue-500" />;
    case 'PPT':
      return <PresentationChartBarIcon className="h-12 w-12 text-orange-500" />;
    case 'IMG':
      return <PhotoIcon className="h-12 w-12 text-green-500" />;
    default:
      return <DocumentIcon className="h-12 w-12 text-gray-500" />;
  }
};

const ResourceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch resource details
  const { data: resource, isLoading } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => resourcesAPI.getById(id).then(res => res.data),
    onSuccess: (data) => {
      // Increment view count
      resourcesAPI.view(id).catch(console.error);
    },
  });

  // Fetch user's rating for this resource
  const { data: userRatingData } = useQuery({
    queryKey: ['userRating', id],
    queryFn: () => ratingsAPI.getByResource(id).then(res => {
      const userRating = res.data.results?.find(r => r.user.id === user?.id);
      return userRating;
    }),
    enabled: !!user,
  });

  useEffect(() => {
    if (userRatingData) {
      setUserRating(userRatingData.value);
    }
  }, [userRatingData]);

  // Rating mutation
  const ratingMutation = useMutation({
    mutationFn: (value) => {
      if (userRatingData) {
        return ratingsAPI.update(userRatingData.id, { value });
      } else {
        return ratingsAPI.create({ resource: id, value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resource', id]);
      queryClient.invalidateQueries(['userRating', id]);
      toast.success('Rating saved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save rating');
    },
  });

  // Download handler
  const handleDownload = async () => {
    try {
      await resourcesAPI.download(id);
      // Trigger file download
      window.open(resource.file_url, '_blank');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleRatingClick = (value) => {
    if (!user) {
      toast.error('Please login to rate resources');
      return;
    }
    ratingMutation.mutate(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resource not found</h2>
        <button
          onClick={() => navigate('/browse')}
          className="btn-primary"
        >
          Browse Resources
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeftIcon className="h-5 w-5 mr-1" />
        Back
      </button>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {getFileIcon(resource.file_type)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {resource.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {resource.views} views
                  </span>
                  <span className="flex items-center">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    {resource.downloads} downloads
                  </span>
                  <span>
                    Uploaded {formatDistanceToNow(new Date(resource.uploaded_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">University</p>
              <p className="font-medium">{resource.university_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="font-medium">{resource.department_name}</p>
            </div>
            {resource.course && (
              <div>
                <p className="text-xs text-gray-500">Course</p>
                <p className="font-medium">{resource.course_code} - {resource.course_name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Uploaded by</p>
              <p className="font-medium">{resource.uploaded_by_full_name}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap font-amharic">
            {resource.description}
          </p>
        </div>

        {/* Tags */}
        {resource.tags && (
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {resource.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rating Section */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-3">Rating</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRatingClick(star)}
                  className="p-1"
                >
                  {star <= (hoverRating || userRating || resource.average_rating) ? (
                    <StarIconSolid className="h-8 w-8 text-yellow-400" />
                  ) : (
                    <StarIcon className="h-8 w-8 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-bold text-lg">{resource.average_rating?.toFixed(1)}</span>
              <span className="mx-1">·</span>
              <span>{resource.rating_count} ratings</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-6">
          <CommentSection resourceId={id} />
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
