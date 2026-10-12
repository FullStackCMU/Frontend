import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, Circle, Eye, EyeOff, MessageSquareText, Sparkles, TriangleAlert } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { inputClass } from "../../../components/ui/field-styles";
import { ToneLabel } from "../../../components/ui/StatusLabel";
import { useRoundOverview, useSaveStudentNote, useStudentFeedback } from "../../../hooks/useRoundOverview";
import { useRounds } from "../../../hooks/useRounds";
import { getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatDateTime } from "../../../lib/date";
import { describeSignal, groupSignals, isWarning } from "../../../lib/signals";
import type { Course, InstructorNote, OverviewRow, RoundOverview, Signal } from "../../../types";
import StudentComments from "../dashboard/StudentComments";

type ParamChanges = Record<string, string | null>;

function Scores({ row, overview }: { row: OverviewRow; overview: RoundOverview }) {
  const lines = [
    {
      label: "รวม",
      peer: row.overall.peerAverage?.toFixed(1),
      self: row.overall.selfAverage?.toFixed(1),
    },
    ...overview.questions.map((q) => {
      const s = row.scores.find((x) => x.questionId === q.id);
      return { label: q.prompt, peer: s?.peerAverage?.toFixed(1), self: s?.selfScore?.toString() };
    }),
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="pb-1.5 text-left font-normal">
            สเกล {overview.round.scaleMin}–{overview.round.scaleMax}
          </th>
          <th className="w-16 pb-1.5 text-right font-semibold text-foreground">เพื่อน</th>
          <th className="w-16 pb-1.5 text-right font-normal">ตัวเอง</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l, i) => (
          <tr key={l.label} className="border-t border-border">
            <th scope="row" className={cn("py-1.5 pr-3 text-left text-foreground", i === 0 ? "font-semibold" : "font-normal")}>
              {l.label}
            </th>
            <td className="py-1.5 text-right font-mono font-bold text-foreground">{l.peer ?? "—"}</td>
            <td className="py-1.5 text-right font-mono text-muted-foreground">{l.self ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// key ด้วยนักศึกษา — สถานะการบันทึกไม่ค้างข้ามคน ส่วนข้อความที่พิมพ์ค้างอยู่ที่หน้าเพื่อเตือนก่อนเปลี่ยนคนได้
function Editor({
  roundId,
  studentId,
  note,
  value,
  dirty,
  hasNext,
  onChange,
  onSaved,
  onNext,
}: {
  roundId: string;
  studentId: string;
  note: InstructorNote | null;
  value: string;
  dirty: boolean;
  hasNext: boolean;
  onChange: (value: string) => void;
  onSaved: (goNext: boolean) => void;
  onNext: () => void;
}) {
  const save = useSaveStudentNote(roundId, studentId);
  const submit = (goNext: boolean) => save.mutate(value, { onSuccess: () => onSaved(goNext) });

  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <MessageSquareText size={13} className="text-indigo-500" />
        <label htmlFor="instructor-note">ฟีดแบ็กจากอาจารย์</label>
      </h3>
      {save.error && <Alert>{getErrorMessage(save.error)}</Alert>}
      <textarea
        id="instructor-note"
        rows={5}
        maxLength={2000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="สิ่งที่ทำได้ดี และสิ่งที่อยากให้ลองปรับในรอบถัดไป"
        className={cn(inputClass, "resize-y leading-relaxed")}
        aria-describedby="instructor-note-hint"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id="instructor-note-hint" className="text-xs text-muted-foreground">
          {note ? `บันทึกล่าสุด ${formatDateTime(note.updatedAt)} โดย ${note.authorName}` : "ไม่บังคับ เว้นว่างได้"}
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={hasNext ? "outline" : "primary"} disabled={!dirty || save.isPending} onClick={() => submit(false)}>
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          {hasNext && (
            <Button size="sm" disabled={save.isPending} onClick={() => (dirty ? submit(true) : onNext())}>
              {dirty ? "บันทึกและไปคนถัดไป" : "คนถัดไป"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// งานเดียวของหน้านี้: เขียนฟีดแบ็กถึงนักศึกษารายคน — รายชื่อทางซ้าย ข้อมูลประกอบและช่องเขียนทางขวา
export default function FeedbackTab({ course }: { course: Course }) {
  const [params, setParams] = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ studentId: string; text: string } | null>(null);
  const [pending, setPending] = useState<ParamChanges | null>(null);

  const roundsQuery = useRounds(course.id);
  const now = new Date();
  // เขียนได้เฉพาะรอบที่ปิดรับแล้ว จึงให้เลือกเฉพาะรอบเหล่านั้น
  const closedRounds = roundsQuery.data?.filter((r) => new Date(r.closesAt) <= now) ?? [];
  const round = closedRounds.find((r) => r.id === params.get("round")) ?? closedRounds.at(-1);
  const roundId = round?.id ?? "";

  const overviewQuery = useRoundOverview(roundId);
  const overview = overviewQuery.data;
  const groups = overview?.groups ?? [];
  const rows = groups.flatMap((g) => g.rows);

  // จอแคบ: ยังไม่เลือกคน = แสดงรายชื่อ, เลือกแล้ว = แสดงเฉพาะหน้าเขียน
  const picked = rows.find((r) => r.student.id === params.get("student"));
  const selected = picked ?? rows[0];
  const studentId = selected?.student.id ?? "";
  const group = groups.find((g) => g.rows.some((r) => r.student.id === studentId));
  const nextId = rows[rows.findIndex((r) => r.student.id === studentId) + 1]?.student.id;

  const detailQuery = useStudentFeedback(roundId, studentId);
  const detail = detailQuery.data;
  const error = roundsQuery.error ?? overviewQuery.error ?? detailQuery.error;

  const savedNote = detail?.note?.body ?? "";
  const text = draft?.studentId === studentId ? draft.text : null;
  const dirty = text !== null && text.trim() !== savedNote;

  function go(changes: ParamChanges) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes))
      if (value === null) next.delete(key);
      else next.set(key, value);
    setParams(next, { replace: true });
    setDraft(null);
    setPending(null);
    if (changes.student) panelRef.current?.scrollIntoView({ block: "start" });
  }
  const tryGo = (changes: ParamChanges) => (dirty ? setPending(changes) : go(changes));

  const signalsOf = (id: string): Signal[] => {
    const g = groups.find((x) => x.rows.some((r) => r.student.id === id));
    return g ? groupSignals(g).filter((s) => s.studentId === id) : [];
  };

  if (error) return <Alert>{getErrorMessage(error)}</Alert>;
  if (!roundsQuery.data)
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" aria-busy="true" aria-label="กำลังโหลด" />;
  if (!round)
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <MessageSquareText size={24} className="text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">ยังไม่มีรอบที่ปิดรับ</p>
          <p className="mt-1 text-sm text-muted-foreground">เขียนฟีดแบ็กถึงนักศึกษาได้หลังรอบประเมินปิดรับ</p>
        </div>
      </div>
    );

  const released = !!round.feedbackReleasedAt && new Date(round.feedbackReleasedAt) <= now;
  const selectedSignals = signalsOf(studentId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <select
          aria-label="รอบประเมิน"
          value={round.id}
          onChange={(e) => tryGo({ round: e.target.value })}
          className="rounded-lg border border-border bg-card py-1.5 pr-8 pl-3 text-sm font-bold text-foreground"
        >
          {closedRounds.map((r) => (
            <option key={r.id} value={r.id}>
              รอบที่ {r.sequenceNo}
            </option>
          ))}
        </select>
        {overview && (
          <span className="text-sm text-muted-foreground">
            เขียนแล้ว <span className="font-bold text-foreground">{rows.filter((r) => r.hasNote).length}</span> จาก {rows.length} คน
          </span>
        )}
        <ToneLabel tone={released ? "success" : "neutral"} icon={released ? Eye : EyeOff}>
          {released ? "เผยแพร่ฟีดแบ็กแล้ว นักศึกษาเห็นทันทีที่บันทึก" : "ยังไม่เผยแพร่ฟีดแบ็ก นักศึกษายังไม่เห็น"}
        </ToneLabel>
        {/* ที่วางของ Phase 2 — ยังไม่มี endpoint */}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">เร็วๆ นี้</span>
          <Button size="sm" variant="secondary" disabled>
            <Sparkles size={13} />
            AI ร่างฟีดแบ็กทั้งหมด
          </Button>
        </span>
      </div>

      {!overview && (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" aria-busy="true" aria-label="กำลังโหลด" />
      )}
      {overview && rows.length === 0 && <p className="text-sm text-muted-foreground">วิชานี้ยังไม่มีนักศึกษา</p>}

      {overview && selected && (
        <div className="grid items-start gap-4 min-[900px]:grid-cols-[240px_minmax(0,1fr)]">
          <nav
            aria-label="นักศึกษา"
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card min-[900px]:sticky min-[900px]:top-6 min-[900px]:block min-[900px]:max-h-[calc(100vh-3rem)] min-[900px]:overflow-y-auto",
              picked && "hidden"
            )}
          >
            {groups.map((g) => (
              <div key={g.id ?? "none"} className="border-b border-border last:border-b-0">
                <p className="bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground">{g.name}</p>
                <ul>
                  {g.rows.map((r) => {
                    const active = r.student.id === studentId;
                    return (
                      <li key={r.student.id}>
                        <button
                          type="button"
                          onClick={() => tryGo({ student: r.student.id })}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors",
                            active
                              ? "min-[900px]:bg-secondary min-[900px]:font-semibold min-[900px]:text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {r.hasNote ? (
                            <Check size={14} className="shrink-0 text-emerald-600" aria-label="เขียนแล้ว" />
                          ) : (
                            <Circle size={14} className="shrink-0 text-zinc-300" aria-label="ยังไม่เขียน" />
                          )}
                          <span className="min-w-0 flex-1 truncate">{r.student.name}</span>
                          {signalsOf(r.student.id).some(isWarning) && (
                            <TriangleAlert size={13} className="shrink-0 text-amber-500" aria-label="มีสัญญาณที่ควรดู" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div
            ref={panelRef}
            className={cn(
              "scroll-mt-6 flex-col gap-5 rounded-2xl border border-border bg-card px-5 py-5 min-[900px]:flex",
              picked ? "flex" : "hidden"
            )}
          >
            <div>
              <button
                type="button"
                onClick={() => tryGo({ student: null })}
                className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground min-[900px]:hidden"
              >
                <ChevronLeft size={14} />
                รายชื่อนักศึกษา
              </button>
              <h3 className="text-base font-bold text-foreground">{selected.student.name}</h3>
              <p className="text-xs text-muted-foreground">
                {[selected.student.studentId, group?.name, `เพื่อนประเมิน ${selected.peerCount} คน`].filter(Boolean).join(" · ")}
              </p>
            </div>

            <Scores row={selected} overview={overview} />

            {selectedSignals.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-foreground">สัญญาณ</h3>
                <ul className="flex flex-col gap-1.5">
                  {selectedSignals.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                      <TriangleAlert
                        size={14}
                        aria-hidden="true"
                        className={cn("mt-0.5 shrink-0", isWarning(s) ? "text-amber-500" : "text-zinc-300")}
                      />
                      {describeSignal(s, overview.questions)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!detail ? (
              <div className="h-32 animate-pulse rounded-xl bg-muted" aria-busy="true" aria-label="กำลังโหลด" />
            ) : (
              <>
                {detail.evaluations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ยังไม่มีใครส่งแบบประเมินให้นักศึกษาคนนี้ในรอบนี้</p>
                ) : (
                  <StudentComments data={detail} />
                )}
                <Editor
                  key={studentId}
                  roundId={roundId}
                  studentId={studentId}
                  note={detail.note}
                  value={text ?? savedNote}
                  dirty={dirty}
                  hasNext={!!nextId}
                  onChange={(value) => setDraft({ studentId, text: value })}
                  onSaved={(goNext) => (goNext && nextId ? go({ student: nextId }) : setDraft(null))}
                  onNext={() => nextId && go({ student: nextId })}
                />
              </>
            )}
          </div>
        </div>
      )}

      {pending && (
        <ConfirmModal
          title="ยังไม่ได้บันทึกฟีดแบ็ก"
          confirmLabel="ไปต่อโดยไม่บันทึก"
          danger
          onConfirm={async () => go(pending)}
          onClose={() => setPending(null)}
        >
          <p>ข้อความที่พิมพ์ถึง {selected?.student.name} จะหายไป</p>
        </ConfirmModal>
      )}
    </div>
  );
}
