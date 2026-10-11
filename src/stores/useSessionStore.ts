import { create } from "zustand";
import { fetchConsent, fetchMe, logout as requestLogout, onUnauthorized } from "../lib/api";
import { queryClient } from "../lib/query-client";
import { isStaff } from "../lib/user";
import type { ConsentStatus, Me } from "../types";

export type Session =
  | { status: "loading" }
  | { status: "error" }
  | { status: "anonymous" }
  // consent = null → ไม่ต้องขอ (บุคลากร — consent ครอบคลุมข้อความที่นักศึกษาเขียนเท่านั้น)
  | { status: "authenticated"; me: Me; consent: ConsentStatus | null };

interface SessionStore {
  session: Session;
  load: () => Promise<void>;
  setConsent: (consent: ConsentStatus) => void;
  logout: () => Promise<void>;
}

// ข้อมูลของผู้ใช้เดิมต้องไม่ค้างใน cache ให้คนถัดไปเห็น
function signedOut(): Pick<SessionStore, "session"> {
  queryClient.clear();
  return { session: { status: "anonymous" } };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: { status: "loading" },

  // cookie เป็น httpOnly อ่านจาก JS ไม่ได้ ต้องถาม backend
  load: async () => {
    try {
      const me = await fetchMe();
      if (!me) return set({ session: { status: "anonymous" } });
      const consent = isStaff(me) ? null : await fetchConsent();
      set({ session: { status: "authenticated", me, consent } });
    } catch {
      set({ session: { status: "error" } });
    }
  },

  setConsent: (consent) => {
    const session = get().session;
    if (session.status === "authenticated") set({ session: { ...session, consent } });
  },

  // oauth497 ยังจำ session — login ใหม่จะได้บัญชีเดิม (ไม่รองรับ end-session)
  logout: async () => {
    await requestLogout().catch(() => {});
    set(signedOut());
  },
}));

onUnauthorized(() => useSessionStore.setState(signedOut()));

export function useMe() {
  const session = useSessionStore((s) => s.session);
  if (session.status !== "authenticated") throw new Error("useMe ใช้ได้เฉพาะหน้าที่ login แล้ว");
  return session.me;
}
