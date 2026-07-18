import { apiGet, apiSend } from './http';

// GET /api/v1/paiements
export function fetchPaiements() {
  return apiGet('/paiements');
}

// POST /api/v1/paiements → { rendez_vous_id, montant, mode_paiement }
export function createPaiement(payload) {
  return apiSend('/paiements', 'POST', payload);
}
