// Module: Auth Context
// Purpose: Provide JWT-based auth state and user profile to the entire app (PostgreSQL backend).

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api, uploadForm } from '../api/client.js';

const AuthContext = createContext(null);

const TOKEN_KEY   = 'auth_token';
const PROFILE_KEY = 'auth_profile';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on mount ───────────────
  useEffect(() => {
    const token       = localStorage.getItem(TOKEN_KEY);
    const savedRaw    = localStorage.getItem(PROFILE_KEY);

    if (token && savedRaw) {
      try {
        const saved = JSON.parse(savedRaw);
        // Expose the same shape the rest of the app expects (uid alias)
        setUser({ uid: saved.id, email: saved.email });
        setProfile(saved);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = async (identifier, password) => {
    try {
      const { token, profile: p } = await api.post('/api/auth/login', { identifier, password });
      localStorage.setItem(TOKEN_KEY,   token);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      setUser({ uid: p.id, email: p.email });
      setProfile(p);
      toast.success('Signed in successfully');
      return p;
    } catch (error) {
      const msg = error.statusCode === 401
        ? 'Wrong ID or Password'
        : (error.message || 'Sign in failed.');
      toast.error(msg);
      throw error;
    }
  };

  // ── Logout ────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setUser(null);
    setProfile(null);
  };

  // ── Register (admin creates a new user) ───────────────────────
  const registerUser = async (name, email, password, role, employeeId, phoneNumber, assignedSite) => {
    try {
      const newUser = await api.post('/api/auth/register', {
        name, email, password, role, employeeId, phoneNumber, assignedSite,
      });
      const label = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
      toast.success(`${label} ${name} created successfully`);
      return newUser;
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
      throw error;
    }
  };

  // ── Send a message (with optional file attachments) ──────────
  const sendMessage = async (receiverId, text, attachments = []) => {
    if (!user?.uid || !receiverId || (!text?.trim() && attachments.length === 0)) {
      throw new Error('Invalid message data');
    }
    try {
      const formData = new FormData();
      formData.append('receiverId', receiverId);
      formData.append('text', text?.trim() || '');
      for (const file of attachments) {
        if (file) formData.append('files', file);
      }
      const message = await uploadForm('/api/messages', formData);
      return message;
    } catch (error) {
      toast.error('Failed to send message');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, registerUser, sendMessage, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

