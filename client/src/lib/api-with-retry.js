/**
 * Fetch wrapper with exponential backoff retry logic
 * Retries on 429 (Too Many Requests) and network errors
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Success - return immediately
      if (response.ok || response.status === 429) {
        // Don't retry on 429 - let the client app handle the error
        return response;
      }
      
      return response; // Return non-429 errors immediately
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Request deduplication layer - prevents duplicate in-flight requests
 * Useful for preventing double API calls in React StrictMode or from accidental simultaneous calls
 */
const pendingRequests = new Map();

export async function fetchWithDedup(url, options = {}) {
  const key = url + JSON.stringify(options);
  
  // Return existing pending request if one exists
  if (pendingRequests.has(key)) {
    console.debug(`Returning cached request for ${url}`);
    return pendingRequests.get(key);
  }
  
  // Create new request
  const promise = fetchWithRetry(url, options);
  pendingRequests.set(key, promise);
  
  try {
    const response = await promise;
    return response;
  } finally {
    // Clean up after completion
    pendingRequests.delete(key);
  }
}
