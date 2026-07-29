import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api, getErrorMessage } from "../../lib/api";
import type { ApiResponse, FeedbackSummary } from "../../types";

/** แท็บ "ฟีดแบ็กจากอาจารย์" — แสดงเฉพาะสรุปที่อาจารย์เผยแพร่แล้วเท่านั้น */
export default function FeedbackView({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<FeedbackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<ApiResponse<FeedbackSummary[]>>("/feedback/me")
      .then((res) =>
        setItems(res.data.data.filter((f) => f.courseId === courseId)),
      )
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <article aria-busy="true">กำลังโหลดฟีดแบ็ก</article>;
  if (error) return <article className="status-toast">{error}</article>;

  if (items.length === 0)
    return (
      <article className="empty-state">
        <span className="empty-state-icon">💬</span>
        <h4>ยังไม่มีฟีดแบ็กในวิชานี้</h4>
        <p data-cy="feedback-empty">
          อาจารย์กำลังพิจารณาความคิดเห็นจากเพื่อนร่วมทีม
          เมื่อสรุปเสร็จและเผยแพร่แล้วจะแสดงที่นี่
        </p>
      </article>
    );

  return (
    <>
      {items.map((f) => (
        <article key={f.id} data-cy={`feedback-${f.id}`}>
          <div className="row-between">
            <strong>{f.roundName ?? "แบบประเมิน"}</strong>
            <small className="muted">
              {dayjs(f.createdAt).format("D MMM YYYY")}
            </small>
          </div>
          <div className="growth-box" style={{ marginTop: "0.75rem" }}>
            {f.summary}
          </div>
        </article>
      ))}
    </>
  );
}
