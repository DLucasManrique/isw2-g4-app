export const API_URL = (process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:8080')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');
