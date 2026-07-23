import request from './apiClient';

export async function getSectors() {
  return request('/sectors');
}

export async function createSector(payload) {
  return request('/sectors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSector(id, payload) {
  const normalizedPayload = {
    ...payload,
    defaultConfiguration: payload.defaultConfiguration ?? false,
  };

  return request(`/sectors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(normalizedPayload),
  });
}
