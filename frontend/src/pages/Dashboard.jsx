import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { resourcesAPI, ratingsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  StarIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import UploadForm from '../components/Resources/UploadForm';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = ({ initialTab = 'my-uploads' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Fetch user's uploads
  const { data: myUploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ['myUploads'],
    queryFn: () => resourcesAPI.getAll({ uploaded_by: user?.id }).then(res => res.data),
    enabled: !!user,
  });

  // Fetch user's ratings
  const { data: myRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['myRatings'],
    queryFn: () => ratingsAPI.getMyRatings().then(res => res.data),
    enabled: !!user,
  });

  // Delete resource mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => resourcesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myUploads']);
      toast.success('Resource deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete resource');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowUploadModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.full_name || user?.username}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-900">{myUploads?.count || 0}</p>
            </div>
            <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">
                {myUploads?.results?.reduce((sum, r) => sum + r.downloads, 0) || 0}
              </p>
            </div>
            <ArrowDownTrayIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {myUploads?.results?.reduce((sum, r) => sum + r.views, 0) || 0}
              </p>
            </div>
            <EyeIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ratings Given</p>
              <p className="text-2xl font-bold text-gray-900">{myRatings?.count || 0}</p>
            </div>
            <StarIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('my-uploads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-uploads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Uploads
          </button>
          <button
            onClick={() => setActiveTab('my-ratings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-ratings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Ratings
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'my-uploads' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Uploaded Resources</h2>
              <button
                onClick={() => {
                  setEditingResource(null);
                  setShowUploadModal(true);
                }}
                className="btn-primary"
              >
                Upload New Resource
              </button>
            </div>

            {uploadsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : myUploads?.results?.length > 0 ? (
              <div className="space-y-4">
                {myUploads.results.map(resource => (
                  <div
                    key={resource.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <DocumentIcon className="h-8 w-8 text-gray-400" />
                        <div>
                          <Link
                            to={`/resource/${resource.id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-800"
                          >
                            {resource.title}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            {resource.description?.substring(0, 150)}
                            {resource.description?.length > 150 && '...'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                              {resource.downloads}
                            </span>
                            <span className="flex items-center">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {resource.views}
                            </span>
                            <span className="flex items-center">
                              <StarIcon className="h-3 w-3 mr-1" />
                              {resource.average_rating?.toFixed(1)}
                            </span>
                            <span>
                              Uploaded {formatDistanceToNow(new Date(resource.uploaded_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                You haven't uploaded any resources yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'my-ratings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Resources I've Rated</h2>
            
            {ratingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : myRatings?.results?.length > 0 ? (
              <div className="space-y-4">
                {myRatings.results.map(rating => (
                  <div
                    key={rating.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/resource/${rating.resource.id}`}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800"
                        >
                          {rating.resource.title}
                        </Link>
                        <div className="flex items-center mt-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <StarIconSolid
                              key={star}
                              className={`h-5 w-5 ${
                                star <= rating.value ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            Rated {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                You haven't rated any resources yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
            
            <div className="max-w-2xl">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-500">
                        {user?.full_name?.charAt(0) || user?.username?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <button className="btn-secondary">
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.first_name}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.last_name}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="input-field bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University
                </label>
                <input
                  type="text"
                  defaultValue={user?.university_name}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  defaultValue={user?.department_name}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year of Study
                </label>
                <select
                  defaultValue={user?.year_of_study}
                  className="input-field"
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                </select>
              </div>

              <button className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingResource ? 'Edit Resource' : 'Upload New Resource'}
              </h2>
              <UploadForm
                initialData={editingResource}
                onSuccess={() => {
                  setShowUploadModal(false);
                  setEditingResource(null);
                }}
                onCancel={() => {
                  setShowUploadModal(false);
                  setEditingResource(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
