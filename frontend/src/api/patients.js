import { apiGet } from './http';

// GET /api/v1/patients → file des patients du médecin courant
export function fetchPatients() {
  return apiGet('/patients');
}
