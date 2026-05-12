// clauses.js — utilise l'instance centrale (refresh token automatique)
import axiosInstance from './axiosInstance';

const API = '/api/clauses';

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const getDashboard   = () => axiosInstance.get(`${API}/dashboard`).then(r => r.data);
export const getGlobalStats = () => axiosInstance.get(`${API}/stats`).then(r => r.data);

// ── CLAUSES ───────────────────────────────────────────────────────────────────
export const getClauses = ()   => axiosInstance.get(API).then(r => r.data);
export const getClause  = (id) => axiosInstance.get(`${API}/${id}`).then(r => r.data);

// ── CONFORMITY ────────────────────────────────────────────────────────────────
export const getConformity    = (subClauseId)       => axiosInstance.get(`${API}/conformity/${subClauseId}`).then(r => r.data);
export const upsertConformity = (subClauseId, data) => axiosInstance.put(`${API}/conformity`, { subClauseId, ...data }).then(r => r.data);

// ── CONFORMITY PROOFS ─────────────────────────────────────────────────────────
export const getConformityProofs = (subClauseId) =>
  axiosInstance.get(`${API}/proofs/${subClauseId}`).then(r => r.data);

export const upsertConformityProof = (subClauseId, description) =>
  axiosInstance.post(`${API}/proofs`, { isoClauseId: subClauseId, description }).then(r => r.data);

export const uploadConformityProofFile = (proofId, file, description, onProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  if (description) fd.append('description', description);
  return axiosInstance.post(`${API}/proofs/${proofId}/files`, fd, {
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);
};

export const deleteConformityProofFile = (fileId) =>
  axiosInstance.delete(`${API}/proofs/files/${fileId}`).then(r => r.data);

// ── ACTION PLANS ──────────────────────────────────────────────────────────────
export const getActionPlans   = (isoClauseId) => axiosInstance.get(`${API}/plans`, { params: { isoClauseId } }).then(r => r.data);
export const getActionPlan    = (id)          => axiosInstance.get(`${API}/plans/${id}`).then(r => r.data);
export const createActionPlan = (dto)         => axiosInstance.post(`${API}/plans`, dto).then(r => r.data);
export const updateActionPlan = (id, dto)     => axiosInstance.put(`${API}/plans/${id}`, dto).then(r => r.data);
export const deleteActionPlan = (id)          => axiosInstance.delete(`${API}/plans/${id}`).then(r => r.data);

// ── ACTION PLAN DOCUMENTS ─────────────────────────────────────────────────────
export const getActionPlanFiles = (planId) =>
  axiosInstance.get(`${API}/plans/${planId}/files`).then(r => r.data);

export const uploadActionPlanFile = (planId, file, description, onProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  if (description) fd.append('description', description);
  return axiosInstance.post(`${API}/plans/${planId}/files`, fd, {
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);
};

export const deleteActionPlanFile = (fileId) =>
  axiosInstance.delete(`${API}/plans/files/${fileId}`).then(r => r.data);

// ── TÉLÉCHARGEMENT ────────────────────────────────────────────────────────────
// On NE PAS utiliser un simple lien <a href> : la route est protégée par
// [Authorize] et le navigateur n'envoie pas le token JWT sur une navigation
// directe → 401 → "couldn't download".
//
// Cette fonction passe par axios (token ajouté automatiquement),
// récupère un Blob, crée une URL objet temporaire et déclenche le
// téléchargement proprement.
export const downloadFile = async (fileId, fileName) => {
  const response = await axiosInstance.get(
    `${API}/files/${fileId}/download`,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'fichier';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Ouvrir un fichier dans un nouvel onglet (pour les PDF, images, etc.)
export const openFile = async (fileId, fileName) => {
  const response = await axiosInstance.get(
    `${API}/files/${fileId}/download`,
    { responseType: 'blob' }
  );

  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  
  // Ouvrir dans un nouvel onglet
  const newTab = window.open();
  newTab.document.body.innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:none;" />`;
  // Optionnel : défaire après fermeture
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};