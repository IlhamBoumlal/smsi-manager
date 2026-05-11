import axiosInstance from './axiosInstance';

const BASE = '/api/controles';

export const getAllControles = () => axiosInstance.get(BASE).then(r => r.data);

export const updateControle = (id, body) => axiosInstance.put(`${BASE}/${id}`, body).then(r => r.data);
