import axios from 'axios';

const API = 'http://localhost:5006';

const axiosInstance = axios.create({
  baseURL: API,
});

/* ─── Interceptor REQUEST : injecte le token à chaque requête ── */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─── Interceptor RESPONSE : gère le 401 automatiquement ─────── */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Met la requête en attente pendant que le refresh est en cours
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        // Pas de refresh token → logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API}/api/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { token, refreshToken: newRefreshToken } = res.data;

        localStorage.setItem('token', token);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        // Met à jour l'objet user en storage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({ ...parsed, token }));
        }

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
        processQueue(null, token);

        // Rejoue la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;