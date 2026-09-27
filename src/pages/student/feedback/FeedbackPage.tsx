import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ChevronRight, Lock, Quote } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Breadcrumb } from "../../../components/ui/Breadcrumb";
import { buttonClass } from "../../../components/ui/button-variants";
import { Card } from "../../../components/ui/Card";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode } from "../../../lib/course";
import { formatDateTime } from "../../../lib/date";
import type { ApiResponse, FeedbackListItem, RoundFeedback } from "../../../types";

// ไล่เฉด indigo สีเดียว (ไม่ใช้แดง) — design-ref
const RAMP = ["bg-ramp-1", "bg-ramp-2", "bg-ramp-3", "bg-ramp-4", "bg-ramp-5"];

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Card padding="none">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        {icon}
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </Card>
  );
}

function Bar({
  label,
  value,
  min,
  max,
  muted = false,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  muted?: boolean;
}) {
  const ratio = value === null ? 0 : (value - min) / (max - min);
  const color = muted ? "bg-zinc-300" : RAMP[Math.min(4, Math.floor(ratio * 5))];
  return (
    <div className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.max(ratio, 0) * 100}%` }} />
      </div>
      <span className="text-right font-mono text-sm font-bold text-foreground">
        {value === null ? "—" : value.toFixed(1)}
        <span className="text-xs font-normal text-muted-foreground"> / {max}</span>
      </span>
    </div>
  );
}

/** ข้อสังเกตเบาๆ เมื่อคะแนนที่ให้ตัวเองต่างจากเพื่อนตั้งแต่ 1 คะแนน */
function gapNote(peer: number | null, self: number | null) {
  if (peer === null || self === null) return null;
  if (self - peer >= 1) return "คุณให้คะแนนตัวเองสูงกว่าที่เพื่อนให้";
  if (peer - self >= 1) return "เพื่อนมองคุณดีกว่าที่คุณมองตัวเอง";
  return null;
}

function Pending({ data }: { data: RoundFeedback }) {
  const closed = new Date(data.round.closesAt) <= new Date();
  const submitted = data.mySubmission?.status === "submitted";
  const steps = [
    submitted
      ? {
          label: "ส่งแบบประเมินแล้ว",
          detail: `ส่งเมื่อ ${formatDateTime(data.mySubmission!.submittedAt!)}`,
          state: "done",
        }
      : closed
        ? {
            label: "ไม่ได้ส่งแบบประเมินในรอบนี้",
            detail: "ยังดูผลที่เพื่อนประเมินคุณได้เมื่อเผยแพร่",
            state: "skipped",
          }
        : {
            label: "ยังไม่ได้ส่งแบบประเมิน",
            detail: `ส่งได้ถึง ${formatDateTime(data.round.closesAt)}`,
            state: "active",
          },
    {
      label: "ปิดรับแบบประเมิน",
      detail: `${closed ? "ปิดเมื่อ" : "ปิดรับ"} ${formatDateTime(data.round.closesAt)}`,
      state: closed ? "done" : submitted ? "active" : "upcoming",
    },
    {
      label: "อาจารย์เผยแพร่ผล",
      detail: "คะแนนและความเห็นจะแสดงที่หน้านี้เมื่ออาจารย์เผยแพร่",
      state: closed ? "active" : "upcoming",
    },
  ] as const;

  return (
    <Card>
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={step.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                    step.state === "done" && "bg-primary",
                    step.state === "active" && "border-2 border-primary bg-white",
                    (step.state === "upcoming" || step.state === "skipped") && "border border-border bg-muted"
                  )}
                >
                  {step.state === "done" && <Check size={14} strokeWidth={2.5} className="text-white" />}
                  {step.state === "active" && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
                {!last && (
                  <span className={cn("my-1 min-h-7 w-px flex-1", step.state === "done" ? "bg-primary" : "bg-border")} />
                )}
              </div>
              <div className={cn(!last && "pb-6")}>
                <p
                  className={cn(
                    "text-sm leading-snug font-semibold",
                    step.state === "upcoming" || step.state === "skipped" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** ผลประเมินของรอบ (FeedbackScreen) — แสดงเฉพาะส่วนที่อาจารย์เผยแพร่แล้ว (backend ตัดส่วนที่ยังไม่เผยแพร่ออก) */
export default function FeedbackPage() {
  const { roundId = "" } = useParams();
  const [data, setData] = useState<RoundFeedback | null>(null);
  const [others, setOthers] = useState<FeedbackListItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<RoundFeedback>>(`/feedback/rounds/${roundId}`),
      api.get<ApiResponse<FeedbackListItem[]>>("/feedback"),
    ])
      .then(([f, list]) => {
        setData(f.data.data);
        setOthers(list.data.data.filter((i) => i.courseId === f.data.data.course.id && i.roundId !== roundId));
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [roundId]);

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10">
        <Alert>{error}</Alert>
      </div>
    );
  if (!data)
    return (
      <div className="flex flex-col gap-4 px-4 py-6 min-[900px]:px-10 min-[900px]:py-8" aria-busy="true" aria-label="กำลังโหลด">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );

  const { round, course, scores, comments } = data;
  // "เผยแพร่แล้ว" ตามอาจารย์ — แต่อาจไม่มีข้อมูลถ้าผู้ประเมินไม่พอ (withheldReason)
  const released = !!(round.scoresReleasedAt || round.feedbackReleasedAt);
  const releasedAt = [round.scoresReleasedAt, round.feedbackReleasedAt].filter(Boolean).sort().at(-1);
  const courseLabel = formatCourseCode(course.courseCode, course.section);

  const detailRows = [
    { label: "วิชา", value: `${courseLabel} ${course.title}` },
    { label: "กลุ่ม", value: data.groupName ?? "—" },
    { label: "รอบ", value: `รอบที่ ${round.sequenceNo}` },
    released
      ? { label: "เผยแพร่เมื่อ", value: releasedAt ? formatDateTime(releasedAt) : "—" }
      : { label: "ปิดรับ", value: formatDateTime(round.closesAt) },
    { label: "เพื่อนที่ประเมินคุณ", value: `${data.peerCount} คน` },
  ];

  const left = !released ? (
    <Pending data={data} />
  ) : data.withheldReason ? (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
        <Lock size={22} className="text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{data.withheldReason}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        รอบนี้มีเพื่อนส่งแบบประเมินให้คุณ {data.peerCount} คน ระบบแสดงผลเมื่อมีอย่างน้อย {data.minPeers} คน
        เพื่อไม่ให้รู้ว่าใครให้คะแนนหรือเขียนความเห็น
      </p>
    </Card>
  ) : (
    <>
      {scores ? (
        <Section title="คะแนนรายด้าน">
          <div className="flex flex-col gap-6 px-6 py-5">
            {scores.map((s) => {
              const note = gapNote(s.peerAverage, s.selfScore);
              return (
                <div key={s.questionId} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">{s.prompt}</p>
                  <Bar label={`เพื่อน (${s.peerCount} คน)`} value={s.peerAverage} min={round.scaleMin} max={round.scaleMax} />
                  <Bar label="คุณให้ตัวเอง" value={s.selfScore} min={round.scaleMin} max={round.scaleMax} muted />
                  {note && <p className="text-xs text-muted-foreground">{note}</p>}
                </div>
              );
            })}
            {data.mySubmission?.status !== "submitted" && (
              <p className="text-xs text-muted-foreground">คุณไม่ได้ส่งแบบประเมินรอบนี้ จึงไม่มีคะแนนที่ให้ตัวเอง</p>
            )}
          </div>
        </Section>
      ) : (
        <Alert tone="warning">อาจารย์ยังไม่ได้เผยแพร่คะแนนของรอบนี้</Alert>
      )}

      {comments ? (
        comments.map((c) => (
          <Section key={c.questionId} title={c.prompt} icon={<Quote size={14} className="text-indigo-500" />}>
            {c.comments.length === 0 ? (
              <p className="px-6 py-5 text-sm text-muted-foreground">ไม่มีความเห็นในข้อนี้</p>
            ) : (
              <ul className="flex flex-col gap-3 px-6 py-5">
                {c.comments.map((text, i) => (
                  <li key={i} className="rounded-xl bg-indigo-50 px-4 py-3 text-[15px] leading-relaxed text-foreground">
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ))
      ) : (
        <Alert tone="warning">อาจารย์ยังไม่ได้เผยแพร่ความเห็นจากเพื่อนของรอบนี้</Alert>
      )}
    </>
  );

  return (
    <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <Breadcrumb segments={[{ label: "ฟีดแบ็ก", to: "/feedback" }, { label: `${course.courseCode} · รอบที่ ${round.sequenceNo}` }]} />
      <div className="mb-6">
        <h1 className="mb-0.5 text-2xl font-bold text-foreground">{released ? "ผลประเมิน" : "ผลประเมินยังไม่พร้อม"}</h1>
        <p className="text-sm text-muted-foreground">
          {[courseLabel, course.title, data.groupName].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="flex flex-col items-start gap-8 min-[1200px]:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-5 min-[1200px]:max-w-[760px] min-[1200px]:min-w-[480px]">
          {left}
          <div>
            <Link to={`/courses/${course.id}`} className={buttonClass({ variant: "outline" })}>
              กลับหน้าวิชา
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 min-[1200px]:w-[320px] min-[1200px]:shrink-0">
          <Section title="รายละเอียด">
            <dl className="flex flex-col divide-y divide-border px-5 py-4">
              {detailRows.map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-right text-xs text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section title="ความเป็นส่วนตัว" icon={<Lock size={13} className="text-muted-foreground" />}>
            <p className="px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              ความเห็นจากเพื่อนแสดงแบบไม่ระบุชื่อ และสลับลำดับทุกครั้งที่เปิดหน้านี้ ความเห็นที่คุณเขียนถึงตัวเองไม่แสดงที่นี่
            </p>
          </Section>
          {others.length > 0 && (
            <Section title="รอบอื่นในวิชานี้">
              <ul className="divide-y divide-border">
                {others.map((o) => (
                  <li key={o.roundId}>
                    <Link
                      to={`/feedback/${o.roundId}`}
                      className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-muted"
                    >
                      <span>
                        <span className="block text-xs font-medium text-foreground">รอบที่ {o.sequenceNo}</span>
                        <span className="block text-[11px] text-muted-foreground">เผยแพร่ {formatDateTime(o.releasedAt)}</span>
                      </span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
