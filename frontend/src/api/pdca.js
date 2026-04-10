import axiosInstance from './axiosInstance';

export const getCycles   = ()     => axiosInstance.get('/api/pdca/cycles').then(r => r.data);
export const getCycle    = (id)   => axiosInstance.get(`/api/pdca/cycles/${id}`).then(r => r.data);
export const createCycle = (name) => axiosInstance.post('/api/pdca/cycles', { name }).then(r => r.data);

export const addSection    = (cmd)       => axiosInstance.post('/api/pdca/sections', { phaseId: cmd.phaseId, title: cmd.title }).then(r => r.data);
export const renameSection = (id, title) => axiosInstance.put(`/api/pdca/sections/${id}`, { title }).then(r => r.data);
export const deleteSection = (id)        => axiosInstance.delete(`/api/pdca/sections/${id}`).then(r => r.data);

export const addItem    = (cmd)          => axiosInstance.post('/api/pdca/items', { sectionId: cmd.sectionId, text: cmd.text }).then(r => r.data);
// On envoie TOUJOURS les deux champs pour éviter que le backend reçoive null
// et interprète ça comme "ne pas mettre à jour" ou "effacer la valeur".
export const updateItem = (id, status)   => axiosInstance.put(`/api/pdca/items/${id}`, { status, text: null }).then(r => r.data);
export const deleteItem = (id)           => axiosInstance.delete(`/api/pdca/items/${id}`).then(r => r.data);