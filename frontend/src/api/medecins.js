import { apiGet, apiSend } from './http';

// GET /api/v1/medecins → [{ id, nom, prenom, localisation, tarif_consultation, note_moyenne }]
export function fetchMedecins({ localisation, limit } = {}) {
  return apiGet('/medecins', { localisation, limit });
}

// GET /api/v1/medecins/{id} → fiche détaillée (dont disponibilite)
export function fetchMedecin(id) {
  return apiGet(`/medecins/${id}`);
}

// PATCH /api/v1/medecins/me/disponibilite → { disponibilite: bool }
export function updateDisponibilite(disponibilite) {
  return apiSend('/medecins/me/disponibilite', 'PATCH', { disponibilite });
}
