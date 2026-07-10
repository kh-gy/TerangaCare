import { apiGet, apiSend } from './http';

// GET /api/v1/patients/{id}/carnet
// → { id, antecedents[], allergies[], groupeSanguin, maladiesChroniques[], dateDerniereMiseAJour }
export function fetchCarnet(patientId) {
  return apiGet(`/patients/${patientId}/carnet`);
}

// GET /api/v1/patients/me/carnet → carnet du patient courant
export function fetchMyCarnet() {
  return apiGet('/patients/me/carnet');
}

// PUT /api/v1/patients/me/carnet → upsert carnet du patient courant
// payload : { antecedents[], allergies[], groupe_sanguin, maladies_chroniques[] }
export function updateMyCarnet(payload) {
  return apiSend('/patients/me/carnet', 'PUT', payload);
}
