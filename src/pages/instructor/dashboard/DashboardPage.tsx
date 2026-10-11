import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Card } from "../../../components/ui/Card";
import { inputClass } from "../../../components/ui/field-styles";
import { StatusPill } from "../../../components/ui/StatusPill";
import { useInstructorCourses } from "../../../hooks/useCourses";
import { useRoundOverview } from "../../../hooks/useRoundOverview";
import { useRounds } from "../../../hooks/useRounds";
import { getErrorMessage } from "../../../lib/api";
import { formatCourseCode, formatTerm } from "../../../lib/course";
import { formatDateTime, formatRange } from "../../../lib/date";
import { groupsByAttention } from "../../../lib/signals";
import { getRoundStatus } from "../../../lib/status";
import type { Course, CourseRound } from "../../../types";
import ReleaseControls from "../ReleaseControls";
import GroupCards from "./GroupCards";
import GroupView from "./GroupView";
import StudentDetailModal from "./StudentDetailModal";

function defaultRoundId(course: Course | undefined, rounds: CourseRound[]) {
  return course?.currentRound?.id ?? rounds[0]?.id ?? "";
}

// ไม่มี group ใน URL = ภาพรวมทุกกลุ่ม, มี = หน้ากลุ่มนั้น
export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const [detailOf, setDetailOf] = useState<string | null>(null);

  const coursesQuery = useInstructorCourses();
  const courses = coursesQuery.data;
  const courseId = params.get("course") ?? courses?.[0]?.id ?? "";
  const course = courses?.find((c) => c.id === courseId);

  const roundsQuery = useRounds(courseId);
  const rounds = roundsQuery.data;
  const roundId = params.get("round") ?? (rounds ? defaultRoundId(course, rounds) : "");
  const round = rounds?.find((r) => r.id === roundId);

  const overviewQuery = useRoundOverview(roundId);
  const overview = overviewQuery.data;

  // เทียบได้เฉพาะรอบก่อนหน้า — เปลี่ยนรอบแล้วค่าใน URL ใช้ไม่ได้ก็ถือว่าไม่เทียบ
  const earlierRounds = rounds?.filter((r) => round && r.sequenceNo < round.sequenceNo).reverse() ?? [];
  const compareRound = earlierRounds.find((r) => r.id === params.get("compare"));
  const compareQuery = useRoundOverview(compareRound?.id ?? "");
  const error = coursesQuery.error ?? roundsQuery.error ?? overviewQuery.error ?? compareQuery.error;

  const groupId = params.get("group");
  const groups = overview ? groupsByAttention(overview) : [];
  const group = groups.find((g) => g.id === groupId);

  // คงตัวเลือกอื่นใน URL ไว้ (กลุ่ม, มุมมองแผนภาพ, รอบที่เทียบ) — null = เอาออก
  const withParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    next.set("course", courseId);
    next.set("round", roundId);
    for (const [key, value] of Object.entries(changes))
      if (value === null) next.delete(key);
      else next.set(key, value);
    return `?${next}`;
  };

  function selectCourse(id: string) {
    setParams({ course: id });
  }
  // กลุ่มเป็นของวิชา เปลี่ยนรอบแล้วยังดูกลุ่มเดิมต่อได้
  function selectRound(id: string) {
    setParams(withParams({ round: id }));
  }

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
        <Alert>{getErrorMessage(error)}</Alert>
      </div>
    );

  if (courses?.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-32 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <LayoutDashboard size={28} className="text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground">ยังไม่มีคอร์ส</p>
        <Link to="/courses" className="text-sm font-medium text-primary hover:underline">
          ไปสร้างคอร์ส
        </Link>
      </div>
    );

  const status = round && getRoundStatus(round);
  const canRelease = status === "closed" || status === "released";

  return (
    <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">แดชบอร์ด</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:max-w-3xl">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">วิชา</span>
          <select value={courseId} onChange={(e) => selectCourse(e.target.value)} className={inputClass} disabled={!courses}>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {formatCourseCode(c.courseCode, c.section)} {c.title} ({formatTerm(c.semester, c.academicYear)})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">รอบ</span>
          <select
            value={roundId}
            onChange={(e) => selectRound(e.target.value)}
            className={inputClass}
            disabled={!rounds || rounds.length === 0}
          >
            {rounds?.length === 0 && <option value="">ยังไม่มีรอบ</option>}
            {rounds?.map((r) => (
              <option key={r.id} value={r.id}>
                รอบที่ {r.sequenceNo}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rounds?.length === 0 && (
        <Alert tone="warning">
          วิชานี้ยังไม่มีรอบประเมิน{" "}
          <Link to={`/courses/${courseId}/rounds`} className="font-semibold underline">
            ไปตั้งค่ารอบ
          </Link>
        </Alert>
      )}

      {round && status && !group && (
        <Card className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-foreground">รอบที่ {round.sequenceNo}</h2>
                <StatusPill status={status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatRange(round.opensAt, round.closesAt)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              ส่งแล้ว <span className="font-bold text-foreground">{round.submittedCount ?? 0}</span> / {round.studentCount ?? 0} คน
            </p>
          </div>
          <div className="border-t border-border pt-4">
            {canRelease ? (
              <ReleaseControls round={round} />
            ) : (
              <p className="text-xs text-muted-foreground">เผยแพร่ผลได้หลังปิดรับ ({formatDateTime(round.closesAt)})</p>
            )}
          </div>
        </Card>
      )}

      {roundId && !overview && rounds && rounds.length > 0 && (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" aria-busy="true" aria-label="กำลังโหลด" />
      )}

      {overview &&
        (group ? (
          <GroupView
            overview={overview}
            groups={groups}
            group={group}
            canRelease={canRelease}
            linkTo={(id) => withParams({ group: id ?? null })}
            mapMode={params.get("map") === "focus" ? "focus" : "self"}
            onMapModeChange={(mode) => setParams(withParams({ map: mode === "focus" ? mode : null }), { replace: true })}
            earlierRounds={earlierRounds}
            compareRound={compareRound}
            compare={compareQuery.data}
            onCompareChange={(id) => setParams(withParams({ compare: id }), { replace: true })}
            onOpenStudent={setDetailOf}
          />
        ) : (
          <GroupCards overview={overview} courseId={courseId} linkTo={(id) => withParams({ group: id })} />
        ))}

      {detailOf && roundId && <StudentDetailModal roundId={roundId} studentId={detailOf} onClose={() => setDetailOf(null)} />}
    </div>
  );
}
