import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
      if (token === 'demo') {
        setLoading(false);
        return;
      }
      authApi.getProfile()
        .then((res) => {
          if (res.success && res.data) {
            const u = res.data;
            const profile = { _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, avatar: u.avatar };
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.success && res.data) {
      const { user: u, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, avatar: u.avatar }));
      setUser({ _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, avatar: u.avatar });
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const enterDemo = (role) => {
    const user = { _id: 'demo', firstName: 'Demo', lastName: '', email: 'demo@local', role };
    localStorage.setItem('token', 'demo');
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, enterDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
