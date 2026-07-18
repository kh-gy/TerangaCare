import { apiGet, apiSend } from './http';

// GET /api/v1/ordonnances → liste par rôle (médicaments/posologie en listes + noms)
export function fetchOrdonnances() {
  return apiGet('/ordonnances');
}

// POST /api/v1/ordonnances
// payload : { patientId, teleconsultationId, medicaments[], posologie[], dateExpiration }
export function createOrdonnance(payload) {
  return apiSend('/ordonnances', 'POST', payload);
}
