import { apiGet, apiSend } from './http';

// GET /api/v1/orientations
export function fetchOrientations() {
  return apiGet('/orientations');
}

// POST /api/v1/orientations
export function createOrientation(payload) {
  return apiSend('/orientations', 'POST', payload);
}
