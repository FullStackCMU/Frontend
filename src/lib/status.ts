import { Calendar, Check, Circle, CircleCheck, Clock, Lock, PencilLine, type LucideIcon } from "lucide-react";

// คำนวณจากวันที่ — DB ไม่มีคอลัมน์ status
export type RoundStatus = "upcoming" | "open" | "closed" | "released";

export type SubmissionStatus = "not_submitted" | "draft" | "submitted";

export type Status = RoundStatus | SubmissionStatus;

export type Tone = "neutral" | "info" | "warning" | "danger" | "success";

// สีอยู่ที่ไอคอนเท่านั้น ข้อความเป็นสีเทา
export const TONE_ICON: Record<Tone, string> = {
  neutral: "text-zinc-400",
  info: "text-primary",
  warning: "text-amber-500",
  danger: "text-red-600",
  success: "text-emerald-600",
};

export const STATUS: Record<Status, { label: string; tone: Tone; icon: LucideIcon }> = {
  upcoming: { label: "ยังไม่เปิด", tone: "neutral", icon: Calendar },
  open: { label: "เปิดรับ", tone: "info", icon: Clock },
  closed: { label: "ปิดรับแล้ว", tone: "warning", icon: Lock },
  released: { label: "เผยแพร่ผลแล้ว", tone: "success", icon: CircleCheck },

  not_submitted: { label: "ยังไม่ส่ง", tone: "neutral", icon: Circle },
  draft: { label: "ทำค้างไว้", tone: "warning", icon: PencilLine },
  submitted: { label: "ส่งแล้ว", tone: "success", icon: Check },
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

  // ตั้งเวลา release ไว้ในอนาคตยังนับว่า closed
  const released = [round.scoresReleasedAt, round.feedbackReleasedAt]
    .map(toTime)
    .some((r) => r !== null && r <= t);
  return released ? "released" : "closed";
}

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

export const STUDENT_LABEL: Partial<Record<Status, string>> = {
  closed: "ปิดแล้ว",
};
