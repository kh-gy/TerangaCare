import { apiGet } from './http';

// GET /api/v1/medecins → [{ id, nom, prenom, localisation, tarif_consultation, note_moyenne }]
export function fetchMedecins({ localisation, limit } = {}) {
  return apiGet('/medecins', { localisation, limit });
}
