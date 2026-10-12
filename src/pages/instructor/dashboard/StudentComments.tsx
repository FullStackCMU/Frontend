import { Quote, TriangleAlert } from "lucide-react";
import { cn } from "../../../lib/cn";
import { FLAG_LABEL } from "../../../lib/evaluation";
import type { StudentFeedbackDetail } from "../../../types";

// ความเห็นที่นักศึกษาคนนี้ได้รับ แยกตามคำถาม — อาจารย์เห็นชื่อผู้เขียน
export default function StudentComments({ data }: { data: StudentFeedbackDetail }) {
  const textQs = data.questions.filter((q) => q.type === "text");
  return (
    <>
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
  );
}
