import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // If student explicitly signed out, do not auto-login
    if (localStorage.getItem('logged_out') === 'true') {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      if (response.data && response.data.id) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      localStorage.removeItem('logged_out');
      const response = await authAPI.login(credentials);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      localStorage.removeItem('logged_out');
      const response = await authAPI.register(userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const verifyOTP = async (payload) => {
    try {
      setError(null);
      localStorage.removeItem('logged_out');
      const response = await authAPI.verifyOTP(payload);
      if (response.data?.token) {
        localStorage.setItem('access_token', response.data.token);
      }
      if (response.data?.user) {
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      throw err;
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await authAPI.resendOTP({ email });
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification code';
      throw err;
    }
  };

  const loginWithGoogle = async (payload) => {
    try {
      setError(null);
      localStorage.removeItem('logged_out');
      const response = await authAPI.googleLogin(payload);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      localStorage.setItem('logged_out', 'true');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      await authAPI.logout();
    } catch (err) {
      console.warn('Backend logout warning:', err?.response?.data || err?.message);
    } finally {
      localStorage.setItem('logged_out', 'true');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    verifyOTP,
    resendOTP,
    loginWithGoogle,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
