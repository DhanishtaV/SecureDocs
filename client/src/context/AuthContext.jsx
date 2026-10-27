import { createContext, useContext, useEffect, useState } from 'react';
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  // Check whether the saved token is still valid
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();

        setUser(data.user || data);
        setToken(savedToken);
      } catch (error) {
        console.error('Authentication check failed:', error);

        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register
  const register = async (userData) => {
    const data = await registerUser(userData);

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }

    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  // Login
  const login = async (userData) => {
    const data = await loginUser(userData);

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }

    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider'
    );
  }

  return context;
};