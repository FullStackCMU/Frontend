import { useEffect, useState } from "react";
import { Quote, Sparkles, TriangleAlert } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Modal } from "../../../components/ui/Modal";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { FLAG_LABEL } from "../../../lib/evaluation";
import type { ApiResponse, StudentFeedbackDetail } from "../../../types";

const ACTION_LABEL = {
  edited: { label: "แก้แล้ว", className: "bg-emerald-50 text-emerald-700" },
  ignored: { label: "ส่งตามนี้", className: "bg-amber-50 text-amber-700" },
  pending: { label: "ยังไม่ส่ง", className: "bg-muted text-muted-foreground" },
} as const;

function WrittenFlags({ flags }: { flags: StudentFeedbackDetail["writtenFlags"] }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Sparkles size={13} className="text-indigo-500" />
        คำเตือนจาก AI ในความเห็นที่นักศึกษาคนนี้เขียน
      </h3>
      {flags.total === 0 ? (
        <p className="text-sm text-muted-foreground">ไม่ถูกเตือนในรอบนี้</p>
      ) : (
        <>
          <p className="text-sm text-foreground">
            ถูกเตือน <span className="font-bold">{flags.total}</span> ครั้ง · แก้แล้ว{" "}
            <span className="font-bold text-emerald-700">{flags.edited}</span> · ส่งตามนี้{" "}
            <span className="font-bold text-amber-700">{flags.ignored}</span>
            {flags.pending > 0 && <> · ยังไม่ส่ง {flags.pending}</>}
          </p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {flags.items.map((f, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>
                  ข้อ {f.questionNo ?? "?"} ถึง {f.isSelf ? "ตัวเอง" : (f.evaluateeName ?? "—")}
                </span>
                <span className="font-medium text-foreground">{FLAG_LABEL[f.category]}</span>
                <span className={cn("rounded-full px-2 py-0.5 font-medium", ACTION_LABEL[f.studentAction].className)}>
                  {ACTION_LABEL[f.studentAction].label}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function StudentDetailModal({
  roundId,
  studentId,
  onClose,
}: {
  roundId: string;
  studentId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentFeedbackDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiResponse<StudentFeedbackDetail>>(`/feedback/rounds/${roundId}/students/${studentId}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [roundId, studentId]);

  const ratingQs = data?.questions.filter((q) => q.type === "rating") ?? [];
  const textQs = data?.questions.filter((q) => q.type === "text") ?? [];

  return (
    <Modal title={data ? data.student.name : "รายละเอียดนักศึกษา"} size="xl" onClose={onClose}>
      <div className="flex flex-col gap-6 px-6 py-6">
        {error && <Alert>{error}</Alert>}
        {!data && !error && <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" aria-label="กำลังโหลด" />}

        {data && (
          <>
            <p className="-mt-2 text-sm text-muted-foreground">
              {[data.student.studentId, data.student.group?.name ?? "ยังไม่มีกลุ่ม"].filter(Boolean).join(" · ")}
              {" · "}เพื่อนประเมิน {data.evaluations.filter((e) => !e.evaluator.isSelf).length} คน
              {" · "}
              {data.evaluations.some((e) => e.evaluator.isSelf) ? "ประเมินตัวเองแล้ว" : "ยังไม่ได้ประเมินตัวเอง"}
            </p>

            {data.evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีใครส่งแบบประเมินให้นักศึกษาคนนี้ในรอบนี้</p>
            ) : (
              <>
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    คะแนนที่ได้รับ (สเกล {data.scale.min}–{data.scale.max})
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted text-xs text-muted-foreground">
                          <th className="px-3 py-2.5 font-semibold">ผู้ประเมิน</th>
                          {ratingQs.map((q) => (
                            <th key={q.id} className="px-3 py-2.5 text-center font-semibold" title={q.prompt}>
                              ข้อ {q.orderNo}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.evaluations.map((e) => (
                          <tr key={e.evaluator.id} className={cn("border-b border-border last:border-b-0", e.evaluator.isSelf && "bg-secondary")}>
                            <td className="px-3 py-2.5">
                              {e.evaluator.name}
                              {e.evaluator.isSelf && <span className="ml-1 text-xs text-primary">(ตัวเอง)</span>}
                            </td>
                            {ratingQs.map((q) => (
                              <td key={q.id} className="px-3 py-2.5 text-center font-mono font-semibold">
                                {e.answers.find((a) => a.questionId === q.id)?.score ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="text-xs text-muted-foreground">
                    {ratingQs.map((q) => (
                      <li key={q.id}>
                        ข้อ {q.orderNo}: {q.prompt}
                      </li>
                    ))}
                  </ul>
                </section>

                {textQs.map((q) => (
                  <section key={q.id} className="flex flex-col gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Quote size={13} className="text-indigo-500" />
                      {q.prompt}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {data.evaluations.map((e) => {
                        const answer = e.answers.find((a) => a.questionId === q.id);
                        const comment = answer?.comment;
                        if (!comment) return null;
                        return (
                          <li
                            key={e.evaluator.id}
                            className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed", e.evaluator.isSelf ? "bg-secondary" : "bg-muted")}
                          >
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">
                              {e.evaluator.name}
                              {e.evaluator.isSelf && " (เขียนถึงตัวเอง)"}
                            </p>
                            <p className="text-foreground">{comment}</p>
                            {answer?.ignoredWarning && (
                              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-700">
                                <TriangleAlert size={12} className="shrink-0" />
                                AI เตือนว่าอาจ{FLAG_LABEL[answer.ignoredWarning]} ผู้เขียนเลือกส่งตามนี้
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </>
            )}

            <WrittenFlags flags={data.writtenFlags} />
          </>
        )}
      </div>
    </Modal>
  );
}
