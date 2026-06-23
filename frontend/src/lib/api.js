import axios from "axios";
import { supabase } from "./supabase";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const DEMO_TOKEN_KEY = "anyspot:demo-token";

export const http = axios.create({
  baseURL: API,
  withCredentials: false,
});

export function getDemoToken() {
  return localStorage.getItem(DEMO_TOKEN_KEY);
}

export function setDemoToken(token) {
  if (token) {
    localStorage.setItem(DEMO_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(DEMO_TOKEN_KEY);
  }
}

http.interceptors.request.use(async (config) => {
  const demoToken = getDemoToken();
  if (demoToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${demoToken}`;
    return config;
  }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  authMe: () => http.get("/auth/me").then((r) => r.data),
  authUpdateRole: (role) => http.post("/auth/role", { role }).then((r) => r.data),
  demoLogin: (email, password) =>
    http.post("/auth/demo/login", { email, password }).then((r) => r.data),
  logout: () => http.post("/auth/logout").then((r) => r.data),
  registerStudio: (payload) => http.post("/studio/register", payload).then((r) => r.data),

  // Public
  listStudios: () => http.get("/studios").then((r) => r.data),
  getStudio: (id) => http.get(`/studios/${id}`).then((r) => r.data),
  getStudioClasses: (id) => http.get(`/studios/${id}/classes`).then((r) => r.data),
  listClasses: (params = {}) => http.get("/classes", { params }).then((r) => r.data),

  // Protected
  me: () => http.get("/me").then((r) => r.data),
  updateMe: (data) => http.patch("/me", data).then((r) => r.data),
  bookings: () => http.get("/bookings").then((r) => r.data),
  book: (class_id) => http.post("/bookings", { class_id }).then((r) => r.data),
  cancel: (booking_id) => http.post(`/bookings/${booking_id}/cancel`).then((r) => r.data),

  // Partner (protected)
  partnerOverview: () => http.get("/partner/overview").then((r) => r.data),
  partnerStudios: () => http.get("/partner/studios").then((r) => r.data),
  partnerStudio: () => http.get("/partner/studio").then((r) => r.data),
  partnerBootstrap: (data) => http.post("/partner/bootstrap", data).then((r) => r.data),
  partnerClasses: (params = {}) =>
    http.get("/partner/classes", { params }).then((r) => r.data),
  partnerRoster: (class_id) =>
    http.get(`/partner/classes/${class_id}/roster`).then((r) => r.data),
  partnerOnboardingStatus: () =>
    http.get("/partner/onboarding/status").then((r) => r.data),
  partnerOnboardingProfile: (data) =>
    http.post("/partner/onboarding/profile", data).then((r) => r.data),
  partnerOnboardingPayment: (data) =>
    http.post("/partner/onboarding/payment", data).then((r) => r.data),
  partnerOnboardingTeamInvite: (data) =>
    http.post("/partner/onboarding/team/invite", data).then((r) => r.data),
  createClass: (data) => http.post("/partner/classes", data).then((r) => r.data),
  updateClass: (id, data) =>
    http.patch(`/partner/classes/${id}`, data).then((r) => r.data),
  duplicateClass: (id, data) =>
    http.post(`/partner/classes/${id}/duplicate`, data).then((r) => r.data),
  deleteClass: (id) => http.delete(`/partner/classes/${id}`).then((r) => r.data),

  // Admin
  adminOverview: () => http.get("/admin/overview").then((r) => r.data),
  adminUsers: () => http.get("/admin/users").then((r) => r.data),
  adminStudios: () => http.get("/admin/studios").then((r) => r.data),
  adminBookings: () => http.get("/admin/bookings").then((r) => r.data),
  adminTransactions: () => http.get("/admin/transactions").then((r) => r.data),
};
