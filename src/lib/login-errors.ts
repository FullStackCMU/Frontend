// ต้องตรงกับ code ใน Backend/src/routes/auth.ts (/callback)
const LOGIN_ERRORS: Record<string, string> = {
  oauth_error: "การเข้าสู่ระบบถูกยกเลิกหรือไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  missing_code: "การเข้าสู่ระบบไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง",
  invalid_state: "การเข้าสู่ระบบหมดเวลาหรือไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
  token_exchange_failed: "ติดต่อระบบบัญชี CMU ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  userinfo_failed: "ดึงข้อมูลบัญชี CMU ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  missing_account: "ไม่พบข้อมูลบัญชี CMU ของคุณ กรุณาติดต่อผู้ดูแลระบบ",
  account_type_not_allowed:
    "บัญชีประเภทนี้ใช้งานระบบไม่ได้ (ใช้ได้เฉพาะนักศึกษาและบุคลากร มช.)",
  server_error: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง",
};

export function loginErrorMessage(code: string | null) {
  if (!code) return null;
  return LOGIN_ERRORS[code] ?? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}
