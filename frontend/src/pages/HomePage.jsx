
import React from 'react';
import { useQuery } from 'react-query';
import { resourcesAPI } from '../services/api';
import ResourceCard from '../components/Resources/ResourceCard';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const { data: topRated, isLoading: topRatedLoading } = useQuery(
    'topRated',
    () => resourcesAPI.getTopRated().then(res => res.data)
  );

  const { data: mostDownloaded, isLoading: mostDownloadedLoading } = useQuery(
    'mostDownloaded',
    () => resourcesAPI.getMostDownloaded().then(res => res.data)
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Student Resource & Material Sharing Hub
          </h1>
          <p className="text-xl mb-6 max-w-2xl">
            Access and share academic resources with students from universities across Ethiopia. 
            Breaking down barriers to educational materials.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Browse Resources
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Top Rated Resources</h2>
          <Link to="/browse?sort=-average_rating" className="text-blue-600 hover:text-blue-800 flex items-center">
            View All
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {topRatedLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="p-5">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRated?.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>

      {/* Most Downloaded Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Most Downloaded</h2>
          <Link to="/browse?sort=-downloads" className="text-blue-600 hover:text-blue-800 flex items-center">
            View All
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {mostDownloadedLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="p-5">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mostDownloaded?.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">1,000+</div>
          <div className="text-gray-600">Resources Shared</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
          <div className="text-gray-600">Universities</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">5,000+</div>
          <div className="text-gray-600">Active Students</div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;