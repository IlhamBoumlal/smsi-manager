// sensibilisation.js — utilise l'instance centrale (JWT Bearer via axiosInstance)
import axiosInstance from './axiosInstance';

const API = '/api/sensibilisation';

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
export const getDashboard = (societeId) =>
  axiosInstance
    .get(`${API}/dashboard`, { params: societeId ? { societeId } : undefined })
    .then(r => r.data);

// ── FORMATIONS ─────────────────────────────────────────────────────────────────
export const getFormations = (societeId) =>
  axiosInstance
    .get(API, { params: societeId ? { societeId } : undefined })
    .then(r => r.data);

export const getFormation = (id) =>
  axiosInstance.get(`${API}/${id}`).then(r => r.data);

// ── CREATE / UPDATE ────────────────────────────────────────────────────────────
/**
 * dto = {
 *   title, description, objectif,
 *   mode,           // "Présentiel" | "Distanciel" | "E-learning"
 *   date,           // "yyyy-MM-dd"
 *   heure,          // "HH:mm"
 *   duree,
 *   formateur,
 *   formateurType,  // "Interne" | "Externe"
 *   departement,
 *   role,
 *   lmsLink,
 *   notifInvit,     // bool — déclenche envoi email d'invitation via FluentEmail
 *   notifRappel,    // bool — active le rappel auto 48h avant
 *   participants,   // [{ fullName, email, department }]
 *   societeId,
 * }
 */
export const createFormation = (dto) =>
  axiosInstance.post(API, dto).then(r => r.data);

export const updateFormation = (id, dto) =>
  axiosInstance.put(`${API}/${id}`, { id, ...dto }).then(r => r.data);

// ── DELETE ─────────────────────────────────────────────────────────────────────
export const deleteFormation = (id) =>
  axiosInstance.delete(`${API}/${id}`).then(r => r.data);

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
// Envoie un email à tous les participants via FluentEmail + Gmail SMTP
// title : "Invitation envoyée" | "Rappel 48h avant" | texte libre
export const notifyParticipants = (id, title = 'Notification envoyée') =>
  axiosInstance.post(`${API}/${id}/notify`, { title }).then(r => r.data);

// ── PARTICIPANTS ───────────────────────────────────────────────────────────────
// status : "Invité" | "Présent"
export const updateParticipantStatus = (formationId, participantId, status) =>
  axiosInstance
    .put(`${API}/${formationId}/participants/${participantId}/status`, { status })
    .then(r => r.data);

// ── DOCUMENTS ──────────────────────────────────────────────────────────────────
export const uploadFormationDocument = (formationId, file, onProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance
    .post(`${API}/${formationId}/documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e =>
        onProgress?.(Math.round((e.loaded * 100) / e.total)),
    })
    .then(r => r.data);
};

export const deleteFormationDocument = (formationId, documentId) =>
  axiosInstance
    .delete(`${API}/${formationId}/documents/${documentId}`)
    .then(r => r.data);

// ── TÉLÉCHARGEMENT ─────────────────────────────────────────────────────────────
// La route est protégée [Authorize] → on passe par axios pour que le token JWT
// soit transmis, puis on crée un lien blob temporaire pour déclencher le download.
export const downloadFormationDocument = async (formationId, documentId, fileName) => {
  const response = await axiosInstance.get(
    `${API}/${formationId}/documents/${documentId}/download`,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  });

  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = fileName || 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
