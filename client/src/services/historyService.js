import request from './apiClient';

export async function getHistory() {
  return request('/history');
}
