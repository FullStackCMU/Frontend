import { Link, useParams } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { Breadcrumb } from "../../../components/ui/Breadcrumb";
import { buttonClass } from "../../../components/ui/button-variants";
import { Card } from "../../../components/ui/Card";
import { StatusLabel } from "../../../components/ui/StatusLabel";
import { useAvailableGroups, useMyGroup } from "../../../hooks/useCourseMembers";
import { useCourse, useCourseChanged } from "../../../hooks/useCourses";
import { useRounds } from "../../../hooks/useRounds";
import { getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode, formatTerm } from "../../../lib/course";
import { formatRange } from "../../../lib/date";
import { getRoundStatus, getStudentRoundStatus, STUDENT_LABEL } from "../../../lib/status";
import { useMe } from "../../../stores/useSessionStore";
import type { CourseRound } from "../../../types";
import { ContractCard, TeammatesCard, TeamPicker } from "./TeamSetup";

// กำหนดการอย่างเดียว — การ์ดทำแบบประเมินอยู่ที่เมนูแบบประเมิน ผลอยู่ที่เมนูฟีดแบ็ก ที่นี่มีแค่ปุ่มเล็กไปหา
function RoundRow({ round }: { round: CourseRound }) {
  const status = getStudentRoundStatus(round);
  const link =
    status === "open" || status === "draft"
      ? {
          to: `/courses/${round.courseId}/rounds/${round.id}`,
          label: status === "draft" ? "ทำต่อ" : "ทำแบบประเมิน",
          variant: "primary" as const,
        }
      : status === "released"
        ? { to: `/feedback/${round.id}`, label: "ดูผล", variant: "secondary" as const }
        : null;

  return (
    <li className={cn("flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3", status === "upcoming" && "opacity-60")}>
      <span className="text-sm font-semibold whitespace-nowrap text-foreground">รอบที่ {round.sequenceNo}</span>
      <span className="text-xs text-muted-foreground">{formatRange(round.opensAt, round.closesAt)}</span>
      <StatusLabel status={status} label={STUDENT_LABEL[status]} />
      {link && (
        <Link to={link.to} className={cn(buttonClass({ variant: link.variant, size: "sm" }), "ml-auto whitespace-nowrap")}>
          {link.label}
        </Link>
      )}
    </li>
  );
}

// หน้าวิชาของนักศึกษา = ทีมของฉัน + กำหนดการรอบ
export default function StudentCourseDetail() {
  const me = useMe();
  const { courseId = "" } = useParams();
  const courseQuery = useCourse(courseId);
  const roundsQuery = useRounds(courseId);
  const groupQuery = useMyGroup(courseId);
  // กลุ่มที่เข้าได้โหลดเฉพาะเมื่อยังไม่มีกลุ่ม
  const availableQuery = useAvailableGroups(courseId, groupQuery.data === null);
  const reload = useCourseChanged(courseId);

  const course = courseQuery.data;
  const rounds = roundsQuery.data;
  const group = groupQuery.data;
  const available = availableQuery.data;
  const error = courseQuery.error ?? roundsQuery.error ?? groupQuery.error ?? availableQuery.error;

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
        <Alert>{getErrorMessage(error)}</Alert>
      </div>
    );
  if (!course || !rounds || group === undefined || (group === null && !available))
    return (
      <div className="flex flex-col gap-4 px-4 py-6 min-[900px]:px-10 min-[900px]:py-8" aria-busy="true" aria-label="กำลังโหลด">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    );

  const contractPending = !!group?.contractText && !group.members.find((m) => m.id === me.id)?.contractAcceptedAt;

  // backend ห้ามเปลี่ยนกลุ่มถ้าเริ่มทำแบบประเมินรอบที่เปิดอยู่ — แสดงเหตุผลล่วงหน้า
  const now = new Date();
  const lockingRound = rounds.find((r) => getRoundStatus(r, now) === "open" && r.mySubmission);
  const lockedReason = lockingRound
    ? `เปลี่ยนกลุ่มได้หลังรอบที่ ${lockingRound.sequenceNo} ปิดรับ (คุณเริ่มทำแบบประเมินแล้ว)`
    : null;

  return (
    <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <Breadcrumb segments={[{ label: "วิชาของฉัน", to: "/courses" }, { label: course.courseCode }]} />

      <div className="mb-7">
        <p className="mb-0.5 text-xs font-semibold text-indigo-600">
          {formatCourseCode(course.courseCode, course.section)} · {formatTerm(course.semester, course.academicYear)}
        </p>
        <h1 className="mb-1 text-2xl leading-snug font-bold text-foreground">{course.title}</h1>
        <p className="text-sm text-muted-foreground">
          {course.instructors.join(", ")}
          {group && ` · ${group.name}`}
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-8 min-[1200px]:flex-row min-[1200px]:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5 min-[1200px]:max-w-[760px] min-[1200px]:min-w-[480px]">
          {!group && <TeamPicker groups={available ?? []} onJoined={reload} />}
          {group && contractPending && <ContractCard group={group} onAccepted={reload} />}

          <section aria-label="กำหนดการรอบประเมิน">
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">กำหนดการรอบประเมิน</h2>
              <span className="text-xs font-semibold text-muted-foreground">{rounds.length}</span>
            </div>
            {rounds.length === 0 ? (
              <p className="text-sm text-muted-foreground">อาจารย์ยังไม่ได้ตั้งรอบประเมิน</p>
            ) : (
              <Card padding="none">
                <ul className="divide-y divide-border">
                  {rounds.map((r) => (
                    <RoundRow key={r.id} round={r} />
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        {group && (
          <div className="flex w-full flex-col gap-4 min-[1200px]:w-[320px] min-[1200px]:shrink-0">
            <TeammatesCard group={group} meId={me.id} lockedReason={lockedReason} onLeft={reload} />
          </div>
        )}
      </div>
    </div>
  );
}
