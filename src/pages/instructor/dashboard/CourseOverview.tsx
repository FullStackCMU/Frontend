import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Card } from "../../../components/ui/Card";
import { StatusLabel } from "../../../components/ui/StatusLabel";
import { useRoundOverview } from "../../../hooks/useRoundOverview";
import { useRounds } from "../../../hooks/useRounds";
import { getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatRange } from "../../../lib/date";
import { groupsByAttention, warningCount } from "../../../lib/signals";
import { getRoundStatus } from "../../../lib/status";
import type { Course, CourseRound } from "../../../types";
import ScoreTable from "./ScoreTable";
import SignalsPanel from "./SignalsPanel";
import StudentDetailModal from "./StudentDetailModal";
import TeamMap from "./TeamMap";

// เปิดมาที่รอบล่าสุดที่ปิดรับแล้ว (ข้อมูลครบ) — ยังไม่มีรอบไหนปิดจึงใช้รอบปัจจุบัน
function defaultRoundId(course: Course, rounds: CourseRound[]) {
  const now = new Date();
  const closed = rounds.filter((r) => new Date(r.closesAt) <= now);
  return closed.at(-1)?.id ?? course.currentRound?.id ?? rounds[0]?.id ?? "";
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xl leading-tight font-bold text-foreground">{value}</dd>
    </div>
  );
}

function GroupChip({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      replace
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </Link>
  );
}

// ผลของรอบอยู่หน้าเดียว — group ใน URL เป็นตัวกรอง ไม่ใช่อีกหน้า
// หน้านี้ดูอย่างเดียว: ตั้งรอบและเผยแพร่ผลทำที่หน้ารอบประเมิน
export default function CourseOverview({ course }: { course: Course }) {
  const [params, setParams] = useSearchParams();
  const [detailOf, setDetailOf] = useState<string | null>(null);

  const roundsQuery = useRounds(course.id);
  const rounds = roundsQuery.data;
  const roundId = params.get("round") ?? (rounds ? defaultRoundId(course, rounds) : "");
  const round = rounds?.find((r) => r.id === roundId);

  const overviewQuery = useRoundOverview(roundId);
  const overview = overviewQuery.data;

  // เทียบได้เฉพาะรอบก่อนหน้า — เปลี่ยนรอบแล้วค่าใน URL ใช้ไม่ได้ก็ถือว่าไม่เทียบ
  const earlierRounds = rounds?.filter((r) => round && r.sequenceNo < round.sequenceNo).reverse() ?? [];
  const compareRound = earlierRounds.find((r) => r.id === params.get("compare"));
  const compareQuery = useRoundOverview(compareRound?.id ?? "");
  const error = roundsQuery.error ?? overviewQuery.error ?? compareQuery.error;

  const groups = overview ? groupsByAttention(overview) : [];
  const group = groups.find((g) => g.id === params.get("group")) ?? null;

  // คงตัวเลือกอื่นใน URL ไว้ (กลุ่ม, มุมมองแผนภาพ, รอบที่เทียบ) — null = เอาออก
  const withParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    next.set("round", roundId);
    for (const [key, value] of Object.entries(changes))
      if (value === null) next.delete(key);
      else next.set(key, value);
    return `?${next}`;
  };

  if (error) return <Alert>{getErrorMessage(error)}</Alert>;

  if (rounds?.length === 0)
    return (
      <Alert tone="warning">
        วิชานี้ยังไม่มีรอบประเมิน{" "}
        <Link to={`/courses/${course.id}/rounds`} className="font-semibold underline">
          ไปตั้งค่ารอบ
        </Link>
      </Alert>
    );

  const status = round && getRoundStatus(round);
  const canRelease = status === "closed" || status === "released";

  return (
    <div className="flex flex-col gap-4">
      {round && status && (
        <Card className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* กลุ่มเป็นของวิชา เปลี่ยนรอบแล้วยังดูกลุ่มเดิมต่อได้ */}
              <select
                aria-label="รอบประเมิน"
                value={roundId}
                onChange={(e) => setParams(withParams({ round: e.target.value }))}
                className="rounded-lg border border-border bg-card py-1.5 pr-8 pl-3 text-sm font-bold text-foreground"
              >
                {rounds?.map((r) => (
                  <option key={r.id} value={r.id}>
                    รอบที่ {r.sequenceNo}
                  </option>
                ))}
              </select>
              <StatusLabel status={status} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatRange(round.opensAt, round.closesAt)}
              {status === "closed" && (
                <>
                  {" · "}
                  <Link to={`/courses/${course.id}/rounds`} className="font-medium text-primary hover:underline">
                    ยังไม่ได้เผยแพร่ผล
                  </Link>
                </>
              )}
            </p>
          </div>
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            <Stat label="ส่งแล้ว" value={`${round.submittedCount ?? 0}/${round.studentCount ?? 0}`} />
            <Stat label="คะแนนกลางจากเพื่อน" value={overview?.section.peerMedian?.toFixed(1) ?? "—"} />
          </dl>
        </Card>
      )}

      {!overview && (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" aria-busy="true" aria-label="กำลังโหลด" />
      )}

      {overview && (
        <>
          <nav aria-label="กรองตามกลุ่ม" className="flex flex-wrap items-center gap-2">
            <GroupChip to={withParams({ group: null })} active={!group}>
              ทั้งวิชา
            </GroupChip>
            {groups.map((g) => {
              const active = group?.id === g.id;
              return (
                <GroupChip key={g.id} to={withParams({ group: g.id })} active={active}>
                  {g.name}
                  {warningCount(g) > 0 && (
                    <span className="inline-flex items-center gap-0.5" title={`${warningCount(g)} สัญญาณ`}>
                      <TriangleAlert size={12} aria-hidden="true" className={active ? "text-white/80" : "text-amber-500"} />
                      {warningCount(g)}
                    </span>
                  )}
                </GroupChip>
              );
            })}
          </nav>

          <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <TeamMap
              overview={overview}
              group={group}
              mode={params.get("map") === "focus" ? "focus" : "self"}
              onModeChange={(mode) => setParams(withParams({ map: mode === "focus" ? mode : null }), { replace: true })}
              earlierRounds={earlierRounds}
              compareRound={compareRound}
              compare={compareQuery.data}
              onCompareChange={(id) => setParams(withParams({ compare: id }), { replace: true })}
              onOpenStudent={setDetailOf}
            />
            <SignalsPanel overview={overview} groups={groups} group={group} linkTo={(id) => withParams({ group: id })} />
          </div>

          <section aria-label="คะแนนรายคน">
            <h3 className="mb-2 text-sm font-bold text-foreground">คะแนนรายคน</h3>
            <ScoreTable
              overview={overview}
              groups={group ? [group] : [...groups, ...overview.groups.filter((g) => g.id === null)]}
              canRelease={canRelease}
              onOpenStudent={setDetailOf}
            />
          </section>
        </>
      )}

      {detailOf && roundId && <StudentDetailModal courseId={course.id} roundId={roundId} studentId={detailOf} onClose={() => setDetailOf(null)} />}
    </div>
  );
}
