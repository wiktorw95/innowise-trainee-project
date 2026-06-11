import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        return Promise.reject(
          new Error(
            'Too many login attempts. Please try again in a few minutes.'
          )
        );
      }

      if (
        status === 401 &&
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/auth/signin')
      ) {
        window.location.href = '/auth/signin';
      }
      const backendMessage = error.response.data?.message;
      const finalMessage = Array.isArray(backendMessage)
        ? backendMessage[0]
        : backendMessage || 'An error occurred processing your request.';

      return Promise.reject(new Error(finalMessage));
    }

    else if (error.request) {
      return Promise.reject(
        new Error(
          'Cannot connect to the server. Please check your internet or try again later.'
        )
      );
    }

    else {
      return Promise.reject(new Error(error.message));
    }
  }
);
