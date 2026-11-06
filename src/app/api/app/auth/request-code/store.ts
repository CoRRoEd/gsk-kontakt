// Используем globalThis, чтобы хранилище было единым для всех API-роутов
const globalForCodes = globalThis as unknown as {
  codeStore: Map<string, { code: string; expiresAt: number; attempts: number }> | undefined;
};

if (!globalForCodes.codeStore) {
  globalForCodes.codeStore = new Map();
}

export const codeStore = globalForCodes.codeStore;