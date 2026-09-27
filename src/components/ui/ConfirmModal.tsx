import { useState, type ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { getErrorMessage } from "../../lib/api";

/** ยืนยันก่อนทำสิ่งที่มีผลกับคนอื่น/ย้อนกลับยาก — onConfirm error จะแสดงในกล่องเอง */
export function ConfirmModal({
  title,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          {/* งานอันตราย focus ที่ยกเลิก กันกด Enter พลาด */}
          <Button variant="outline" onClick={onClose} disabled={busy} data-autofocus={danger || undefined}>
            ยกเลิก
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={busy}
            data-autofocus={!danger || undefined}
          >
            {busy ? "กำลังดำเนินการ..." : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 px-6 py-6 text-sm leading-relaxed text-foreground">
        {error && <Alert>{error}</Alert>}
        {children}
      </div>
    </Modal>
  );
}
