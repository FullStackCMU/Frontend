import { describe, expect, it } from "vitest";
import { getRoundStatus, getStudentRoundStatus } from "../src/lib/status";

const NOW = new Date("2026-10-12T12:00:00Z");
const at = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000).toISOString();

// สถานะรอบคำนวณจากวันที่ทุกครั้ง ไม่ได้เก็บในฐานข้อมูล
describe("getRoundStatus", () => {
  it("ก่อนเวลาเปิด = ยังไม่เปิด", () => {
    expect(getRoundStatus({ opensAt: at(1), closesAt: at(48) }, NOW)).toBe("upcoming");
  });

  it("ระหว่างเปิดถึงปิด รวมวินาทีที่ปิดพอดี = เปิดรับ", () => {
    expect(getRoundStatus({ opensAt: at(-1), closesAt: at(1) }, NOW)).toBe("open");
    expect(getRoundStatus({ opensAt: at(-1), closesAt: at(0) }, NOW)).toBe("open");
  });

  it("เลยเวลาปิดและยังไม่เผยแพร่ = ปิดรับแล้ว", () => {
    expect(getRoundStatus({ opensAt: at(-48), closesAt: at(-1) }, NOW)).toBe("closed");
  });

  it("เผยแพร่คะแนนหรือฟีดแบ็กอย่างใดอย่างหนึ่งแล้ว = เผยแพร่ผลแล้ว", () => {
    const round = { opensAt: at(-48), closesAt: at(-24) };
    expect(getRoundStatus({ ...round, scoresReleasedAt: at(-1) }, NOW)).toBe("released");
    expect(getRoundStatus({ ...round, feedbackReleasedAt: at(-1) }, NOW)).toBe("released");
  });

  it("ตั้งเวลาเผยแพร่ไว้ในอนาคตยังนับว่าปิดรับแล้ว", () => {
    expect(getRoundStatus({ opensAt: at(-48), closesAt: at(-24), scoresReleasedAt: at(1) }, NOW)).toBe("closed");
  });
});

describe("getStudentRoundStatus", () => {
  const open = { opensAt: at(-1), closesAt: at(1) };
  const closed = { opensAt: at(-48), closesAt: at(-1) };
  const submitted = { status: "submitted" as const };
  const draft = { status: "draft" as const };

  it("รอบเปิดและยังไม่เริ่มทำ = เปิดรับ", () => {
    expect(getStudentRoundStatus({ ...open, mySubmission: null }, NOW)).toBe("open");
  });

  it("แบบร่างนับเป็นทำค้างไว้เฉพาะตอนรอบยังเปิด", () => {
    expect(getStudentRoundStatus({ ...open, mySubmission: draft }, NOW)).toBe("draft");
    expect(getStudentRoundStatus({ ...closed, mySubmission: draft }, NOW)).toBe("closed");
  });

  it("ส่งแล้วแสดงว่าส่งแล้วทั้งตอนรอบเปิดและปิด", () => {
    expect(getStudentRoundStatus({ ...open, mySubmission: submitted }, NOW)).toBe("submitted");
    expect(getStudentRoundStatus({ ...closed, mySubmission: submitted }, NOW)).toBe("submitted");
  });

  it("เผยแพร่ผลแล้วมาก่อนสถานะการส่ง", () => {
    const released = { ...closed, scoresReleasedAt: at(-0.5) };
    expect(getStudentRoundStatus({ ...released, mySubmission: submitted }, NOW)).toBe("released");
    expect(getStudentRoundStatus({ ...released, mySubmission: null }, NOW)).toBe("released");
  });
});
