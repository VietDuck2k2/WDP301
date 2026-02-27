import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authApi.getProfile();
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("Failed to fetch profile during auth initialization:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return { success: true, role: res.data.user.role };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.message || 'Login failed due to an error';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
