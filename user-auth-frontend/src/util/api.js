import axios from "axios";

// Create a custom Axios instance with a predefined base URL
// This base URL comes from environment variables (e.g., VITE_API_BASE_URL)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Automatically attach JWT token (if available) to every request
// This allows authenticated access to protected backend endpoints
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
