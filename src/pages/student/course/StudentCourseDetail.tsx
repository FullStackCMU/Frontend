import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Breadcrumb } from "../../../components/ui/Breadcrumb";
import { Button } from "../../../components/ui/Button";
import { buttonClass } from "../../../components/ui/button-variants";
import { Card } from "../../../components/ui/Card";
import { StatusDot, StatusPill } from "../../../components/ui/StatusPill";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode, formatTerm } from "../../../lib/course";
import { formatDateTime, formatRange } from "../../../lib/date";
import { getRoundStatus, getStudentRoundStatus, STUDENT_LABEL } from "../../../lib/status";
import type { ApiResponse, AvailableGroup, Course, CourseRound, Me, MyGroup } from "../../../types";
import { ContractCard, TeammatesCard, TeamPicker } from "./TeamSetup";

type Data = {
  course: Course;
  rounds: CourseRound[];
  group: MyGroup | null;
  // โหลดเฉพาะเมื่อยังไม่มีกลุ่ม
  available: AvailableGroup[];
};

async function loadData(courseId: string): Promise<Data> {
  const [course, rounds, group] = await Promise.all([
    api.get<ApiResponse<Course>>(`/courses/${courseId}`),
    api.get<ApiResponse<CourseRound[]>>(`/rounds?courseId=${courseId}`),
    api.get<ApiResponse<MyGroup | null>>(`/groups/my?courseId=${courseId}`),
  ]);
  const available = group.data.data
    ? []
    : (await api.get<ApiResponse<AvailableGroup[]>>(`/groups/available?courseId=${courseId}`)).data.data;
  return { course: course.data.data, rounds: rounds.data.data, group: group.data.data, available };
}

function RoundCard({ round, blocker }: { round: CourseRound; blocker: string | null }) {
  const status = getStudentRoundStatus(round);
  const canStart = status === "open" || status === "draft";
  const roundUrl = `/courses/${round.courseId}/rounds/${round.id}`;

  return (
    <Card padding="none" className={cn("flex flex-col gap-3 px-5 py-4", status === "upcoming" && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot status={status} />
          <p className="truncate text-sm leading-snug font-semibold text-foreground">รอบที่ {round.sequenceNo}</p>
        </div>
        <StatusPill status={status} label={STUDENT_LABEL[status]} />
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">{formatRange(round.opensAt, round.closesAt)}</p>

      {canStart && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Clock size={11} />
            ปิดรับ {formatDateTime(round.closesAt)}
          </p>
          {blocker ? (
            <>
              <Button fullWidth disabled>
                {status === "draft" ? "ทำต่อ" : "เริ่มประเมิน"}
              </Button>
              <p className="text-xs text-muted-foreground">{blocker}</p>
            </>
          ) : (
            <Link to={roundUrl} className={buttonClass({ fullWidth: true })}>
              {status === "draft" ? "ทำต่อ" : "เริ่มประเมิน"}
            </Link>
          )}
        </div>
      )}

      {status === "submitted" && round.mySubmission?.submittedAt && (
        <p className="text-xs text-muted-foreground">
          ส่งเมื่อ {formatDateTime(round.mySubmission.submittedAt)} ·{" "}
          <Link to={roundUrl} className="font-medium text-primary hover:underline">
            ดูรายละเอียด
          </Link>
        </p>
      )}

      {status === "closed" && (
        <p className="text-xs text-muted-foreground">
          รอบนี้ปิดรับแล้ว คุณไม่ได้ส่งแบบประเมิน ·{" "}
          <Link to={`/feedback/${round.id}`} className="font-medium text-primary hover:underline">
            ดูสถานะผล
          </Link>
        </p>
      )}

      {status === "released" && (
        <Link to={`/feedback/${round.id}`} className={buttonClass({ variant: "outline", fullWidth: true })}>
          ดูผลประเมิน
        </Link>
      )}
    </Card>
  );
}

function InfoCard({ title, rows }: { title: string; rows: { label: string; value: string | number }[] }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <dl className="flex flex-col divide-y divide-border px-5 py-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
            <dd className="text-right text-xs text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function StudentCourseDetail({ me }: { me: Me }) {
  const { courseId = "" } = useParams();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  // เปลี่ยนค่าเพื่อโหลดข้อมูลใหม่
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    loadData(courseId)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId, version]);

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
        <Alert>{error}</Alert>
      </div>
    );
  if (!data)
    return (
      <div className="flex flex-col gap-4 px-4 py-6 min-[900px]:px-10 min-[900px]:py-8" aria-busy="true" aria-label="กำลังโหลด">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    );

  const { course, rounds, group, available } = data;
  const now = new Date();
  const contractPending = !!group?.contractText && !group.members.find((m) => m.id === me.id)?.contractAcceptedAt;

  // backend ห้ามเปลี่ยนกลุ่มถ้าเริ่มทำแบบประเมินรอบที่เปิดอยู่ — แสดงเหตุผลล่วงหน้า
  const lockingRound = rounds.find((r) => getRoundStatus(r, now) === "open" && r.mySubmission);
  const lockedReason = lockingRound
    ? `เปลี่ยนกลุ่มได้หลังรอบที่ ${lockingRound.sequenceNo} ปิดรับ (คุณเริ่มทำแบบประเมินแล้ว)`
    : null;
  const blocker = !group
    ? "เข้ากลุ่มก่อนจึงเริ่มประเมินได้"
    : contractPending
      ? "ยอมรับข้อตกลงกลุ่มก่อนจึงเริ่มประเมินได้"
      : null;

  const statuses = rounds.map((r) => getStudentRoundStatus(r, now));
  const summaryRows = [
    { label: "ต้องทำ", value: statuses.filter((s) => s === "open" || s === "draft").length },
    { label: "ส่งแล้ว", value: statuses.filter((s) => s === "submitted").length },
    { label: "ดูผลได้", value: statuses.filter((s) => s === "released").length },
  ];
  const detailRows = [
    { label: "รหัสวิชา", value: formatCourseCode(course.courseCode, course.section) },
    { label: "ภาคการศึกษา", value: formatTerm(course.semester, course.academicYear) },
    { label: "ผู้สอน", value: course.instructors.join(", ") || "—" },
    { label: "กลุ่ม", value: group?.name ?? "ยังไม่มีกลุ่ม" },
    { label: "จำนวนรอบทั้งหมด", value: `${rounds.length} รอบ` },
  ];

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
          {!group && <TeamPicker groups={available} onJoined={reload} />}
          {group && contractPending && <ContractCard group={group} onAccepted={reload} />}

          <div className="flex items-baseline gap-2">
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">รอบประเมิน</p>
            <span className="text-xs font-semibold text-muted-foreground">{rounds.length}</span>
          </div>
          {rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">อาจารย์ยังไม่ได้ตั้งรอบประเมิน</p>
          ) : (
            <div className="flex flex-col gap-4">
              {rounds.map((r) => (
                <RoundCard key={r.id} round={r} blocker={blocker} />
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 min-[1200px]:w-[320px] min-[1200px]:shrink-0">
          {group && <TeammatesCard group={group} meId={me.id} lockedReason={lockedReason} onLeft={reload} />}
          <InfoCard title="รายละเอียดวิชา" rows={detailRows} />
          <InfoCard title="สรุปสถานะ" rows={summaryRows} />
        </div>
      </div>
    </div>
  );
}
