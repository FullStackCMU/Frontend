import { useState } from "react";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { StatusLabel } from "../../../components/ui/StatusLabel";
import { useRounds, useSetRounds } from "../../../hooks/useRounds";
import { api, getErrorMessage } from "../../../lib/api";
import { formatRange } from "../../../lib/date";
import { getRoundStatus } from "../../../lib/status";
import type { ApiResponse, CourseRound } from "../../../types";
import EditRoundModal from "./EditRoundModal";
import GenerateRoundsModal from "./GenerateRoundsModal";
import { ReleaseSwitch } from "../ReleaseControls";

type Pending = { round: CourseRound } | null;

function RoundRow({
  round,
  onEdit,
  onDelete,
}: {
  round: CourseRound;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getRoundStatus(round);
  const released = !!(round.scoresReleasedAt || round.feedbackReleasedAt);
  const canRelease = status === "closed" || status === "released";
  const submitted = round.submittedCount ?? 0;
  const total = round.studentCount ?? 0;

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-bold text-foreground">รอบที่ {round.sequenceNo}</span>
          <StatusLabel status={status} />
        </div>
      </td>
      <td className="px-3 py-3.5 text-xs whitespace-nowrap text-foreground">{formatRange(round.opensAt, round.closesAt)}</td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-1.5 w-20 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={submitted}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="จำนวนที่ส่งแล้ว"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${total === 0 ? 0 : (submitted / total) * 100}%` }} />
          </div>
          <span className="font-mono text-xs whitespace-nowrap text-foreground">
            {submitted}/{total}
          </span>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <ReleaseSwitch round={round} what="scores" enabled={canRelease} />
      </td>
      <td className="px-3 py-3.5">
        <ReleaseSwitch round={round} what="feedback" enabled={canRelease} />
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onEdit}
            disabled={released}
            aria-label={`แก้ไขรอบที่ ${round.sequenceNo}`}
            title={released ? "ยกเลิกการเผยแพร่ก่อนจึงแก้วันได้" : "แก้ไขวันเปิด/ปิด"}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <Pencil size={14} />
          </button>
          {status === "upcoming" && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`ลบรอบที่ ${round.sequenceNo}`}
              title="ลบรอบ"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function RoundsTab({ courseId }: { courseId: string }) {
  const { data: rounds, error } = useRounds(courseId);
  const setRounds = useSetRounds(courseId);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<CourseRound | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  function applyRounds(next: CourseRound[]) {
    setRounds(next);
    setGenerating(false);
    setEditing(null);
    setPending(null);
  }

  async function runPending() {
    if (!pending) return;
    const res = await api.delete<ApiResponse<CourseRound[]>>(`/rounds/${pending.round.id}`);
    applyRounds(res.data.data);
  }

  if (error) return <Alert>{getErrorMessage(error)}</Alert>;
  if (!rounds)
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="กำลังโหลด">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );

  const lastRound = rounds.at(-1);

  return (
    <div className="flex flex-col gap-4">
      {rounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <CalendarClock size={24} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">ยังไม่มีรอบประเมิน</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ตั้งจำนวนรอบ วันเริ่ม และความถี่ ระบบจะสร้างทุกรอบให้
            </p>
          </div>
          <Button onClick={() => setGenerating(true)}>
            <Plus size={15} />
            ตั้งค่ารอบประเมิน
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {rounds.length} รอบ · เปิดสวิตช์เผยแพร่ได้หลังรอบปิดรับ
            </p>
            <Button variant="secondary" onClick={() => setGenerating(true)}>
              <Plus size={15} />
              เพิ่มรอบ
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">รอบ</th>
                  <th className="px-3 py-3 font-semibold">ช่วงเวลา</th>
                  <th className="px-3 py-3 font-semibold">ส่งแล้ว</th>
                  <th className="px-3 py-3 font-semibold">เผยแพร่คะแนน</th>
                  <th className="px-3 py-3 font-semibold">เผยแพร่ฟีดแบ็ก</th>
                  <th className="px-3 py-3" aria-label="จัดการ" />
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <RoundRow
                    key={r.id}
                    round={r}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setPending({ round: r })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {generating && (
        <GenerateRoundsModal
          courseId={courseId}
          lastRound={lastRound}
          onClose={() => setGenerating(false)}
          onSaved={applyRounds}
        />
      )}

      {editing && <EditRoundModal round={editing} onClose={() => setEditing(null)} onSaved={applyRounds} />}

      {pending && (
        <ConfirmModal
          title={`ลบรอบที่ ${pending.round.sequenceNo}?`}
          confirmLabel="ลบรอบ"
          danger
          onConfirm={runPending}
          onClose={() => setPending(null)}
        >
          <p>รอบที่ตามหลังจะถูกเลื่อนเลขขึ้นมาแทน</p>
        </ConfirmModal>
      )}
    </div>
  );
}
