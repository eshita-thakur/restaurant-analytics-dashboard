import api from "./axios";

export const getInventory = (lowStockOnly) =>
  api.get("/inventory", { params: lowStockOnly ? { low_stock: "true" } : {} });
export const createInventoryItem = (data) => api.post("/inventory", data);
export const updateInventoryItem = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`);
export const stockIn = (id, data) => api.post(`/inventory/${id}/stock-in`, data);
export const stockOut = (id, data) => api.post(`/inventory/${id}/stock-out`, data);
export const getTransactions = (id) => api.get(`/inventory/${id}/transactions`);