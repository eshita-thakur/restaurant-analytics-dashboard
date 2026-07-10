import api from "./axios";

export const getCategories = () => api.get("/menu/categories");
export const createCategory = (data) => api.post("/menu/categories", data);

export const getItems = (categoryId) =>
  api.get("/menu/items", { params: categoryId ? { category_id: categoryId } : {} });
export const createItem = (data) => api.post("/menu/items", data);
export const updateItem = (id, data) => api.put(`/menu/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/menu/items/${id}`);