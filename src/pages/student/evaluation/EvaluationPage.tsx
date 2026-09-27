import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CircleCheck, Lock, Save } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Avatar } from "../../../components/ui/Avatar";
import { Breadcrumb } from "../../../components/ui/Breadcrumb";
import { Button } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { inputClass } from "../../../components/ui/field-styles";
import { getErrorMessage, saveEvaluationDraft, submitEvaluation } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import {
  answerKey,
  isQuestionComplete,
  MAX_COMMENT_LENGTH,
  toAnswerList,
  toAnswerMap,
  type AnswerMap,
} from "../../../lib/evaluation";
import type { Course, EvalTarget, Evaluation } from "../../../types";

const PEER_NOTE = "เพื่อนคนนี้จะเห็นความเห็นแบบไม่ระบุชื่อ หลังอาจารย์เผยแพร่ผล";
const SELF_NOTE = "ความเห็นถึงตัวเอง อาจารย์ผู้สอนเท่านั้นที่เห็น";

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

const timeFmt = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" });

function TargetHeader({ target, badge }: { target: EvalTarget; badge?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Avatar name={target.name} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{target.name}</p>
        {target.isSelf && <p className="text-xs font-medium text-primary">ตัวคุณเอง</p>}
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-primary">{badge}</span>
      )}
    </div>
  );
}

function RatingCard({
  target,
  min,
  max,
  value,
  onChange,
}: {
  target: EvalTarget;
  min: number;
  max: number;
  value: number | null;
  onChange: (score: number) => void;
}) {
  const scores = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className={cn("rounded-2xl border px-4 py-4", target.isSelf ? "border-indigo-200 bg-secondary" : "border-border bg-card")}>
      <TargetHeader target={target} badge={value !== null ? `${value}/${max}` : undefined} />
      <div role="radiogroup" aria-label={`คะแนนของ ${target.name}`} className="flex gap-1.5">
        {scores.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            onClick={() => onChange(s)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl border-2 py-2.5 text-base leading-none font-bold transition-all",
              value === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{min} = ต้องปรับปรุง</span>
        <span>{max} = ดีเยี่ยม</span>
      </div>
    </div>
  );
}

function TextCard({
  target,
  value,
  onChange,
}: {
  target: EvalTarget;
  value: string;
  onChange: (text: string) => void;
}) {
  const over = value.length > MAX_COMMENT_LENGTH;
  const id = `comment-${target.id}`;
  return (
    <div className={cn("rounded-2xl border px-4 py-4", target.isSelf ? "border-indigo-200 bg-secondary" : "border-border bg-card")}>
      <TargetHeader target={target} />
      <label htmlFor={id} className="sr-only">
        ความเห็นถึง {target.name}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={target.isSelf ? "เขียนถึงตัวเอง..." : "เขียนถึงเพื่อนคนนี้..."}
        aria-describedby={`${id}-note`}
        aria-invalid={over || undefined}
        className={cn(inputClass, "min-h-[88px] resize-none leading-relaxed field-sizing-content")}
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p id={`${id}-note`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock size={11} className="shrink-0" />
          {target.isSelf ? SELF_NOTE : PEER_NOTE}
        </p>
        <span className={cn("shrink-0 font-mono text-xs", over ? "text-red-600" : "text-muted-foreground")}>
          {value.length} / {MAX_COMMENT_LENGTH}
        </span>
      </div>
    </div>
  );
}

/** ทำแบบประเมินทีละคำถาม (EvaluationScreen) — บันทึกร่างทุกครั้งที่เปลี่ยนคำถาม */
export default function EvaluationPage({
  course,
  data,
  onChange,
}: {
  course: Course;
  data: Evaluation;
  onChange: (data: Evaluation) => void;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const questions = data.questions;
  const index = Math.min(Math.max(Number(params.get("q") ?? 1) - 1, 0), questions.length - 1) || 0;
  const question = questions[index];
  const isLast = index === questions.length - 1;
  const courseUrl = `/courses/${course.id}`;
  const roundUrl = `${courseUrl}/rounds/${data.round.id}`;

  const [answers, setAnswers] = useState<AnswerMap>(() => toAnswerMap(data.answers));
  const [dirty, setDirty] = useState(false);
  // นับการแก้ — กันกรณีแก้ต่อระหว่างที่กำลังบันทึก แล้วถูกนับว่าบันทึกแล้ว
  const editVersion = useRef(0);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [submitError, setSubmitError] = useState("");
  const [confirming, setConfirming] = useState(false);

  // ปิดแท็บ/รีเฟรชทั้งที่ยังไม่บันทึก → browser ถามยืนยัน
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(evaluateeId: string, patch: Partial<AnswerMap[string]>) {
    const key = answerKey(question.id, evaluateeId);
    setAnswers((prev) => {
      const current = (prev[key] as AnswerMap[string] | undefined) ?? { score: null, comment: "" };
      return { ...prev, [key]: { ...current, ...patch } };
    });
    editVersion.current += 1;
    setDirty(true);
    setSubmitError("");
  }

  async function save(): Promise<boolean> {
    if (!dirty) return true;
    const version = editVersion.current;
    setSaveState({ kind: "saving" });
    try {
      const updated = await saveEvaluationDraft(data.round.id, toAnswerList(answers));
      if (editVersion.current === version) setDirty(false);
      setSaveState({ kind: "saved", at: new Date() });
      onChange(updated);
      return true;
    } catch (err) {
      setSaveState({ kind: "error", message: getErrorMessage(err) });
      return false;
    }
  }

  async function goTo(i: number) {
    if (!(await save())) return;
    setParams({ q: String(i + 1) });
    window.scrollTo({ top: 0 });
  }

  async function saveAndExit() {
    if (await save()) navigate(courseUrl);
  }

  function requestSubmit() {
    const incomplete = questions.filter((q) => !isQuestionComplete(data, q, answers));
    const tooLong = Object.values(answers).some((a) => a.comment.length > MAX_COMMENT_LENGTH);
    if (tooLong) {
      setSubmitError(`มีความเห็นที่ยาวเกิน ${MAX_COMMENT_LENGTH} ตัวอักษร`);
      return;
    }
    if (incomplete.length > 0) {
      setSubmitError(`ยังตอบไม่ครบ: คำถามข้อ ${incomplete.map((q) => q.orderNo).join(", ")}`);
      goTo(questions.indexOf(incomplete[0]));
      return;
    }
    setConfirming(true);
  }

  async function confirmSubmit() {
    const updated = await submitEvaluation(data.round.id, toAnswerList(answers));
    setDirty(false);
    // ส่งแล้ว → data.blocker ไม่ว่าง → EvaluationFlow พากลับหน้าแรกของรอบ (หน้าส่งเรียบร้อย)
    onChange(updated);
    navigate(roundUrl, { replace: true });
  }

  const saveLabel =
    saveState.kind === "saving"
      ? "กำลังบันทึก..."
      : saveState.kind === "saved"
        ? `บันทึกแล้ว ${timeFmt.format(saveState.at)}`
        : saveState.kind === "error"
          ? "บันทึกไม่สำเร็จ"
          : "บันทึกอัตโนมัติ";

  return (
    <div className="flex min-h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-4 pt-6 min-[900px]:px-8">
          <Breadcrumb
            segments={[
              { label: course.courseCode, to: courseUrl },
              { label: `รอบที่ ${data.round.sequenceNo}`, to: roundUrl },
              { label: "ทำแบบประเมิน" },
            ]}
          />
        </div>

        {/* ความคืบหน้า — มือถือต้องอยู่ใต้ header ของ AppLayout (h-12) */}
        <div className="sticky top-12 z-10 border-b border-border bg-card px-4 pt-4 pb-3 min-[900px]:top-0 min-[900px]:px-8">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="font-medium whitespace-nowrap text-foreground">
              คำถามที่ {index + 1} จาก {questions.length}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn("flex items-center gap-1 whitespace-nowrap", saveState.kind === "error" && "text-red-600")}
                aria-live="polite"
                title="บันทึกร่างอัตโนมัติทุกครั้งที่เปลี่ยนคำถาม"
              >
                <Save size={12} />
                {saveLabel}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveAndExit}
                disabled={saveState.kind === "saving"}
                className="whitespace-nowrap"
              >
                บันทึกและออก
              </Button>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-5 min-[900px]:px-8">
          {saveState.kind === "error" && <Alert className="mb-4">{saveState.message}</Alert>}
          {submitError && <Alert className="mb-4">{submitError}</Alert>}

          <h2 className="mb-1 text-xl leading-snug font-bold text-foreground">{question.prompt}</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {question.type === "rating"
              ? `ให้คะแนน ${data.round.scaleMin}–${data.round.scaleMax} กับทุกคนรวมถึงตัวเอง`
              : "เขียนความเห็นถึงทุกคนรวมถึงตัวเอง"}
          </p>

          <div className="flex flex-col gap-3">
            {data.targets.map((t) => {
              const a = answers[answerKey(question.id, t.id)];
              return question.type === "rating" ? (
                <RatingCard
                  key={t.id}
                  target={t}
                  min={data.round.scaleMin}
                  max={data.round.scaleMax}
                  value={a?.score ?? null}
                  onChange={(score) => update(t.id, { score })}
                />
              ) : (
                <TextCard key={t.id} target={t} value={a?.comment ?? ""} onChange={(comment) => update(t.id, { comment })} />
              );
            })}
          </div>
        </div>

        {/* ปุ่มนำทาง — มือถือต้องอยู่เหนือแถบเมนูล่าง */}
        <div className="sticky bottom-0 border-t border-border bg-card px-4 py-4 max-[899px]:bottom-(--bottom-nav-h) min-[900px]:px-8">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="คำถามก่อนหน้า"
              onClick={() => goTo(index - 1)}
              disabled={index === 0 || saveState.kind === "saving"}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={saveState.kind === "saving"}
              onClick={() => (isLast ? requestSubmit() : goTo(index + 1))}
            >
              {isLast ? "ส่งแบบประเมิน" : "ถัดไป"}
            </Button>
          </div>
        </div>
      </div>

      {/* รายการคำถาม — จอกว้างเท่านั้น */}
      <aside className="sticky top-0 hidden w-[280px] shrink-0 self-start border-l border-border px-5 py-6 min-[1100px]:block">
        <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">คำถาม</p>
        <ol className="mb-6 flex flex-col gap-1">
          {questions.map((q, i) => {
            const complete = isQuestionComplete(data, q, answers);
            const active = i === index;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted",
                    active && "bg-secondary hover:bg-secondary"
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {complete ? (
                      <CircleCheck size={14} className="text-emerald-500" aria-label="ตอบครบแล้ว" />
                    ) : (
                      <span
                        className={cn(
                          "flex size-3.5 items-center justify-center rounded-full border text-[9px] font-bold",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                    )}
                  </span>
                  <span className={cn("line-clamp-2 text-xs leading-snug", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {q.prompt}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex items-start gap-1.5 rounded-xl bg-muted px-3 py-3">
          <Lock size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            ความเห็นถึงเพื่อนจะแสดงแบบไม่ระบุชื่อ หลังอาจารย์เผยแพร่ผล
          </p>
        </div>
      </aside>

      {confirming && (
        <ConfirmModal
          title="ส่งแบบประเมิน?"
          confirmLabel="ส่งแบบประเมิน"
          onConfirm={confirmSubmit}
          onClose={() => setConfirming(false)}
        >
          <p>ส่งแล้วจะแก้ไขคำตอบไม่ได้อีก</p>
        </ConfirmModal>
      )}
    </div>
  );
}
