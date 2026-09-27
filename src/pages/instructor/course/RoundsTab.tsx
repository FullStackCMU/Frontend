import { useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { StatusPill } from "../../../components/ui/StatusPill";
import { api, getErrorMessage } from "../../../lib/api";
import { formatRange } from "../../../lib/date";
import { getRoundStatus } from "../../../lib/status";
import type { ApiResponse, CourseRound } from "../../../types";
import EditRoundModal from "./EditRoundModal";
import GenerateRoundsModal from "./GenerateRoundsModal";
import ReleaseControls from "../ReleaseControls";

type Pending = { round: CourseRound } | null; // ยืนยันการลบรอบ

function Progress({ submitted, total }: { submitted: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((submitted / total) * 100);
  return (
    <div className="flex w-full flex-col gap-1 sm:w-40">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          ส่งแล้ว {submitted}/{total}
        </span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={submitted}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="จำนวนที่ส่งแล้ว"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RoundCard({
  round,
  onEdit,
  onDelete,
  onUpdated,
}: {
  round: CourseRound;
  onEdit: () => void;
  onDelete: () => void;
  onUpdated: (rounds: CourseRound[]) => void;
}) {
  const status = getRoundStatus(round);
  const released = !!(round.scoresReleasedAt || round.feedbackReleasedAt);
  const canRelease = status === "closed" || status === "released";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-foreground">รอบที่ {round.sequenceNo}</h3>
            <StatusPill status={status} />
            <span className="text-[11px] text-muted-foreground">
              สเกล {round.scaleMin}–{round.scaleMax}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{formatRange(round.opensAt, round.closesAt)}</p>
        </div>

        <div className="flex items-center gap-3">
          <Progress submitted={round.submittedCount ?? 0} total={round.studentCount ?? 0} />
          <div className="flex items-center">
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
        </div>
      </div>

      {canRelease && (
        <div className="border-t border-border pt-4">
          <ReleaseControls round={round} onUpdated={onUpdated} />
        </div>
      )}
    </Card>
  );
}

/** แท็บรอบประเมินใน CourseDetail — ตั้งค่ารอบ แก้วัน ลบ และเผยแพร่ผล */
export default function RoundsTab({ courseId }: { courseId: string }) {
  const [rounds, setRounds] = useState<CourseRound[] | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<CourseRound | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  useEffect(() => {
    api
      .get<ApiResponse<CourseRound[]>>(`/rounds?courseId=${courseId}`)
      .then((res) => setRounds(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId]);

  // ทุก endpoint ที่แก้รอบคืนรายการรอบทั้งวิชา (เลขรอบอาจเลื่อนหลังลบ)
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

  if (error) return <Alert>{error}</Alert>;
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
              {rounds.length} รอบ · เผยแพร่คะแนนและฟีดแบ็กได้หลังรอบปิดรับ
            </p>
            <Button variant="secondary" onClick={() => setGenerating(true)}>
              <Plus size={15} />
              เพิ่มรอบ
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {rounds.map((r) => (
              <RoundCard
                key={r.id}
                round={r}
                onEdit={() => setEditing(r)}
                onDelete={() => setPending({ round: r })}
                onUpdated={applyRounds}
              />
            ))}
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
