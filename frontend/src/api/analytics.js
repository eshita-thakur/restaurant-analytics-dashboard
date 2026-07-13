import api from "./axios";

export const getRevenue = () => api.get("/analytics/revenue");
export const getItemPerformance = (limit) =>
  api.get("/analytics/item-performance", { params: limit ? { limit } : {} });
export const getInventoryTurnover = () => api.get("/analytics/inventory-turnover");
export const getSalesGrowth = () => api.get("/analytics/sales-growth");
export const getPeakHours = () => api.get("/analytics/peak-hours");
export const getCustomerRetention = () => api.get("/analytics/customer-retention");
export const getEmployeePerformance = () => api.get("/analytics/employee-performance");
export const getFoodWaste = () => api.get("/analytics/food-waste");