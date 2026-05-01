import axios from "axios";
import axiosInstance from "./axiosInstance";
import { buildApiUrl } from "./url";

const AUTH_API = "/api/auth";

// Login is public; register requires Admin auth on backend.
export const register = (data) => axiosInstance.post(`${AUTH_API}/register`, data);
export const login = (data) => axios.post(buildApiUrl(`${AUTH_API}/login`), data);

// Protected routes
export const getHoldings = () =>
  axiosInstance.get("/api/holding").then((r) => r.data);

export const getSocietes = (holdingId = null) =>
  axiosInstance
    .get(`/api/societe${holdingId ? `?holdingId=${holdingId}` : ""}`)
    .then((r) => r.data);
