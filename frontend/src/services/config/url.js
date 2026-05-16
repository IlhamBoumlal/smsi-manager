export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006';

export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const resolveAssetUrl = (path, fallback = '') => {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return buildApiUrl(path.startsWith('/') ? path : `/${path}`);
};
