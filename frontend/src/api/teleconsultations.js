import { apiGet, apiSend } from './http';

// POST /api/v1/teleconsultations → ouvre une téléconsultation pour un RDV confirmé
export function createTeleconsultation(rendezVousId) {
  return apiSend('/teleconsultations', 'POST', { rendez_vous_id: rendezVousId });
}

// GET /api/v1/teleconsultations/{id}
export function fetchTeleconsultation(id) {
  return apiGet(`/teleconsultations/${id}`);
}

// PATCH /api/v1/teleconsultations/{id}/start → { statut, peer_id_cible }
export function startTeleconsultation(id) {
  return apiSend(`/teleconsultations/${id}/start`, 'PATCH');
}

// PATCH /api/v1/teleconsultations/{id}/end → clôture (TERMINEE)
export function endTeleconsultation(id, payload) {
  return apiSend(`/teleconsultations/${id}/end`, 'PATCH', payload || {});
}
