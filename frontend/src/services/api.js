import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

export async function fetchDatabases() {
  const { data } = await api.get('/databases');
  return data;
}

export async function fetchBranches(params) {
  const { data } = await api.get('/branches', { params });
  return data;
}

export async function fetchSales(params) {
  const { data } = await api.get('/sales', { params });
  return data;
}

export async function sendToAutomate(database, rows) {
  const { data } = await api.post('/automate', { database, rows });
  return data;
}

export async function fetchAutomateQueue(params) {
  const { data } = await api.get('/automate-queue', { params });
  return data;
}

export async function updateAutomateQueueRow(id, payload) {
  const { data } = await api.put(`/automate-queue/${id}`, payload);
  return data;
}

export async function updateCenterCostBpFields(id, payload) {
  const { data } = await api.put(`/automate-queue/${id}/bp-fields`, payload);
  return data;
}

export async function fetchSettlementCandidates(params) {
  // Map to the appropriate endpoint. Let's assume /automate-queue?status=เสร็จแล้ว
  const { data } = await api.get('/automate-queue', { params: { status: 'เสร็จแล้ว', ...params } });
  return data;
}

export async function createSettlement(payload) {
  const { data } = await api.post('/settlements', payload);
  return data;
}

export async function fetchSettlements(params) {
  const { data } = await api.get('/settlements', { params });
  return data;
}

export async function fetchSettlementItems(id) {
  const { data } = await api.get(`/settlements/${id}/items`);
  return data;
}

export async function fetchReconcileBatches(params) {
  const { data } = await api.get('/reconcile-batches', { params });
  return data;
}

export async function fetchDebtBatchDetails(id) {
  const { data } = await api.get(`/reconcile-batches/${id}/details`);
  return data;
}

export default api;

