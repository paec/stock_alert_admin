import { get, post } from './api';

/**
 * Get current config from backend
 * @returns {Promise<Object>} - Config data with rules and long_term_drop
 */
export async function getConfig() {
  return get('/api/config');
}

/**
 * Save config to backend
 * @param {Object} config - Config object with rules and long_term_drop
 * @returns {Promise<Object>} - Response with status
 */
export async function saveConfig(config) {
  return post('/api/config', config);
}
