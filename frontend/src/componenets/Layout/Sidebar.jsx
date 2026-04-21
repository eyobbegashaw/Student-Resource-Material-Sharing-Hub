
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { universityAPI } from '../../services/api';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
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
      const response = await universityAPI.getAll();
      setUniversities(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load universities:', error);
    }
  };

  const loadDepartments = async (universityId) => {
    setLoading(true);
    try {
      const response = await universityAPI.getDepartments(universityId);
      setDepartments(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Browse by</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className={`block px-4 py-2 rounded-lg ${
                    location.pathname === '/'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={onClose}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/browse"
                  className={`block px-4 py-2 rounded-lg ${
                    location.pathname === '/browse'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={onClose}
                >
                  All Resources
                </Link>
              </li>

              {/* University Filter */}
              <li className="pt-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Universities
                </h3>
              </li>

              {universities.map((uni) => (
                <li key={uni.id}>
                  <button
                    onClick={() => setSelectedUni(selectedUni === uni.id ? null : uni.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <span className="text-sm">{uni.name}</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${
                        selectedUni === uni.id ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Departments */}
                  {selectedUni === uni.id && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {loading ? (
                        <li className="px-4 py-2 text-sm text-gray-500">Loading...</li>
                      ) : (
                        departments.map((dept) => (
                          <li key={dept.id}>
                            <Link
                              to={`/browse?department=${dept.id}`}
                              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                              onClick={onClose}
                            >
                              {dept.name}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Link
              to="/upload"
              className="block w-full px-4 py-2 text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              onClick={onClose}
            >
              Upload Resource
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;