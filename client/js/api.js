// js/api.js
// ---------------------------------------------------------------------------
// THE FETCH LAYER. Every network call the app makes lives in this file.
// There is exactly one fetch() call, inside request() below — everything
// else is a small named function that maps 1:1 to one API endpoint.
// ---------------------------------------------------------------------------

import { BASE_URL, AUTH_HEADER } from './config.js';

/**
 * Custom error so callers can distinguish "server responded with an error"
 * from "the network/browser itself failed" and read the HTTP status.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * The one and only fetch() in the app.
 * @param {string} path - appended to BASE_URL, e.g. '/api/foods'
 * @param {{method?: string, body?: object}} options
 */
async function request(path, { method = 'GET', body = null } = {}) {
  const options = {
    method,
    headers: {
      Authorization: AUTH_HEADER,
      Accept: 'application/json',
    },
  };

  if (body !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(BASE_URL + path, options);
  } catch (networkError) {
    throw new ApiError(
      'Could not reach the API. Check that the server is running and BASE_URL in config.js is correct.',
      0
    );
  }

  // Some responses (e.g. 204) may not have a JSON body.
  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      data = {};
    }
  }

  if (!response.ok) {
    const message = data.message || data.error || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data;
}

// --- endpoint functions (each = exactly one endpoint) ----------------------

export function getWelcome() {
  return request('/');
}

export function getFoods() {
  return request('/api/foods');
}

export function getRandomFood() {
  return request('/api/foods/random');
}

export function getFood(id) {
  return request(`/api/foods/${encodeURIComponent(id)}`);
}

export function searchFoods(name) {
  return request(`/api/foods/search/${encodeURIComponent(name)}`);
}

export function getCategories() {
  return request('/api/categories');
}

export function getIngredients() {
  return request('/api/ingredients');
}

export function createFood(data) {
  return request('/api/foods', { method: 'POST', body: data });
}

export function updateFood(id, data) {
  return request(`/api/foods/${encodeURIComponent(id)}`, { method: 'PUT', body: data });
}

export function deleteFood(id) {
  return request(`/api/foods/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
