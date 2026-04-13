import axiosInstance from './axiosInstance';
const AUTH_API = '/api/auth';

export const register = (data) => axiosInstance.post(`${AUTH_API}/register`, data);
export const login = (data) => axiosInstance.post(`${AUTH_API}/login`, data);

export const getHoldings = () =>
  axiosInstance.get('/api/holding').then((r) => r.data);

export const getSocietes = (holdingId = null) =>
  axiosInstance
    .get(`/api/societe${holdingId ? `?holdingId=${holdingId}` : ''}`)
    .then((r) => r.data);
