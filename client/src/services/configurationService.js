import request from './apiClient';

export async function getConfigurations() {
  return request('/configurations');
}

export async function createConfiguration(payload) {
  return request('/configurations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createConfigurationsInBatch(payloadList) {
  return request('/configurations/list', {
    method: 'POST',
    body: JSON.stringify(payloadList),
  });
}

export async function updateConfiguration(id, payload) {
  return request(`/configurations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteConfiguration(id) {
  return request(`/configurations/${id}`, {
    method: 'DELETE',
  });
}