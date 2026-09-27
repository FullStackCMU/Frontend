import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Calendar, CircleCheck, CircleHelp, Clock, Lock, Shield, Users } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Breadcrumb } from "../../../components/ui/Breadcrumb";
import { buttonClass } from "../../../components/ui/button-variants";
import { Card } from "../../../components/ui/Card";
import { formatCourseCode } from "../../../lib/course";
import { formatDateTime } from "../../../lib/date";
import { answerProgress, estimatedMinutes, toAnswerMap } from "../../../lib/evaluation";
import type { Course, Evaluation } from "../../../types";

// ข้อความตามโมเดลของระบบ: เพื่อนเห็นความเห็นแบบไม่ระบุชื่อหลังอาจารย์เผยแพร่ผล (design-ref เขียนว่าเพื่อนไม่เห็น)
const PRIVACY_TEXT =
  "อาจารย์ผู้สอนเห็นคำตอบทั้งหมด เพื่อนจะเห็นคะแนนเฉลี่ยและความเห็นถึงตัวเองแบบไม่ระบุชื่อ หลังอาจารย์เผยแพร่ผล";

function StatItem({ icon, value, label, valueClass }: { icon: ReactNode; value: string; label: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className={valueClass ?? "text-base leading-tight font-bold text-foreground"}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** หน้าแรกของรอบ (RoundLandingScreen) — ถ้าส่งแล้วแสดงหน้ายืนยันการส่ง (SubmittedScreen) */
export default function RoundLanding({ course, data }: { course: Course; data: Evaluation }) {
  const roundLabel = `รอบที่ ${data.round.sequenceNo}`;
  const courseUrl = `/courses/${course.id}`;
  const breadcrumb = (
    <Breadcrumb
      segments={[
        { label: "วิชาของฉัน", to: "/courses" },
        { label: course.courseCode, to: courseUrl },
        { label: roundLabel },
      ]}
    />
  );

  if (data.submission?.status === "submitted")
    return (
      <div className="mx-auto flex max-w-[560px] flex-col px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
        {breadcrumb}
        <div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100">
              <CircleCheck className="text-emerald-600" size={42} strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 scale-125 rounded-full border-4 border-emerald-100 opacity-50" />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-foreground">ส่งเรียบร้อยแล้ว</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              ส่ง{roundLabel} ของ {course.courseCode} เมื่อ {formatDateTime(data.submission.submittedAt!)}
              <br />
              ผลประเมินจะแสดงเมื่ออาจารย์เผยแพร่
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2">
            <Lock size={13} className="shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">เพื่อนจะไม่รู้ว่าความเห็นไหนเป็นของคุณ</p>
          </div>
          <Link to={courseUrl} className={buttonClass({ variant: "outline", size: "lg", fullWidth: true })}>
            กลับหน้าวิชา
          </Link>
        </div>
      </div>
    );

  const { done, total } = answerProgress(data, toAnswerMap(data.answers));
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const hasDraft = done > 0;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      {breadcrumb}
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-primary uppercase">
            {formatCourseCode(course.courseCode, course.section)}
          </p>
          <h1 className="text-xl leading-snug font-bold text-foreground">{roundLabel}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {course.title}
            {data.group && ` · ${data.group.name}`}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3.5">
          <Shield className="mt-0.5 shrink-0 text-primary" size={18} />
          <p className="text-sm leading-relaxed text-secondary-foreground">{PRIVACY_TEXT}</p>
        </div>

        <Card>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <StatItem
              icon={<Users size={18} className="text-primary" />}
              value={`${Math.max(0, data.targets.length - 1)} คน + ตัวเอง`}
              label="เพื่อนร่วมทีมที่ต้องประเมิน"
            />
            <StatItem
              icon={<CircleHelp size={18} className="text-primary" />}
              value={`${data.questions.length} คำถาม`}
              label={`สเกลคะแนน ${data.round.scaleMin}–${data.round.scaleMax}`}
            />
            <StatItem
              icon={<Clock size={18} className="text-primary" />}
              value={`${estimatedMinutes(data)} นาที`}
              label="ใช้เวลาประมาณ"
            />
            <StatItem
              icon={<Calendar size={18} className="text-amber-600" />}
              value={formatDateTime(data.round.closesAt)}
              label="ปิดรับ"
              valueClass="text-base leading-tight font-bold text-amber-700"
            />
          </div>
        </Card>

        <div className="flex flex-col gap-3 pb-2">
          {hasDraft && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  ตอบแล้ว {done} จาก {total} ช่อง
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {data.blocker ? (
            <Alert tone="warning">
              {data.blocker}{" "}
              <Link to={courseUrl} className="font-semibold underline">
                กลับหน้าวิชา
              </Link>
            </Alert>
          ) : (
            <Link to={`${courseUrl}/rounds/${data.round.id}/evaluate`} className={buttonClass({ size: "lg", fullWidth: true })}>
              {hasDraft ? "ทำต่อจากที่ค้างไว้" : "เริ่มประเมิน"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
