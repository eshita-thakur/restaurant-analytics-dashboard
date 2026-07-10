import api from "./axios";

export const getCustomers = (search) =>
  api.get("/customers", { params: search ? { search } : {} });
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);