import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API });

export const api = {
  listStudios: () => http.get("/studios").then((r) => r.data),
  getStudio: (id) => http.get(`/studios/${id}`).then((r) => r.data),
  getStudioClasses: (id) => http.get(`/studios/${id}/classes`).then((r) => r.data),
  listClasses: (params = {}) => http.get("/classes", { params }).then((r) => r.data),
  me: () => http.get("/me").then((r) => r.data),
  bookings: () => http.get("/bookings").then((r) => r.data),
  book: (class_id) => http.post("/bookings", { class_id }).then((r) => r.data),
  cancel: (booking_id) => http.post(`/bookings/${booking_id}/cancel`).then((r) => r.data),
};
