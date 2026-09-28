import { useState, type FormEvent } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { inputClass } from "../../../components/ui/field-styles";
import { Modal } from "../../../components/ui/Modal";
import { api, getErrorMessage } from "../../../lib/api";
import { addDays, endOfThaiDay, formatRange, fromLocalInput, nextMorning, toLocalInput } from "../../../lib/date";
import type { ApiResponse, CourseRound } from "../../../types";

// ตรงกับ Backend/src/routes/round.ts (POST /rounds/generate)
const MAX_ROUNDS = 20;
const INTERVAL_WEEKS = [1, 2, 3, 4, 6, 8];
const SCALE_MINS = [0, 1];
const SCALE_MAXES = [3, 4, 5, 6, 7, 8, 9, 10];

export default function GenerateRoundsModal({
  courseId,
  lastRound,
  onClose,
  onSaved,
}: {
  courseId: string;
  lastRound: CourseRound | undefined;
  onClose: () => void;
  onSaved: (rounds: CourseRound[]) => void;
}) {
  const earliest = lastRound ? new Date(lastRound.closesAt) : new Date();
  const [count, setCount] = useState("4");
  const [firstOpensAt, setFirstOpensAt] = useState(toLocalInput(nextMorning(earliest)));
  const [intervalWeeks, setIntervalWeeks] = useState(2);
  const [openDays, setOpenDays] = useState("7");
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(5);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const n = Number(count);
  const days = Number(openDays);
  const first = fromLocalInput(firstOpensAt);
  const maxOpenDays = intervalWeeks * 7;

  const errors: { count?: string; openDays?: string; firstOpensAt?: string } = {};
  if (!Number.isInteger(n) || n < 1 || n > MAX_ROUNDS) errors.count = `1–${MAX_ROUNDS} รอบ`;
  if (!Number.isInteger(days) || days < 1 || days > maxOpenDays)
    errors.openDays = `1–${maxOpenDays} วัน (ไม่เกินระยะห่างระหว่างรอบ)`;
  if (!first) errors.firstOpensAt = "กรุณาเลือกวันและเวลา";
  else if (first < new Date()) errors.firstOpensAt = "ต้องเป็นเวลาในอนาคต";
  else if (lastRound && first < new Date(lastRound.closesAt))
    errors.firstOpensAt = `ต้องหลังรอบที่ ${lastRound.sequenceNo} ปิดรับ`;
  const valid = Object.keys(errors).length === 0;

  // ต้องคำนวณแบบเดียวกับ backend
  const startSeq = (lastRound?.sequenceNo ?? 0) + 1;
  const preview =
    valid && first
      ? Array.from({ length: n }, (_, k) => {
          const opens = addDays(first, k * intervalWeeks * 7);
          return { seq: startSeq + k, opens, closes: endOfThaiDay(opens, days - 1) };
        })
      : [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid || !first) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await api.post<ApiResponse<CourseRound[]>>("/rounds/generate", {
        courseId,
        count: n,
        firstOpensAt: first.toISOString(),
        openDays: days,
        intervalWeeks,
        scaleMin,
        scaleMax,
      });
      onSaved(res.data.data);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  const describe = (name: keyof typeof errors) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};

  return (
    <Modal
      title={lastRound ? "เพิ่มรอบประเมิน" : "ตั้งค่ารอบประเมิน"}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="rounds-form" disabled={!valid || submitting}>
            {submitting ? "กำลังสร้าง..." : `สร้าง ${valid ? n : ""} รอบ`}
          </Button>
        </>
      }
    >
      <form id="rounds-form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
        {serverError && <Alert>{serverError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="เปิดรอบแรก" htmlFor="firstOpensAt" error={errors.firstOpensAt}>
            <input
              id="firstOpensAt"
              type="datetime-local"
              data-autofocus
              value={firstOpensAt}
              onChange={(e) => setFirstOpensAt(e.target.value)}
              className={inputClass}
              {...describe("firstOpensAt")}
            />
          </Field>
          <Field label="จำนวนรอบ" htmlFor="count" error={errors.count}>
            <input
              id="count"
              type="number"
              min={1}
              max={MAX_ROUNDS}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={inputClass}
              {...describe("count")}
            />
          </Field>
          <Field label="ความถี่" htmlFor="intervalWeeks">
            <select
              id="intervalWeeks"
              value={intervalWeeks}
              onChange={(e) => setIntervalWeeks(Number(e.target.value))}
              className={inputClass}
            >
              {INTERVAL_WEEKS.map((w) => (
                <option key={w} value={w}>
                  {w === 1 ? "ทุกสัปดาห์" : `ทุก ${w} สัปดาห์`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="เปิดรับรอบละ (วัน)" htmlFor="openDays" hint="ปิดรับ 23:59 ของวันสุดท้าย" error={errors.openDays}>
            <input
              id="openDays"
              type="number"
              min={1}
              max={maxOpenDays}
              value={openDays}
              onChange={(e) => setOpenDays(e.target.value)}
              className={inputClass}
              aria-describedby={errors.openDays ? "openDays-error" : "openDays-hint"}
              aria-invalid={errors.openDays ? true : undefined}
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-foreground">สเกลคะแนน</legend>
          <div className="flex items-center gap-2">
            <div className="w-24">
            <select
              aria-label="คะแนนต่ำสุด"
              value={scaleMin}
              onChange={(e) => setScaleMin(Number(e.target.value))}
              className={inputClass}
            >
              {SCALE_MINS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            </div>
            <span className="text-muted-foreground">ถึง</span>
            <div className="w-24">
            <select
              aria-label="คะแนนสูงสุด"
              value={scaleMax}
              onChange={(e) => setScaleMax(Number(e.target.value))}
              className={inputClass}
            >
              {SCALE_MAXES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">ใช้กับคำถามแบบให้คะแนนในรอบที่สร้างครั้งนี้ แก้ภายหลังไม่ได้</p>
        </fieldset>

        {preview.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">ตารางรอบที่จะสร้าง</p>
            <ol className="max-h-56 overflow-y-auto rounded-xl border border-border text-sm">
              {preview.map((r) => (
                <li key={r.seq} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 border-b border-border px-4 py-2.5 last:border-b-0">
                  <span className="font-semibold text-foreground">รอบที่ {r.seq}</span>
                  <span className="text-xs text-muted-foreground">{formatRange(r.opens, r.closes)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </form>
    </Modal>
  );
}
