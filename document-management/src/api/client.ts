import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.detail) {
      return Promise.reject(new Error(error.response.data.detail));
    }
    return Promise.reject(error);
  }
);

export default apiClient;