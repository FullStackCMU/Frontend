/** สถานะรอบ — คำนวณจากวันที่เท่านั้น (ไม่มีคอลัมน์ status ใน DB) */
export type RoundStatus = "upcoming" | "open" | "closed" | "released";

/** สถานะการส่งแบบประเมินของนักศึกษา 1 คนใน 1 รอบ */
export type SubmissionStatus = "not_submitted" | "draft" | "submitted";

export type Status = RoundStatus | SubmissionStatus;

type Tone = "neutral" | "info" | "warning" | "success";

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-secondary text-secondary-foreground border-indigo-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-zinc-300",
  info: "bg-primary",
  warning: "bg-amber-400",
  success: "bg-emerald-500",
};

// mapping เดียวใช้ทั้งฝั่งอาจารย์และนักศึกษา
//   info    = กำลังดำเนินอยู่, warning = รอการกระทำ (รออาจารย์ release / ยังส่งไม่ครบ),
//   success = เสร็จแล้ว, neutral = ยังไม่เริ่ม
export const STATUS: Record<Status, { label: string; tone: Tone }> = {
  upcoming: { label: "ยังไม่เปิด", tone: "neutral" },
  open: { label: "เปิดรับ", tone: "info" },
  closed: { label: "ปิดรับแล้ว", tone: "warning" },
  released: { label: "เผยแพร่ผลแล้ว", tone: "success" },

  not_submitted: { label: "ยังไม่ส่ง", tone: "neutral" },
  draft: { label: "ทำค้างไว้", tone: "warning" },
  submitted: { label: "ส่งแล้ว", tone: "success" },
};

type DateLike = Date | string | null | undefined;

const toTime = (d: DateLike) => (d ? new Date(d).getTime() : null);

export function getRoundStatus(
  round: {
    opensAt: DateLike;
    closesAt: DateLike;
    scoresReleasedAt?: DateLike;
    feedbackReleasedAt?: DateLike;
  },
  now: Date = new Date()
): RoundStatus {
  const t = now.getTime();
  const opensAt = toTime(round.opensAt);
  const closesAt = toTime(round.closesAt);

  if (opensAt !== null && t < opensAt) return "upcoming";
  if (closesAt === null || t <= closesAt) return "open";

  // release ได้หลังปิดรับเท่านั้น — ถ้าตั้งเวลา release ไว้ในอนาคตยังนับว่า closed
  const released = [round.scoresReleasedAt, round.feedbackReleasedAt]
    .map(toTime)
    .some((r) => r !== null && r <= t);
  return released ? "released" : "closed";
}

/**
 * สถานะรอบในมุมนักศึกษา — ใช้ mapping เดียวกับข้างบน
 * released > ส่งแล้ว (submitted) > ทำค้าง (draft ระหว่างเปิดรับ) > สถานะตามวันที่
 */
export function getStudentRoundStatus(
  round: Parameters<typeof getRoundStatus>[0] & {
    mySubmission?: { status: "draft" | "submitted" } | null;
  },
  now: Date = new Date()
): Status {
  const status = getRoundStatus(round, now);
  if (status === "released") return "released";
  if (round.mySubmission?.status === "submitted") return "submitted";
  if (status === "open" && round.mySubmission?.status === "draft") return "draft";
  return status;
}

/** ข้อความสำหรับนักศึกษา (สีเดิม) — "เผยแพร่ผลแล้ว" → "ดูผลได้" */
export const STUDENT_LABEL: Partial<Record<Status, string>> = {
  closed: "ปิดแล้ว",
  released: "ดูผลได้",
};
