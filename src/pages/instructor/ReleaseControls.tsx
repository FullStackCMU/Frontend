import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useReleaseRound } from "../../hooks/useRounds";
import { formatDateTime } from "../../lib/date";
import type { CourseRound } from "../../types";

type ReleaseKind = "scores" | "feedback";

const RELEASE_TEXT: Record<ReleaseKind, { label: string; released: string; effect: string }> = {
  scores: {
    label: "คะแนน",
    released: "เผยแพร่คะแนนแล้ว",
    effect: "นักศึกษาจะเห็นคะแนนเฉลี่ยรายข้อของตัวเอง",
  },
  feedback: {
    label: "ฟีดแบ็ก",
    released: "เผยแพร่ฟีดแบ็กแล้ว",
    effect: "นักศึกษาจะเห็นความเห็นจากเพื่อนร่วมกลุ่มแบบไม่ระบุชื่อ",
  },
};

// ใช้ได้เฉพาะรอบที่ปิดรับแล้ว — ผู้เรียกต้องเช็คก่อนแสดง
export default function ReleaseControls({ round }: { round: CourseRound }) {
  const [pending, setPending] = useState<{ what: ReleaseKind; release: boolean } | null>(null);
  const release = useReleaseRound(round);

  async function confirm() {
    if (!pending) return;
    await release.mutateAsync({ [pending.what]: pending.release });
    setPending(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["scores", "feedback"] as const).map((what) => {
        const at = what === "scores" ? round.scoresReleasedAt : round.feedbackReleasedAt;
        const text = RELEASE_TEXT[what];
        return at ? (
          <div
            key={what}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-1.5 pr-1.5 pl-3 text-xs text-emerald-700"
          >
            <Check size={13} className="shrink-0" />
            <span>
              <span className="font-semibold">{text.released}</span>
              <span className="text-emerald-600"> · {formatDateTime(at)}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setPending({ what, release: false })}>
              ยกเลิก
            </Button>
          </div>
        ) : (
          <Button key={what} variant="secondary" size="sm" onClick={() => setPending({ what, release: true })}>
            เผยแพร่{text.label}
          </Button>
        );
      })}

      {pending && (
        <ConfirmModal
          title={
            pending.release
              ? `เผยแพร่${RELEASE_TEXT[pending.what].label}รอบที่ ${round.sequenceNo}?`
              : `ยกเลิกการเผยแพร่${RELEASE_TEXT[pending.what].label}รอบที่ ${round.sequenceNo}?`
          }
          confirmLabel={pending.release ? "เผยแพร่" : "ยกเลิกการเผยแพร่"}
          danger={!pending.release}
          onConfirm={confirm}
          onClose={() => setPending(null)}
        >
          <p>
            {pending.release
              ? `${RELEASE_TEXT[pending.what].effect} (นักศึกษาที่มีผู้ประเมินไม่ถึง 2 คนจะไม่เห็นผลเพื่อรักษาความเป็นนิรนาม)`
              : `นักศึกษาจะมองไม่เห็น${RELEASE_TEXT[pending.what].label}ของรอบนี้จนกว่าจะเผยแพร่อีกครั้ง`}
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}
