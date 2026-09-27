import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EyeOff, LayoutDashboard, TriangleAlert } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Card } from "../../../components/ui/Card";
import { inputClass } from "../../../components/ui/field-styles";
import { StatusPill } from "../../../components/ui/StatusPill";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode, formatTerm } from "../../../lib/course";
import { formatDateTime, formatRange } from "../../../lib/date";
import { getRoundStatus, type SubmissionStatus } from "../../../lib/status";
import type { ApiResponse, Course, CourseRound, OverviewRow, RoundOverview } from "../../../types";
import ReleaseControls from "../ReleaseControls";
import StudentDetailModal from "./StudentDetailModal";

/**
 * self ต่างจาก peer "มาก" = ต่างกัน ≥ 37.5% ของช่วงสเกล (= 1.5 คะแนนบนสเกล 1–5)
 * คิดเป็นสัดส่วนเพราะแต่ละรอบตั้งสเกลต่างกันได้
 */
const GAP_RATIO = 0.375;
function isLargeGap(peer: number | null, self: number | null, min: number, max: number) {
  if (peer === null || self === null) return false;
  return Math.abs(self - peer) / (max - min) >= GAP_RATIO;
}

function submissionStatus(row: OverviewRow): SubmissionStatus {
  return row.submission?.status ?? "not_submitted";
}

/** รอบเริ่มต้น: รอบปัจจุบันของวิชา (รอบล่าสุดที่เปิดแล้ว) ถ้าไม่มีใช้รอบแรก */
function defaultRoundId(course: Course | undefined, rounds: CourseRound[]) {
  return course?.currentRound?.id ?? rounds[0]?.id ?? "";
}

export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [rounds, setRounds] = useState<CourseRound[] | null>(null);
  const [overview, setOverview] = useState<RoundOverview | null>(null);
  const [error, setError] = useState("");
  const [detailOf, setDetailOf] = useState<string | null>(null);

  const courseId = params.get("course") ?? courses?.[0]?.id ?? "";
  const course = courses?.find((c) => c.id === courseId);
  const roundId = params.get("round") ?? (rounds ? defaultRoundId(course, rounds) : "");
  const round = rounds?.find((r) => r.id === roundId);

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses")
      .then((res) => setCourses(res.data.data.filter((c) => c.role === "instructor")))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setRounds(null);
    api
      .get<ApiResponse<CourseRound[]>>(`/rounds?courseId=${courseId}`)
      .then((res) => setRounds(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId]);

  useEffect(() => {
    if (!roundId) return;
    setOverview(null);
    api
      .get<ApiResponse<RoundOverview>>(`/feedback/rounds/${roundId}/overview`)
      .then((res) => setOverview(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [roundId]);

  function selectCourse(id: string) {
    setParams({ course: id });
  }
  function selectRound(id: string) {
    setParams({ course: courseId, round: id });
  }

  // release แล้ว endpoint คืนรอบทั้งวิชา → อัปเดตทั้ง rounds และหัวของ overview
  function handleReleased(next: CourseRound[]) {
    setRounds(next);
    const updated = next.find((r) => r.id === roundId);
    if (updated && overview)
      setOverview({
        ...overview,
        round: { ...overview.round, scoresReleasedAt: updated.scoresReleasedAt, feedbackReleasedAt: updated.feedbackReleasedAt },
      });
  }

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
        <Alert>{error}</Alert>
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
  const scale = overview?.round;

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

      {round && status && (
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
              <ReleaseControls round={round} onUpdated={handleReleased} />
            ) : (
              <p className="text-xs text-muted-foreground">เผยแพร่ผลได้หลังปิดรับ ({formatDateTime(round.closesAt)})</p>
            )}
          </div>
        </Card>
      )}

      {roundId && !overview && rounds && rounds.length > 0 && (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" aria-busy="true" aria-label="กำลังโหลด" />
      )}

      {overview && scale && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-bold text-foreground">ตัวเลขใหญ่</span> = เฉลี่ยจากเพื่อน,{" "}
              <span className="font-bold text-foreground">ตัวเล็ก</span> = ให้ตัวเอง (สเกล {scale.scaleMin}–{scale.scaleMax})
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded border border-amber-300 bg-amber-100" /> ให้ตัวเองต่างจากเพื่อนมาก
            </span>
            {canRelease && (
              <span className="flex items-center gap-1">
                <EyeOff size={12} /> ผู้ประเมินไม่ถึง {overview.minPeers} คน — นักศึกษาไม่เห็นผลของตัวเอง
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-muted text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">นักศึกษา</th>
                  <th className="px-3 py-3 font-semibold">สถานะ</th>
                  {overview.questions.map((q) => (
                    <th key={q.id} className="px-3 py-3 text-center font-semibold" title={q.prompt}>
                      <span className="block">ข้อ {q.orderNo}</span>
                      <span className="mx-auto block max-w-[9rem] truncate font-normal">{q.prompt}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold">ผู้ประเมิน</th>
                </tr>
              </thead>
              {overview.groups.map((g) => {
                const submitted = g.rows.filter((r) => r.submission?.status === "submitted").length;
                return (
                  <tbody key={g.id ?? "none"}>
                    <tr className="border-b border-border bg-secondary/60">
                      <th colSpan={overview.questions.length + 3} scope="colgroup" className="px-4 py-2 text-xs font-semibold text-secondary-foreground">
                        {g.name}
                        <span className="ml-2 font-normal text-muted-foreground">
                          ส่งแล้ว {submitted}/{g.rows.length}
                        </span>
                      </th>
                    </tr>
                    {g.rows.map((row) => {
                      const below = canRelease && row.peerCount < overview.minPeers;
                      return (
                        <tr key={row.student.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/60">
                          <td className="px-4 py-2.5">
                            <button
                              type="button"
                              onClick={() => setDetailOf(row.student.id)}
                              className="text-left font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {row.student.name}
                            </button>
                            <span className="block font-mono text-[11px] text-muted-foreground">{row.student.studentId}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusPill status={submissionStatus(row)} />
                          </td>
                          {row.scores.map((s) => {
                            const gap = isLargeGap(s.peerAverage, s.selfScore, scale.scaleMin, scale.scaleMax);
                            return (
                              <td
                                key={s.questionId}
                                className={cn("px-3 py-2.5 text-center", gap && "bg-amber-50")}
                                title={gap ? "ให้คะแนนตัวเองต่างจากที่เพื่อนให้มาก" : undefined}
                              >
                                <span className="block font-mono text-base font-bold text-foreground">
                                  {s.peerAverage?.toFixed(1) ?? "—"}
                                </span>
                                <span className={cn("flex items-center justify-center gap-0.5 font-mono text-[11px]", gap ? "font-semibold text-amber-700" : "text-muted-foreground")}>
                                  {gap && <TriangleAlert size={10} />}
                                  ตัวเอง {s.selfScore ?? "—"}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-center">
                            <span className={cn("inline-flex items-center gap-1 font-mono", below ? "text-amber-700" : "text-foreground")}>
                              {below && <EyeOff size={12} aria-label="นักศึกษาไม่เห็นผล" />}
                              {row.peerCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
            </table>
          </div>
        </>
      )}

      {detailOf && roundId && <StudentDetailModal roundId={roundId} studentId={detailOf} onClose={() => setDetailOf(null)} />}
    </div>
  );
}
