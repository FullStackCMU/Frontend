import { useState, type FormEvent } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { inputClass } from "../../../components/ui/field-styles";
import { Modal } from "../../../components/ui/Modal";
import { api, getErrorMessage } from "../../../lib/api";
import { fromLocalInput, toLocalInput } from "../../../lib/date";
import type { ApiResponse, CourseRound } from "../../../types";

export default function EditRoundModal({
  round,
  onClose,
  onSaved,
}: {
  round: CourseRound;
  onClose: () => void;
  onSaved: (rounds: CourseRound[]) => void;
}) {
  const alreadyOpen = new Date(round.opensAt) <= new Date();
  const [opensAt, setOpensAt] = useState(toLocalInput(round.opensAt));
  const [closesAt, setClosesAt] = useState(toLocalInput(round.closesAt));
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const opens = fromLocalInput(opensAt);
  const closes = fromLocalInput(closesAt);
  let error = "";
  if (!opens || !closes) error = "กรุณาเลือกวันและเวลาให้ครบ";
  else if (closes <= opens) error = "วันปิดรับต้องอยู่หลังวันเปิดรับ";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (error || !opens || !closes) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await api.patch<ApiResponse<CourseRound[]>>(`/rounds/${round.id}`, {
        ...(alreadyOpen ? {} : { opensAt: opens.toISOString() }),
        closesAt: closes.toISOString(),
      });
      onSaved(res.data.data);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`แก้ไขรอบที่ ${round.sequenceNo}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="round-edit-form" disabled={!!error || submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </>
      }
    >
      <form id="round-edit-form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
        {serverError && <Alert>{serverError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="เปิดรับ"
            htmlFor="round-opens"
            hint={alreadyOpen ? "รอบนี้เปิดแล้ว แก้วันเปิดไม่ได้" : undefined}
          >
            <input
              id="round-opens"
              type="datetime-local"
              value={opensAt}
              disabled={alreadyOpen}
              onChange={(e) => setOpensAt(e.target.value)}
              className={inputClass}
              data-autofocus={!alreadyOpen || undefined}
              aria-describedby={alreadyOpen ? "round-opens-hint" : undefined}
            />
          </Field>
          <Field label="ปิดรับ" htmlFor="round-closes" error={error || undefined}>
            <input
              id="round-closes"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className={inputClass}
              data-autofocus={alreadyOpen || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "round-closes-error" : undefined}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
