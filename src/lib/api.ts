import axios from "axios";
import type { ApiResponse, ConsentStatus, EvalAnswer, Evaluation, Me } from "../types";

// session อยู่ใน httpOnly cookie (cr_token) ที่ backend ตั้งตอน /auth/callback
// เรียกผ่าน /api (same-origin ผ่าน vite proxy / nginx) browser จึงแนบ cookie ให้เอง
export const api = axios.create({
  baseURL: "/api",
});

/** ปุ่ม login ต้องเป็นการเปลี่ยนหน้าเต็ม (ไม่ใช่ XHR) เพราะ backend redirect ไปหน้า CMU */
export const LOGIN_URL = "/api/auth/login";

export const UNAUTHORIZED_EVENT = "cr-unauthorized";

// session หมดอายุระหว่างใช้งาน → ให้ App กลับไปหน้า login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  }
);

/** ผู้ใช้ที่ login อยู่ หรือ null ถ้ายังไม่ได้ login */
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

/**
 * บันทึกร่าง — ส่งคำตอบทั้งหมดที่มี (backend แทนที่ของเดิมทั้งชุด)
 * checkQuestionIds: ให้ AI ตรวจความเห็นของคำถามเหล่านี้ด้วย → ผลอยู่ใน warnings
 */
export async function saveEvaluationDraft(roundId: string, answers: EvalAnswer[], checkQuestionIds?: string[]) {
  const res = await api.put<ApiResponse<Evaluation>>(`/answers/${roundId}/draft`, { answers, checkQuestionIds });
  return res.data.data;
}

/**
 * ส่งแบบประเมิน — ต้องตอบครบ ส่งแล้วแก้ไม่ได้
 * AI เตือนความเห็นที่ไม่อยู่ใน acknowledged (answerKey ที่กด "ส่งตามนี้") → ยังไม่ส่ง คืน warnings มาแทน
 * (ดูได้จาก submission.status ยังไม่เป็น "submitted")
 */
export async function submitEvaluation(roundId: string, answers: EvalAnswer[], acknowledged: string[]) {
  const res = await api.post<ApiResponse<Evaluation>>(`/answers/${roundId}/submit`, { answers, acknowledged });
  return res.data.data;
}

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
