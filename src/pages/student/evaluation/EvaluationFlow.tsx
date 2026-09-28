import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { api, fetchEvaluation, getErrorMessage } from "../../../lib/api";
import type { ApiResponse, Course, Evaluation } from "../../../types";
import EvaluationPage from "./EvaluationPage";
import RoundLanding from "./RoundLanding";

export default function EvaluationFlow() {
  const { courseId = "", roundId = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [data, setData] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get<ApiResponse<Course>>(`/courses/${courseId}`), fetchEvaluation(roundId)])
      .then(([c, e]) => {
        setCourse(c.data.data);
        setData(e);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId, roundId]);

  if (error)
    return (
      <div className="px-4 py-6 min-[900px]:px-10">
        <Alert>{error}</Alert>
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
