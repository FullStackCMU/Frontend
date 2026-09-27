import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { buttonClass } from "../../components/ui/button-variants";
import { Card } from "../../components/ui/Card";
import { StatusPill } from "../../components/ui/StatusPill";
import { api, getErrorMessage } from "../../lib/api";
import { cn } from "../../lib/cn";
import { formatCourseCode } from "../../lib/course";
import { formatDateTime } from "../../lib/date";
import type { ApiResponse, Assignment } from "../../types";

const HOUR = 60 * 60 * 1000;

function Section({ label, count, accent = false, children }: { label: string; count: number; accent?: boolean; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className={cn("text-xs font-bold tracking-widest uppercase", accent ? "text-amber-600" : "text-muted-foreground")}>
          {label}
        </h2>
        <span className={cn("text-xs font-semibold tabular-nums", accent ? "text-amber-500" : "text-muted-foreground")}>{count}</span>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-5 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">{children}</div>
    </section>
  );
}

function Heading({ a }: { a: Assignment }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-base leading-snug font-bold text-foreground">รอบที่ {a.sequenceNo}</p>
      <p className="truncate text-xs font-semibold text-indigo-600">
        {formatCourseCode(a.courseCode, a.section)} · <span className="font-normal text-muted-foreground">{a.courseTitle}</span>
      </p>
      <p className={cn("mt-0.5 truncate text-xs", a.myGroup ? "text-muted-foreground" : "font-semibold text-amber-700")}>
        {a.myGroup?.name ?? "ยังไม่มีกลุ่ม"}
      </p>
    </div>
  );
}

function TodoCard({ a }: { a: Assignment }) {
  const hoursLeft = (new Date(a.closesAt).getTime() - Date.now()) / HOUR;
  const critical = hoursLeft < 24;
  const { answered, total } = a.progress;
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
  const courseUrl = `/courses/${a.courseId}`;

  // ต้องทำก่อนประเมิน → พาไปหน้าวิชา (เลือกกลุ่ม / ยอมรับข้อตกลง)
  const blocker = !a.myGroup
    ? { text: "ต้องเลือกกลุ่มก่อนจึงเริ่มประเมินได้", action: "ไปเลือกกลุ่ม" }
    : a.contractPending
      ? { text: "ต้องยอมรับข้อตกลงกลุ่มก่อน", action: "ไปยอมรับข้อตกลง" }
      : null;

  return (
    <Card padding="none" className="flex h-full flex-col gap-3 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Heading a={a} />
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            critical ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
          )}
          title={`ปิดรับ ${formatDateTime(a.closesAt)}`}
        >
          {critical ? "ปิดวันนี้" : `เหลือ ${Math.ceil(hoursLeft / 24)} วัน`}
        </span>
      </div>

      {answered > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              ตอบแล้ว {answered} จาก {total} ช่อง
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {blocker && <p className="text-xs text-muted-foreground">{blocker.text}</p>}
      <div className="flex-1" />
      {blocker ? (
        <Link to={courseUrl} className={buttonClass({ variant: "outline", fullWidth: true })}>
          {blocker.action}
        </Link>
      ) : (
        <Link to={`${courseUrl}/rounds/${a.roundId}`} className={buttonClass({ fullWidth: true })}>
          {a.mySubmission ? "ทำต่อ" : "เริ่มประเมิน"}
        </Link>
      )}
    </Card>
  );
}

function SubmittedCard({ a }: { a: Assignment }) {
  return (
    <Card padding="none" className="flex h-full flex-col gap-3 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Heading a={a} />
        <StatusPill status="submitted" />
      </div>
      <div className="flex-1" />
      <p className="text-xs text-muted-foreground">
        ส่งเมื่อ {formatDateTime(a.mySubmission!.submittedAt!)} · ดูผลได้เมื่ออาจารย์เผยแพร่
      </p>
    </Card>
  );
}

/** "แบบประเมิน" — รอบที่เปิดรับอยู่จากทุกวิชา (AssignmentsScreen) ปิดใกล้สุดก่อน */
export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiResponse<Assignment[]>>("/rounds/assignments")
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const todo = items?.filter((a) => a.mySubmission?.status !== "submitted") ?? [];
  const submitted = items?.filter((a) => a.mySubmission?.status === "submitted") ?? [];

  return (
    <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <h1 className="mb-8 text-2xl font-bold text-foreground">แบบประเมิน</h1>

      {error && <Alert>{error}</Alert>}

      {!items && !error && (
        <div className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-2" aria-busy="true" aria-label="กำลังโหลด">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 py-32 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <ClipboardList size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">ไม่มีแบบประเมินที่ต้องทำตอนนี้</p>
            <p className="mt-1 text-sm text-muted-foreground">เมื่ออาจารย์เปิดรอบประเมิน จะแสดงที่นี่</p>
          </div>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-8">
          {todo.length > 0 && (
            <Section label="ต้องทำ" count={todo.length} accent>
              {todo.map((a) => (
                <TodoCard key={a.roundId} a={a} />
              ))}
            </Section>
          )}
          {submitted.length > 0 && (
            <Section label="ส่งแล้ว" count={submitted.length}>
              {submitted.map((a) => (
                <SubmittedCard key={a.roundId} a={a} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
