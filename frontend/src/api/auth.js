// auth.js — login/register n'ont PAS besoin du token donc axios direct
// Tout le reste passe par axiosInstance (token injecté automatiquement)
import axios from 'axios';
import axiosInstance from './axiosInstance';

const API = '/api/auth';

// Ces 2 routes sont publiques → axios brut (pas de token nécessaire)
export const register  = (data) => axios.post(`http://localhost:5006${API}/register`, data);
export const login     = (data) => axios.post(`http://localhost:5006${API}/login`, data);

// Ces routes sont protégées → axiosInstance (token injecté + refresh auto)
export const getHoldings = () =>
  axiosInstance.get(`${API}/holdings`).then(r => r.data);

export const getSocietes = (holdingId = null) =>
  axiosInstance
    .get(`${API}/societes${holdingId ? `?holdingId=${holdingId}` : ''}`)
    .then(r => r.data);