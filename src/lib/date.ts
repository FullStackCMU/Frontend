const DAY = 24 * 60 * 60 * 1000;

// short ของภาษาไทยได้ชื่อวันเต็ม — narrow ได้ "อา"
const dateTimeFmt = new Intl.DateTimeFormat("th-TH", {
  weekday: "narrow",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date) {
  return dateTimeFmt.format(new Date(value));
}

export function formatRange(start: string | Date, end: string | Date) {
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(value: string | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

// เวลาไทย (UTC+7 ไม่มี DST) — ต้องตรงกับ Backend/src/routes/round.ts
const THAI_OFFSET = 7 * 60 * 60 * 1000;

export function endOfThaiDay(date: Date, addDays: number) {
  const local = new Date(date.getTime() + THAI_OFFSET);
  local.setUTCDate(local.getUTCDate() + addDays);
  local.setUTCHours(23, 59, 0, 0);
  return new Date(local.getTime() - THAI_OFFSET);
}

export function nextMorning(date: Date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}
