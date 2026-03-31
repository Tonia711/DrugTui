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

export const departmentApi = {
  getAll: (keyword) =>
    api.get("/Departments", { params: keyword ? { keyword } : {} }),
  create: (payload) => api.post("/Departments", payload),
};

export const supplierApi = {
  getAll: (keyword) =>
    api.get("/Suppliers", { params: keyword ? { keyword } : {} }),
  create: (payload) => api.post("/Suppliers", payload),
};

export const storageZoneApi = {
  getAll: (keyword) =>
    api.get("/StorageZones", { params: keyword ? { keyword } : {} }),
  create: (payload) => api.post("/StorageZones", payload),
};

export const storageShelfApi = {
  getAll: (storageZoneId) =>
    api.get("/StorageShelves", {
      params: storageZoneId ? { storageZoneId } : {},
    }),
  create: (payload) => api.post("/StorageShelves", payload),
};

export const purchaseOrderApi = {
  getAll: (keyword) =>
    api.get("/PurchaseOrders", { params: keyword ? { keyword } : {} }),
  getByOrderNumber: (orderNumber) =>
    api.get(`/PurchaseOrders/${encodeURIComponent(orderNumber)}`),
  create: (payload) => api.post("/PurchaseOrders", payload),
};

export const departmentRequestApi = {
  getAll: (keyword) =>
    api.get("/DepartmentRequests", { params: keyword ? { keyword } : {} }),
  create: (payload) => api.post("/DepartmentRequests", payload),
};

export default api;
