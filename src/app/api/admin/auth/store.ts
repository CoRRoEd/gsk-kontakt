export interface AdminLoginState {
  userId: string;
  phone: string;
  step: 'password_verified' | 'code_sent';
  code?: string;
  codeExpiresAt?: number;
  codeAttempts?: number;
  createdAt: number;
}

// Используем globalThis, чтобы память не сбрасывалась при перекомпиляции в dev-режиме
const globalForStore = globalThis as unknown as {
  adminLoginStore: Map<string, AdminLoginState> | undefined;
};

export const adminLoginStore = 
  globalForStore.adminLoginStore ?? new Map<string, AdminLoginState>();

if (process.env.NODE_ENV !== 'production') {
  globalForStore.adminLoginStore = adminLoginStore;
}