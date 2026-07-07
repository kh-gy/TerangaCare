import { apiGet, apiSend } from './http';

// GET /api/v1/rendezvous/mes-rendez-vous → RDV EN_ATTENTE du médecin authentifié
export function fetchMesRendezVous() {
  return apiGet('/rendezvous/mes-rendez-vous');
}

// POST /api/v1/rendezvous → { medecin_id, date_heure, motif }
export function createRendezVous(payload) {
  return apiSend('/rendezvous', 'POST', payload);
}

// PATCH /api/v1/rendezvous/{id}/confirm → statut "CONFIRME"
export function confirmRendezVous(id) {
  return apiSend(`/rendezvous/${id}/confirm`, 'PATCH');
}
