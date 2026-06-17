/**
 * Base API utility functions
 */

/**
 * Perform a fetch request with error handling
 * @param {string} url - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Perform a GET request
 * @param {string} url - The API endpoint
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function get(url) {
  return request(url, {
    method: 'GET',
  });
}

/**
 * Perform a POST request
 * @param {string} url - The API endpoint
 * @param {Object} data - The request payload
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function post(url, data) {
  return request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
