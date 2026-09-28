import { useState, type FormEvent } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { inputClass } from "../../../components/ui/field-styles";
import { Modal } from "../../../components/ui/Modal";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import type { ApiResponse, Group } from "../../../types";

const MAX_GROUP_SIZE = 50;

export default function GroupFormModal({
  courseId,
  group,
  onClose,
  onSaved,
}: {
  courseId: string;
  group?: Group;
  onClose: () => void;
  onSaved: (group: Group) => void;
}) {
  const editing = !!group;
  const [name, setName] = useState(group?.name ?? "");
  const [maxMembers, setMaxMembers] = useState(group?.maxMembers?.toString() ?? "");
  const [contractText, setContractText] = useState(group?.contractText ?? "");
  const [errors, setErrors] = useState<{ name?: string; maxMembers?: string }>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const memberCount = group?.members.length ?? 0;
  const acceptedCount = group?.members.filter((m) => m.contractAcceptedAt).length ?? 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const max = maxMembers.trim() === "" ? null : Number(maxMembers);

    const found: typeof errors = {};
    if (!trimmedName) found.name = "กรุณากรอกชื่อกลุ่ม";
    if (max !== null && (!Number.isInteger(max) || max < 1 || max > MAX_GROUP_SIZE))
      found.maxMembers = `ใส่ 1–${MAX_GROUP_SIZE} หรือเว้นว่างถ้าไม่จำกัด`;
    else if (max !== null && max < memberCount)
      found.maxMembers = `กลุ่มนี้มีสมาชิก ${memberCount} คนแล้ว`;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      const res = editing
        ? await api.patch<ApiResponse<Group>>(`/groups/${group.id}`, {
            name: trimmedName,
            maxMembers: max,
            contractText,
          })
        : await api.post<ApiResponse<Group>>("/groups", { courseId, name: trimmedName, maxMembers: max });
      onSaved(res.data.data);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={editing ? `แก้ไข ${group.name}` : "สร้างกลุ่มใหม่"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="group-form" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : editing ? "บันทึก" : "สร้างกลุ่ม"}
          </Button>
        </>
      }
    >
      <form id="group-form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
        {serverError && <Alert>{serverError}</Alert>}

        <div className="grid grid-cols-[1fr_9rem] gap-3">
          <Field label="ชื่อกลุ่ม" htmlFor="group-name" error={errors.name}>
            <input
              id="group-name"
              data-autofocus
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Team Alpha"
              className={inputClass}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "group-name-error" : undefined}
            />
          </Field>
          <Field label="สมาชิกสูงสุด" htmlFor="group-max" hint="เว้นว่าง = ไม่จำกัด" error={errors.maxMembers}>
            <input
              id="group-max"
              inputMode="numeric"
              maxLength={2}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              placeholder="5"
              className={inputClass}
              aria-invalid={errors.maxMembers ? true : undefined}
              aria-describedby={errors.maxMembers ? "group-max-error" : "group-max-hint"}
            />
          </Field>
        </div>

        {editing && (
          <Field
            label="ข้อตกลงกลุ่ม (Contract)"
            htmlFor="group-contract"
            hint={
              memberCount > 0
                ? `ตอนนี้ยอมรับแล้ว ${acceptedCount} จาก ${memberCount} คน — ถ้าแก้ข้อความ สมาชิกทุกคนต้องกดยอมรับใหม่`
                : "สมาชิกจะเห็นและกดยอมรับข้อตกลงนี้เมื่อเข้ากลุ่ม"
            }
          >
            <textarea
              id="group-contract"
              rows={7}
              maxLength={5000}
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder={"1. เข้าประชุมทีมทุกสัปดาห์\n2. แจ้งล่วงหน้าหากส่งงานไม่ทัน\n3. รับฟังความเห็นของทุกคน"}
              className={cn(inputClass, "resize-y leading-relaxed")}
              aria-describedby="group-contract-hint"
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
