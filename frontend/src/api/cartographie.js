import axiosInstance from './axiosInstance';

const BASE = '/api/cartographie/processus';

// ── Processus ──────────────────────────────────────────────────
export const getAllProcessus  = ()          => axiosInstance.get(BASE).then(r => r.data);
export const getProcessusById = (id)        => axiosInstance.get(`${BASE}/${id}`).then(r => r.data);

export const createProcessus  = (body)      => axiosInstance.post(BASE, body).then(r => r.data);
// body = { categorie, nom, responsable, description }

export const updateProcessus  = (id, body)  => axiosInstance.put(`${BASE}/${id}`, body).then(r => r.data);
// body = { categorie, nom, responsable, description }

export const deleteProcessus  = (id)        => axiosInstance.delete(`${BASE}/${id}`).then(r => r.data);

export const deleteDocument = (processusId, documentId) =>
  axiosInstance.delete(`${BASE}/${processusId}/documents/${documentId}`).then(r => r.data);
export const addDocument = (processusId, body, fichier) => {
  const form = new FormData();
  form.append("nom",       body.nom);
  form.append("type",      body.type);
  form.append("reference", body.reference);
  form.append("statut",    body.statut);
  if (fichier) form.append("fichier", fichier);   // File object natif du navigateur

  return axiosInstance.post(
    `/api/cartographie/processus/${processusId}/documents`,
    form
    // pas besoin de spécifier Content-Type, axios le fait automatiquement pour FormData
  ).then(r => r.data);
};

// Télécharger le fichier d'un document
export const downloadFichier = (documentId) =>
  axiosInstance.get(`/api/cartographie/documents/${documentId}/fichier`, {
    responseType: "blob"
  }).then(r => {
    const url  = URL.createObjectURL(r.data);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = r.headers["content-disposition"]
                   ?.split("filename=")[1]?.replace(/"/g, "") ?? "document";
    a.click();
    URL.revokeObjectURL(url);
  });
