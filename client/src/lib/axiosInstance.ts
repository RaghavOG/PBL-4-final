import axios from 'axios';
import { store } from '@/redux/store';
import { logout } from '@/redux/authSlice';

const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`, // Update with your API URL
  withCredentials: true, // Include cookies in all requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Let the browser set the correct content-type with boundary
    delete config.headers['Content-Type'];
  }
  return config;
});


export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Track consecutive 401 errors
let consecutive401Errors = 0;
const MAX_401_ERRORS = 3;

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// Response interceptor for handling token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Reset counter on successful response
    consecutive401Errors = 0;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      consecutive401Errors++;

      if (consecutive401Errors >= MAX_401_ERRORS) {
        // Reset counter and dispatch logout
        consecutive401Errors = 0;
        // Trigger logout action from Redux store
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        // Send refresh token request
        const { data } = await axiosInstance.post('/auth/refresh-token', {}, { withCredentials: true });

        // Store the new tokens in your store or wherever
        setAuthToken(data.accessToken);

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // On refresh token failure, trigger logout
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
