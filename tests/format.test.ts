import { describe, expect, it } from "vitest";
import { currentTerm, formatCourseCode, formatTerm } from "../src/lib/course";
import { addDays, endOfThaiDay, fromLocalInput, toLocalInput } from "../src/lib/date";
import { loginErrorMessage } from "../src/lib/login-errors";
import { displayName, isStaff } from "../src/lib/user";
import type { Me } from "../src/types";

describe("วิชาและภาคเรียน", () => {
  it("ภาค 3 แสดงเป็นฤดูร้อน", () => {
    expect(formatTerm(1, 2569)).toBe("1/2569");
    expect(formatTerm(3, 2569)).toBe("ฤดูร้อน/2569");
  });

  it("รหัสวิชาต่อด้วยตอนเมื่อมีตอน", () => {
    expect(formatCourseCode("261497", "001")).toBe("261497 ตอน 001");
    expect(formatCourseCode("261497", null)).toBe("261497");
  });

  it("เดาภาคเรียนปัจจุบันตามปฏิทิน มช. ปีการศึกษาเริ่มเดือนมิถุนายน", () => {
    expect(currentTerm(new Date(2026, 5, 15))).toEqual({ semester: 1, academicYear: 2569 });
    expect(currentTerm(new Date(2026, 10, 15))).toEqual({ semester: 2, academicYear: 2569 });
    expect(currentTerm(new Date(2027, 0, 15))).toEqual({ semester: 2, academicYear: 2569 });
    expect(currentTerm(new Date(2027, 3, 15))).toEqual({ semester: 3, academicYear: 2569 });
  });
});

describe("วันที่", () => {
  it("สิ้นวันตามเวลาไทยคือ 23:59 ของวันนั้นในไทย ไม่ขึ้นกับเขตเวลาของเครื่อง", () => {
    // 20:00 UTC ของวันที่ 12 คือ 03:00 ของวันที่ 13 ในไทย
    const lateNight = new Date("2026-10-12T20:00:00Z");
    expect(endOfThaiDay(lateNight, 0).toISOString()).toBe("2026-10-13T16:59:00.000Z");
    expect(endOfThaiDay(lateNight, 7).toISOString()).toBe("2026-10-20T16:59:00.000Z");
  });

  it("บวกวันเป็นช่วง 24 ชั่วโมง", () => {
    expect(addDays(new Date("2026-10-12T05:00:00Z"), 2).toISOString()).toBe("2026-10-14T05:00:00.000Z");
  });

  it("ค่าช่องวันเวลาที่ว่างหรือไม่ใช่วันที่คืน null", () => {
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("ไม่ใช่วันที่")).toBeNull();
  });

  it("แปลงเป็นค่าช่องวันเวลาแล้วแปลงกลับได้เวลาเดิมระดับนาที", () => {
    const minute = new Date("2026-10-12T05:37:00Z");
    expect(fromLocalInput(toLocalInput(minute))?.getTime()).toBe(minute.getTime());
  });
});

describe("ผู้ใช้", () => {
  const me = { cmuAccount: "somchai_j@cmu.ac.th", firstnameTh: null, lastnameTh: null, firstnameEn: null, lastnameEn: null } as Me;

  it("ใช้ชื่อไทยก่อน ไม่มีจึงใช้ชื่ออังกฤษ ไม่มีทั้งคู่ใช้บัญชี CMU", () => {
    expect(displayName({ ...me, firstnameTh: "สมชาย", lastnameTh: "ใจดี", firstnameEn: "SOMCHAI" })).toBe("สมชาย ใจดี");
    expect(displayName({ ...me, firstnameEn: "SOMCHAI", lastnameEn: "JAIDEE" })).toBe("SOMCHAI JAIDEE");
    expect(displayName(me)).toBe("somchai_j@cmu.ac.th");
  });

  it("บุคลากรคือบัญชีประเภท MISEmpAcc เท่านั้น", () => {
    expect(isStaff({ ...me, accountType: "MISEmpAcc" })).toBe(true);
    expect(isStaff({ ...me, accountType: "StdAcc" })).toBe(false);
    expect(isStaff({ ...me, accountType: null })).toBe(false);
  });
});

describe("ข้อความเมื่อเข้าสู่ระบบไม่สำเร็จ", () => {
  it("ไม่มีรหัสข้อผิดพลาดไม่แสดงอะไร รหัสที่ไม่รู้จักใช้ข้อความกลาง", () => {
    expect(loginErrorMessage(null)).toBeNull();
    expect(loginErrorMessage("account_type_not_allowed")).toContain("บัญชีประเภทนี้ใช้งานระบบไม่ได้");
    expect(loginErrorMessage("something_new")).toBe("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  });
});
