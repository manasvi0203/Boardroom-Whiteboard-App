import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

//not every component inside app can access authenticated data
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //check login on startup
  useEffect(() => {
    const token = localStorage.getItem('token'); //axios add Authorization : Beared token
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token')) //eg- token expired(401)
      .finally(() => setLoading(false));
  }, []);

  //to login user
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });

    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const updateProfile = async (updates) => {
    const res = await api.put('/auth/me', updates);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
