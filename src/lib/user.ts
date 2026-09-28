import type { Me } from "../types";

// ต้องตรงกับ displayName ใน Backend/src/lib/course-members.ts
export function displayName(me: Me) {
  const th = [me.firstnameTh, me.lastnameTh].filter(Boolean).join(" ");
  if (th) return th;
  const en = [me.firstnameEn, me.lastnameEn].filter(Boolean).join(" ");
  return en || me.cmuAccount;
}

export function isStaff(me: Me) {
  return me.accountType === "MISEmpAcc";
}
