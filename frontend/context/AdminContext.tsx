'use client';

import React, { createContext, useContext } from 'react';

export interface AdminUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  avatar?: string;
}

export interface AdminContextType {
  admin: AdminUser | null;
  refreshAdmin: () => Promise<void>;
  openAuditDrawer: () => void;
  closeAuditDrawer: () => void;
}

export const AdminContext = createContext<AdminContextType>({
  admin: null,
  refreshAdmin: async () => {},
  openAuditDrawer: () => {},
  closeAuditDrawer: () => {},
});

export const useAdmin = () => useContext(AdminContext);
