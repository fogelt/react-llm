import Axios, { InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

/**
 * Request Interceptor: Used to set necessary headers and credentials globally.
 */
function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  return config;
}

// Create the primary Axios instance
export const api = Axios.create({
  baseURL: env.PRIMARY_BACKEND_URL,
});


api.interceptors.request.use(authRequestInterceptor);

// Add the response interceptor (Handles global error messaging and 401 redirection)
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // --- Global Error Handling Logic ---
    const message = error.response?.data?.message || error.message;
    console.error("API Error:", message);
    return Promise.reject(error);
  },
);