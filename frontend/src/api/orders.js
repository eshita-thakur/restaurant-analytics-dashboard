import api from "./axios";

export const getOrders = (status) =>
  api.get("/orders", { params: status ? { status } : {} });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post("/orders", data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });