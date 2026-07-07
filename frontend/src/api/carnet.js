import { apiGet } from './http';

// GET /api/v1/patients/{id}/carnet
// → { id, antecedents[], allergies[], groupeSanguin, maladiesChroniques[], dateDerniereMiseAJour }
export function fetchCarnet(patientId) {
  return apiGet(`/patients/${patientId}/carnet`);
}
