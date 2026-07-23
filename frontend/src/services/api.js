import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach X-User-Id header and track request start time
apiClient.interceptors.request.use((config) => {
  const currentUserId = localStorage.getItem('active_user_id');
  if (currentUserId) {
    config.headers['X-User-Id'] = currentUserId;
  }
  config.metadata = { startTime: performance.now() };
  return config;
});

// Interceptor to calculate frontend roundtrip response time
apiClient.interceptors.response.use(
  (response) => {
    const roundtripMs = performance.now() - response.config.metadata.startTime;
    const backendMs = parseFloat(response.headers['x-response-time-ms'] || 0);
    response.latency = {
      roundtripMs: Math.round(roundtripMs),
      backendMs: backendMs,
    };
    return response;
  },
  (error) => {
    if (error.config && error.config.metadata) {
      const roundtripMs = performance.now() - error.config.metadata.startTime;
      error.latency = {
        roundtripMs: Math.round(roundtripMs),
        backendMs: 0,
      };
    }
    return Promise.reject(error);
  }
);
