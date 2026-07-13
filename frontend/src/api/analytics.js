import api from "./axios";

export const getRevenue = () => api.get("/analytics/revenue");
export const getItemPerformance = (limit) =>
  api.get("/analytics/item-performance", { params: limit ? { limit } : {} });
export const getInventoryTurnover = () => api.get("/analytics/inventory-turnover");