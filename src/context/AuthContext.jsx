import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { apiClient } from '../services/apiClient';
import { disconnectEcho } from '../echo';
import { isStaffRole } from '../utils/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      disconnectEcho();
      setToken('');
      setUser(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Re-sync the signed-in user's role from the server on load, so a role change
  // made by an admin (e.g. user -> cashier, or cashier removed) takes effect on refresh.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiClient.get('/me', {}, { forceFresh: true })
      .then((res) => {
        const fresh = res?.user || res?.data?.user;
        if (cancelled || !fresh) return;
        if (!isStaffRole(fresh.role)) {
          // No longer staff -> sign out of the dashboard
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          return;
        }
        setUser(fresh);
        localStorage.setItem('admin_user', JSON.stringify(fresh));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      const authToken = res.token || res.data?.token || res.access_token || '';
      const userData = res.user || res.data?.user || { email, name: 'Admin' };

      // Only staff (admin / cashier) can use the dashboard
      if (authToken && userData.role && !isStaffRole(userData.role)) {
        // Revoke the token we just got so it isn't left active
        apiClient.request('/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        }).catch(() => {});
        const isAr = (localStorage.getItem('cafe90_language') || 'ar') === 'ar';
        throw new Error(isAr
          ? 'هذا الحساب ليس لديه صلاحية دخول لوحة التحكم'
          : 'This account does not have dashboard access');
      }

      if (authToken) {
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('admin_user', JSON.stringify(userData));

        // Register device with backend for push notifications immediately upon login
        api.registerDevice().then(regRes => {
          console.log('[Auth] Device registered for push notifications:', regRes);
        }).catch(err => {
          console.warn('[Auth] Register device error ignored on login:', err?.message);
        });
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // 1. Unregister device from push notifications before clearing credentials
        try {
          await api.unregisterDevice();
          console.log('[Auth] Device unregistered from notifications successfully');
        } catch (unregErr) {
          console.warn('[Auth] Unregister device error ignored on logout:', unregErr?.message);
        }

        // 2. Disconnect real-time Pusher / Echo sockets completely
        try {
          disconnectEcho();
        } catch (echoErr) {
          console.warn('[Auth] Echo disconnect error:', echoErr);
        }

        // 3. Call backend logout endpoint
        await api.logout();
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      disconnectEcho();
      setToken('');
      setUser(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || 'admin',
        isAdmin: (user?.role || 'admin') === 'admin',
        isCashier: user?.role === 'cashier',
        isAuthenticated: Boolean(token),
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
