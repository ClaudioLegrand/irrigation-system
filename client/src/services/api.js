const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export async function getSectors() {
  const response = await fetch(`${API_BASE_URL}/sectors`);
  if (!response.ok) throw new Error('No se pudieron cargar los sectores');
  return response.json();
}

export async function getConfigurations() {
  const response = await fetch(`${API_BASE_URL}/configurations`);
  if (!response.ok) throw new Error('No se pudieron cargar las configuraciones');
  return response.json();
}

export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/history`);
  if (!response.ok) throw new Error('No se pudo cargar el historial');
  return response.json();
}

export async function createSector(payload) {
  const response = await fetch(`${API_BASE_URL}/sectors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'No se pudo crear el sector');
  }

  return response.json();
}

export async function createConfiguration(payload) {
  const response = await fetch(`${API_BASE_URL}/configurations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'No se pudo guardar la configuración');
  }

  return response.json();
}

export async function updateSector(id, payload) {
  const normalizedPayload = {
    ...payload,
    defaultConfiguration: payload.defaultConfiguration ?? false,
  };

  const response = await fetch(`${API_BASE_URL}/sectors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
  });

  if (!response.ok) throw new Error('No se pudo actualizar el sector');
  return response.json();
}
