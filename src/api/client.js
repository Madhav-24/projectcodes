// Module: API Client
// Purpose: Centralized fetch wrapper — attaches JWT, parses responses, throws on errors.

// In development, Vite proxies /api/* → http://localhost:4000 so BASE_URL can be empty.
// In production, set VITE_API_URL to your deployed backend.
const BASE_URL = import.meta.env.VITE_API_URL || '';

function buildNetworkError() {
  const err = new Error(
    'Cannot connect to the backend. Make sure the server is running (npm run dev:backend).'
  );
  err.statusCode = 0;
  return err;
}

async function readJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function getToken() {
  return localStorage.getItem('auth_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw buildNetworkError();
  }

  const json = await readJsonSafe(res);
  if (!res.ok) {
    const err = new Error(json.message || 'Request failed');
    err.statusCode = res.status;
    throw err;
  }

  // All successful API responses have shape { success, message, data }
  return json.data;
}

// Multipart upload (no Content-Type header — browser sets boundary automatically)
export async function uploadForm(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw buildNetworkError();
  }

  const json = await readJsonSafe(res);
  if (!res.ok) {
    const err = new Error(json.message || 'Upload failed');
    err.statusCode = res.status;
    throw err;
  }

  return json.data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};
