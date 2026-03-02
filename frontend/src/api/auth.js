import axios from 'axios';

const API = 'https://localhost:7292/api/auth';

export const register = (data) => axios.post(`${API}/register`, data);
export const login = (data) => axios.post(`${API}/login`, data);
export const getHoldings = () => axios.get(`${API}/holdings`);
export const getSocietes = (holdingId = null) =>
  axios.get(`${API}/societes${holdingId ? `?holdingId=${holdingId}` : ''}`);