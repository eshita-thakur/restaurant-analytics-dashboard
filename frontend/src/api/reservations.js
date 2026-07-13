import api from "./axios";

export const getReservations = (date) =>
  api.get("/reservations", { params: date ? { date } : {} });
export const createReservation = (data) => api.post("/reservations", data);
export const updateReservationStatus = (id, status) =>
  api.put(`/reservations/${id}/status`, { status });