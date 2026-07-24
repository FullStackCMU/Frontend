import axios from "axios";

const TOKEN_KEY = "cr_token";
const USER_KEY = "cr_user";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const UNAUTHORIZED_EVENT = "cr-unauthorized";

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  }
);

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set: (u: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
};

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const raw =
      err.response?.data?.message ?? err.response?.data?.msg ?? "";
    if (typeof raw === "string" && raw.includes("duplicate key"))
      return "คุณได้ประเมินเพื่อนคนนี้ไปแล้วในรอบนี้";
    if (raw) return raw;
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
  }
  return "เกิดข้อผิดพลาดที่ไม่รู้จัก";
}