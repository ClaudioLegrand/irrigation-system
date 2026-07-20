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
