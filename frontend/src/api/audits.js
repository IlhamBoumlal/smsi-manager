import axiosInstance from './axiosInstance';

const BASE     = '/api/audits';
const BASE_NCS = `${BASE}/ncs`;
const BASE_SIM = `${BASE}/simulations`;

// ── Audits ────────────────────────────────────────────────────
export const getAllAudits  = ()          => axiosInstance.get(BASE).then(r => r.data);
export const getAuditById = (id)        => axiosInstance.get(`${BASE}/${id}`).then(r => r.data);

export const createAudit  = (body)      => axiosInstance.post(BASE, body).then(r => r.data);
// body = {
//   title, type, status, startDate, endDate?,
//   auditor, org, rssi?, approver?, scope?, objectives?,
//   author?, date?,
//   controlStatuses: { "5.1": "C", "8.3": "NC", ... },
//   controlComments: { "8.3": "commentaire...", ... }
// }

export const updateAudit  = (id, body)  => axiosInstance.put(`${BASE}/${id}`, body).then(r => r.data);
// body = même structure que createAudit

export const deleteAudit  = (id)        => axiosInstance.delete(`${BASE}/${id}`).then(r => r.data);

// ── Non-Conformités ───────────────────────────────────────────
export const getAllNCs  = ()          => axiosInstance.get(BASE_NCS).then(r => r.data);
export const getNCById = (id)        => axiosInstance.get(`${BASE_NCS}/${id}`).then(r => r.data);

export const createNC  = (body)      => axiosInstance.post(BASE_NCS, body).then(r => r.data);
// body = {
//   title, description?, controlId, actor?, correctiveAction?,
//   responsible?, deadline?, status, auditName?, auditId?,
//   correctiveActions: [{ description, responsible?, deadline?, status }]
// }

export const updateNC  = (id, body)  => axiosInstance.put(`${BASE_NCS}/${id}`, body).then(r => r.data);
// body = même structure que createNC

export const deleteNC  = (id)        => axiosInstance.delete(`${BASE_NCS}/${id}`).then(r => r.data);

// ── Simulations ───────────────────────────────────────────────
export const getAllSimulations = ()      => axiosInstance.get(BASE_SIM).then(r => r.data);

export const createSimulation  = (body) => axiosInstance.post(BASE_SIM, body).then(r => r.data);
// body = {
//   name, author?, date,
//   score, totalAnswered, oui, non,
//   answers:  { "5.1": "yes", "8.3": "no", ... },
//   comments: { "5.3": "commentaire...", ... }
// }

export const deleteSimulation  = (id)   => axiosInstance.delete(`${BASE_SIM}/${id}`).then(r => r.data);