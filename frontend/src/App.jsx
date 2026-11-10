import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './hooks/useLanguage';

// Layout Components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="relative">
      <div className="h-14 w-14 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 animate-spin"></div>
      <div className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center tracking-wide">
        Loading Student Hub...
      </div>
    </div>
  </div>
);

// Protected Route wrapper (redirects unauthenticated users to home page)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { isAmharic } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const hideFooter = 
    location.pathname === '/login' || 
    location.pathname === '/register' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/upload') ||
    location.pathname.startsWith('/browse');

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200 ${
        isAmharic ? 'font-amharic' : 'font-sans'
      }`}
    >
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 mt-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/resource/:id" element={<ResourceDetailPage />} />
            
            {/* Auth routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <Dashboard initialTab="upload" />
              </ProtectedRoute>
            } />
            
            {/* 404 route */}
            <Route path="*" element={
              <div className="max-w-2xl mx-auto text-center py-24 px-4">
                <div className="h-24 w-24 mx-auto rounded-3xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-4xl mb-6 shadow-inner">
                  404
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The academic resource or page you are looking for does not exist or may have been moved.
                </p>
                <a
                  href="/"
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
                >
                  Return to Home
                </a>
              </div>
            } />
          </Routes>
        </Suspense>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;
