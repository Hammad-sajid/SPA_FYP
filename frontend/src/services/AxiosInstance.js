import axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api/";

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Ensure cookies are sent with every request
});

// Response interceptor to handle session expiration
axiosInstance.interceptors.response.use(
    (response) => {
        // Return successful responses as-is
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized responses (session expired)
        if (error.response && error.response.status === 401) {
            // Check if this is a Google service disconnect (expected 401)
            const url = error.config?.url || '';
            const isGoogleService = url.includes('/google-calendar/') || url.includes('/gmail/');
            
            if (isGoogleService) {
                // This is an expected 401 from Google service disconnect
                // Don't redirect to login, just log it
                console.log('Google service disconnected (expected 401):', url);
                return Promise.reject(error);
            }
            
            // Check if this is a session-related endpoint
            const isSessionEndpoint = url.includes('/auth/') || url.includes('/users/me');
            
            if (isSessionEndpoint) {
                console.log('Session expired, redirecting to login...');
                
                // Clear any existing user data from localStorage/Redux
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                
                // Clear session cookie
                document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                
                // Redirect to login page
                window.location.href = '/login';
                
                // Return a rejected promise to prevent the error from propagating
                return Promise.reject(new Error('Session expired'));
            }
            
            // For other 401s, let them propagate normally
            return Promise.reject(error);
        }
        
        // For other errors, let them propagate normally
        return Promise.reject(error);
    }
);

// Set up global axios interceptor for all axios requests
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized responses (session expired)
        if (error.response && error.response.status === 401) {
            // Check if this is a Google service disconnect (expected 401)
            const url = error.config?.url || '';
            const isGoogleService = url.includes('/google-calendar/') || url.includes('/gmail/');
            
            if (isGoogleService) {
                // This is an expected 401 from Google service disconnect
                // Don't redirect to login, just log it
                console.log('Global: Google service disconnected (expected 401):', url);
                return Promise.reject(error);
            }
            
            // Check if this is a session-related endpoint
            const isSessionEndpoint = url.includes('/auth/') || url.includes('/users/me');
            
            if (isSessionEndpoint) {
                console.log('Global: Session expired, redirecting to login...');
                
                // Clear any existing user data from localStorage/Redux
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                
                // Clear session cookie
                document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                
                // Redirect to login page
                window.location.href = '/login';
                
                // Return a rejected promise to prevent the error from propagating
                return Promise.reject(new Error('Session expired'));
            }
            
            // For other 401s, let them propagate normally
            return Promise.reject(error);
        }
        
        // For other errors, let them propagate normally
        return Promise.reject(error);
    }
);

export default axiosInstance;

