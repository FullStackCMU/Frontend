import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { useCourse } from "../../../hooks/useCourses";
import { useEvaluation, useSetEvaluation } from "../../../hooks/useEvaluation";
import { getErrorMessage } from "../../../lib/api";
import EvaluationPage from "./EvaluationPage";
import RoundLanding from "./RoundLanding";

export default function EvaluationFlow() {
  const { courseId = "", roundId = "" } = useParams();
  const courseQuery = useCourse(courseId);
  const evaluationQuery = useEvaluation(roundId);
  const setData = useSetEvaluation(courseId, roundId);
  const course = courseQuery.data;
  const data = evaluationQuery.data;
  const error = courseQuery.error ?? evaluationQuery.error;

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10">
        <Alert>{getErrorMessage(error)}</Alert>
      </div>
    );
  if (!course || !data)
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 py-8" aria-busy="true" aria-label="กำลังโหลด">
        <div className="h-7 w-60 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );

  const base = `/courses/${courseId}/rounds/${roundId}`;
  return (
    <Routes>
      <Route index element={<RoundLanding course={course} data={data} />} />
      <Route
        path="evaluate"
        element={
          // ทำต่อไม่ได้ → กลับหน้าแรกของรอบซึ่งบอกเหตุผล
          data.blocker ? (
            <Navigate to={base} replace />
          ) : (
            <EvaluationPage course={course} data={data} onChange={setData} />
          )
        }
      />
      <Route path="*" element={<Navigate to={base} replace />} />
    </Routes>
  );
}
