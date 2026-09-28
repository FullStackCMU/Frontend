import type { Me } from "../types";

/** ชื่อที่แสดง — ใช้ชื่อไทยก่อน ถ้าไม่มีใช้ชื่ออังกฤษ ถ้าไม่มีทั้งคู่ใช้ CMU account */
export function displayName(me: Me) {
  const th = [me.firstnameTh, me.lastnameTh].filter(Boolean).join(" ");
  if (th) return th;
  const en = [me.firstnameEn, me.lastnameEn].filter(Boolean).join(" ");
  return en || me.cmuAccount;
}

/** บุคลากร (MISEmpAcc) ใช้หน้าอาจารย์ — ไม่มี role ระดับระบบ สิทธิ์ในวิชามาจาก enrollments */
export function isStaff(me: Me) {
  return me.accountType === "MISEmpAcc";
}
