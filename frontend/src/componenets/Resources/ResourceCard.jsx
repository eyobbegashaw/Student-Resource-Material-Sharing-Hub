
import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'PDF':
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    case 'DOC':
      return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
    case 'PPT':
      return <PresentationChartBarIcon className="h-8 w-8 text-orange-500" />;
    case 'IMG':
      return <PhotoIcon className="h-8 w-8 text-green-500" />;
    default:
      return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  }
};

const ResourceCard = ({ resource }) => {
  const {
    id,
    title,
    description,
    file_type,
    uploaded_by_full_name,
    department_name,
    university_name,
    uploaded_at,
    downloads,
    views,
    average_rating,
    rating_count,
  } = resource;

  const truncatedDescription = description?.length > 100
    ? `${description.substring(0, 100)}...`
    : description;

  return (
    <Link to={`/resource/${id}`}>
      <div className="card hover:shadow-lg transition-shadow duration-200">
        <div className="p-5">
          <div className="flex items-start space-x-4">
            {/* File Icon */}
            <div className="flex-shrink-0">
              {getFileIcon(file_type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-2">
                {truncatedDescription}
              </p>

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <StarIcon className="h-3 w-3 mr-1" />
                  {average_rating?.toFixed(1)} ({rating_count})
                </span>
                <span className="flex items-center">
                  <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                  {downloads}
                </span>
                <span className="flex items-center">
                  <EyeIcon className="h-3 w-3 mr-1" />
                  {views}
                </span>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">
                    {university_name}
                  </span>
                  {' • '}
                  <span>{department_name}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(uploaded_at), { addSuffix: true })}
                </div>
              </div>

              {/* Uploader */}
              <div className="mt-1 text-xs text-gray-400">
                by {uploaded_by_full_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;