import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { resourcesAPI } from '../services/api';
import ResourceCard from '../components/Resources/ResourceCard';
import { FunnelIcon } from '@heroicons/react/24/outline';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || '',
    year: searchParams.get('year') || '',
    file_type: searchParams.get('file_type') || '',
    sort: searchParams.get('sort') || '-uploaded_at',
  });

  const { data, isLoading, refetch } = useQuery(
    ['resources', filters],
    () => resourcesAPI.getAll(filters).then(res => res.data),
    { keepPreviousData: true }
  );

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    refetch();
  }, [filters, setSearchParams, refetch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      year: '',
      file_type: '',
      sort: '-uploaded_at',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Resources</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div
          className={`lg:w-64 lg:block ${
            showFilters ? 'block' : 'hidden'
          }`}
        >
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Filters</h2>
            
            {/* Sort */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input-field text-sm"
              >
                <option value="-uploaded_at">Newest First</option>
                <option value="uploaded_at">Oldest First</option>
                <option value="-downloads">Most Downloaded</option>
                <option value="-average_rating">Top Rated</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>

            {/* File Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={filters.file_type}
                onChange={(e) => handleFilterChange('file_type', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">All Types</option>
                <option value="PDF">PDF</option>
                <option value="DOC">Word Document</option>
                <option value="PPT">PowerPoint</option>
                <option value="IMG">Image</option>
              </select>
            </div>

            {/* Year */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">All Years</option>
                {[1, 2, 3, 4, 5].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full btn-secondary text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card animate-pulse">
                  <div className="p-5">
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : data?.results?.length > 0 ? (
            <div className="space-y-4">
              {data.results.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No resources found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {data?.count > 20 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterChange('page', data.previous?.split('page=')[1])}
                  disabled={!data.previous}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {filters.page || 1} of {Math.ceil(data.count / 20)}
                </span>
                <button
                  onClick={() => handleFilterChange('page', data.next?.split('page=')[1])}
                  disabled={!data.next}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;