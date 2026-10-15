import { useState } from "react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useReleaseRound } from "../../hooks/useRounds";
import { cn } from "../../lib/cn";
import { formatDateTime } from "../../lib/date";
import type { CourseRound } from "../../types";

type ReleaseKind = "scores" | "feedback";

const RELEASE_TEXT: Record<ReleaseKind, { label: string; effect: string }> = {
  scores: {
    label: "คะแนน",
    effect: "นักศึกษาจะเห็นคะแนนเฉลี่ยรายข้อของตัวเอง",
  },
  feedback: {
    label: "ฟีดแบ็ก",
    effect: "นักศึกษาจะเห็นความเห็นจากเพื่อนร่วมกลุ่มแบบไม่ระบุชื่อ",
  },
};

// สวิตช์เปิด/ปิดการเผยแพร่ ถามยืนยันก่อนเปลี่ยนทุกครั้ง — enabled = รอบปิดรับแล้ว
export function ReleaseSwitch({ round, what, enabled }: { round: CourseRound; what: ReleaseKind; enabled: boolean }) {
  // ค่าที่กำลังจะเปลี่ยนไป (null = ไม่ได้ถาม)
  const [pending, setPending] = useState<boolean | null>(null);
  const release = useReleaseRound(round);
  const at = what === "scores" ? round.scoresReleasedAt : round.feedbackReleasedAt;
  const { label, effect } = RELEASE_TEXT[what];

  async function confirm() {
    if (pending === null) return;
    await release.mutateAsync({ [what]: pending });
    setPending(null);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={!!at}
        aria-label={`เผยแพร่${label}รอบที่ ${round.sequenceNo}`}
        disabled={!enabled}
        title={enabled ? undefined : "เผยแพร่ได้หลังรอบปิดรับ"}
        onClick={() => setPending(!at)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40",
          at ? "bg-primary" : "bg-zinc-300"
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow transition-transform",
            at ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {at ? formatDateTime(at) : enabled ? "ยังไม่เผยแพร่" : "หลังปิดรับ"}
      </span>

      {pending !== null && (
        <ConfirmModal
          title={`${pending ? "เผยแพร่" : "ยกเลิกการเผยแพร่"}${label}รอบที่ ${round.sequenceNo}?`}
          confirmLabel={pending ? "เผยแพร่" : "ยกเลิกการเผยแพร่"}
          danger={!pending}
          onConfirm={confirm}
          onClose={() => setPending(null)}
        >
          <p>
            {pending
              ? `${effect} (นักศึกษาที่มีผู้ประเมินไม่ถึง 2 คนจะไม่เห็นผลเพื่อรักษาความเป็นนิรนาม)`
              : `นักศึกษาจะมองไม่เห็น${label}ของรอบนี้จนกว่าจะเผยแพร่อีกครั้ง`}
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}
