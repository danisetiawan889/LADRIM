'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';

export type SavedItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  category?: string;
  material?: string;
};

type SavedArchiveCtx = {
  savedItems: SavedItem[];
  isSaved: (id: string) => boolean;
  toggleSave: (item: SavedItem) => Promise<void> | void;
  removeSaved: (id: string) => void;
  clearSaved: () => void;
  count: number;
  isAuthenticated: boolean | null;
  checkAuth: () => Promise<boolean>;
};

const SavedArchiveContext = createContext<SavedArchiveCtx | null>(null);

export function SavedArchiveProvider({ children }: { children: ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setIsAuthenticated(true);
          return true;
        }
      }
      setIsAuthenticated(false);
      return false;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // 1. Check user login status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2. Load saved archive from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ladrim.saved_archive');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedItems(parsed);
        }
      }
    } catch (e) {
      console.error('Error reading saved archive from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 3. Persist to localStorage whenever savedItems changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('ladrim.saved_archive', JSON.stringify(savedItems));
    } catch (e) {
      console.error('Error saving archive to localStorage:', e);
    }
  }, [savedItems, isLoaded]);

  const toggleSave = useCallback(async (item: SavedItem) => {
    // Check if user is logged in
    const isAuthed = await checkAuth();

    if (!isAuthed) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `/account?redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = redirectUrl;
      }
      return;
    }

    setSavedItems((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      if (exists) {
        return prev.filter((x) => x.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, [checkAuth]);

  const removeSaved = useCallback((id: string) => {
    setSavedItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clearSaved = useCallback(() => {
    setSavedItems([]);
    try {
      localStorage.removeItem('ladrim.saved_archive');
    } catch { }
  }, []);

  const value = useMemo<SavedArchiveCtx>(() => ({
    savedItems: isAuthenticated ? savedItems : [],
    count: isAuthenticated ? savedItems.length : 0,
    isSaved: (id: string) => {
      if (!isAuthenticated) return false;
      return savedItems.some((item) => item.id === id);
    },
    toggleSave,
    removeSaved,
    clearSaved,
    isAuthenticated,
    checkAuth,
  }), [savedItems, isAuthenticated, toggleSave, removeSaved, clearSaved, checkAuth]);

  return (
    <SavedArchiveContext.Provider value={value}>
      {children}
    </SavedArchiveContext.Provider>
  );
}

export const useSavedArchive = () => {
  const ctx = useContext(SavedArchiveContext);
  if (!ctx) {
    throw new Error('useSavedArchive must be used within a SavedArchiveProvider');
  }
  return ctx;
};
