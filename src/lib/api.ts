import axios from "axios";
import type { ApiResponse, ConsentStatus, EvalAnswer, Evaluation, Me } from "../types";

// same-origin ผ่าน /api (vite proxy / nginx) browser จึงแนบ cookie ให้เอง
export const api = axios.create({
  baseURL: "/api",
});

// ต้องเปลี่ยนหน้าเต็ม ไม่ใช่ XHR เพราะ backend redirect ไป CMU
export const LOGIN_URL = "/api/auth/login";

export const UNAUTHORIZED_EVENT = "cr-unauthorized";

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  }
);

export async function fetchMe(): Promise<Me | null> {
  try {
    const res = await api.get<ApiResponse<Me>>("/auth/me");
    return res.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return null;
    throw err;
  }
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchConsent() {
  const res = await api.get<ApiResponse<ConsentStatus>>("/consents/me");
  return res.data.data;
}

export async function acceptConsent(policyVersion: string) {
  const res = await api.post<ApiResponse<ConsentStatus>>("/consents", {
    policyVersion,
  });
  return res.data.data;
}

export async function fetchEvaluation(roundId: string) {
  const res = await api.get<ApiResponse<Evaluation>>(`/answers/${roundId}`);
  return res.data.data;
}

export async function saveEvaluationDraft(roundId: string, answers: EvalAnswer[], checkQuestionIds?: string[]) {
  const res = await api.put<ApiResponse<Evaluation>>(`/answers/${roundId}/draft`, { answers, checkQuestionIds });
  return res.data.data;
}

// AI เตือนความเห็นที่ไม่อยู่ใน acknowledged → ยังไม่ส่ง (submission.status ไม่เป็น submitted)
export async function submitEvaluation(roundId: string, answers: EvalAnswer[], acknowledged: string[]) {
  const res = await api.post<ApiResponse<Evaluation>>(`/answers/${roundId}/submit`, { answers, acknowledged });
  return res.data.data;
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const raw =
      err.response?.data?.message ?? err.response?.data?.msg ?? "";
    if (raw) return raw;
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
  }
  return "เกิดข้อผิดพลาดที่ไม่รู้จัก";
}
