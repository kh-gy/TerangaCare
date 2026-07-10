import { apiGet, apiSend } from './http';

// GET /api/v1/avis/medecin/{id}
export function fetchAvisMedecin(medecinId) {
  return apiGet(`/avis/medecin/${medecinId}`);
}

// POST /api/v1/avis → { medecin_id, note, commentaire }
export function createAvis(payload) {
  return apiSend('/avis', 'POST', payload);
}
