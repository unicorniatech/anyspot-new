import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
});

export const api = {
  // Auth
  exchangeSession: (session_id) =>
    http.post("/auth/session", { session_id }).then((r) => r.data),
  authMe: () => http.get("/auth/me").then((r) => r.data),
  logout: () => http.post("/auth/logout").then((r) => r.data),

  // Public
  listStudios: () => http.get("/studios").then((r) => r.data),
  getStudio: (id) => http.get(`/studios/${id}`).then((r) => r.data),
  getStudioClasses: (id) => http.get(`/studios/${id}/classes`).then((r) => r.data),
  listClasses: (params = {}) => http.get("/classes", { params }).then((r) => r.data),

  // Protected
  me: () => http.get("/me").then((r) => r.data),
  bookings: () => http.get("/bookings").then((r) => r.data),
  book: (class_id) => http.post("/bookings", { class_id }).then((r) => r.data),
  cancel: (booking_id) => http.post(`/bookings/${booking_id}/cancel`).then((r) => r.data),

  // Partner (protected)
  partnerOverview: () => http.get("/partner/overview").then((r) => r.data),
  partnerStudios: () => http.get("/partner/studios").then((r) => r.data),
  partnerClasses: (params = {}) =>
    http.get("/partner/classes", { params }).then((r) => r.data),
  partnerRoster: (class_id) =>
    http.get(`/partner/classes/${class_id}/roster`).then((r) => r.data),
  createClass: (data) => http.post("/partner/classes", data).then((r) => r.data),
  updateClass: (id, data) =>
    http.patch(`/partner/classes/${id}`, data).then((r) => r.data),
  deleteClass: (id) => http.delete(`/partner/classes/${id}`).then((r) => r.data),
};
