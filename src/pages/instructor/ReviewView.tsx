import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import type {
  ApiResponse,
  Course,
  FeedbackSummary,
  Group,
  RawAnswer,
  Round,
} from "../../types";

type StudentAnswers = {
  name: string;
  self: RawAnswer[];
  peers: RawAnswer[];
};

export default function ReviewView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [courseId, setCourseId] = useState("");
  const [roundId, setRoundId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [raw, setRaw] = useState<RawAnswer[]>([]);
  const [summaries, setSummaries] = useState<FeedbackSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  // เปิดทีละคน
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses")
      .then((res) => setCourses(res.data.data))
      .catch((err) => setMsg(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    setRoundId("");
    setGroupId("");
    setRaw([]);
    setSummaries([]);
    setOpenId(null);
    if (!courseId) return;
    Promise.all([
      api.get<ApiResponse<Round[]>>(`/rounds?courseId=${courseId}`),
      api.get<ApiResponse<Group[]>>(`/groups?courseId=${courseId}`),
    ])
      .then(([r, g]) => {
        setRounds(r.data.data);
        setGroups(g.data.data);
      })
      .catch((err) => setMsg(getErrorMessage(err)));
  }, [courseId]);

  async function loadData(rId: string, gId: string) {
    if (!rId || !gId) return;
    setLoading(true);
    setMsg("");
    setOpenId(null);
    try {
      const [r, s] = await Promise.all([
        api.get<ApiResponse<RawAnswer[]>>(`/feedback/raw/${rId}?groupId=${gId}`),
        api.get<ApiResponse<FeedbackSummary[]>>(`/feedback/round/${rId}`),
      ]);
      setRaw(r.data.data);
      setSummaries(s.data.data);
      const d: Record<string, string> = {};
      s.data.data.forEach((f) => {
        if (f.studentId) d[f.studentId] = f.summary;
      });
      setDrafts(d);
    } catch (err) {
      setMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveSummary(studentId: string, publish: boolean) {
    const summary = drafts[studentId]?.trim();
    if (!summary) {
      setMsg("เขียนสรุปก่อนบันทึก");
      return;
    }
    try {
      await api.post("/feedback", {
        roundId,
        studentId,
        summary,
        isPublished: publish,
      });
      await loadData(roundId, groupId);
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  async function togglePublish(f: FeedbackSummary) {
    try {
      await api.patch(`/feedback/${f.id}/publish`, {
        isPublished: !f.isPublished,
      });
      await loadData(roundId, groupId);
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  // จัดกลุ่มคำตอบตามผู้ถูกประเมิน แยกประเมินตนเองกับความเห็นจากเพื่อน
  const byStudent: Record<string, StudentAnswers> = {};
  raw.forEach((a) => {
    if (!byStudent[a.evaluateeId]) {
      byStudent[a.evaluateeId] = { name: a.evaluateeName, self: [], peers: [] };
    }
    if (a.evaluatorId === a.evaluateeId) byStudent[a.evaluateeId].self.push(a);
    else byStudent[a.evaluateeId].peers.push(a);
  });

  const entries = Object.entries(byStudent);

  // สรุปจำนวน
  const totalStudents = entries.length;
  const writtenCount = entries.filter(([sid]) =>
    summaries.find((s) => s.studentId === sid)
  ).length;
  const publishedCount = entries.filter(([sid]) =>
    summaries.find((s) => s.studentId === sid && s.isPublished)
  ).length;

  return (
    <>
      <article>
        <div className="grid">
          <label>
            รายวิชา
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              data-cy="select-review-course"
            >
              <option value="">— เลือก —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode}
                </option>
              ))}
            </select>
          </label>

          <label>
            แบบประเมิน
            <select
              value={roundId}
              onChange={(e) => {
                setRoundId(e.target.value);
                loadData(e.target.value, groupId);
              }}
              disabled={!courseId}
              data-cy="select-review-round"
            >
              <option value="">— เลือก —</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            กลุ่ม
            <select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                loadData(roundId, e.target.value);
              }}
              disabled={!courseId}
              data-cy="select-review-group"
            >
              <option value="">— เลือก —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="safety-hint">
          ข้อความดิบด้านล่างเห็นได้เฉพาะอาจารย์
          นักศึกษาจะเห็นเฉพาะข้อความที่คุณสรุปและกดเผยแพร่แล้วเท่านั้น
        </p>
        {msg && (
          <p className="status-toast">{msg}</p>
        )}
      </article>

      {loading && <article aria-busy="true">กำลังโหลด</article>}

      {!loading && roundId && groupId && entries.length === 0 && (
        <article className="empty-state">
          <span className="empty-state-icon">📋</span>
          <h4>ยังไม่มีใครส่งแบบประเมินในรอบนี้</h4>
          <p>กลับมาดูอีกครั้งเมื่อนักศึกษาเริ่มตอบแล้ว</p>
        </article>
      )}

      {/* แถบสรุป */}
      {!loading && entries.length > 0 && (
        <div className="review-summary-bar">
          <span>
            เขียนสรุปแล้ว <strong>{writtenCount}</strong> จาก{" "}
            <strong>{totalStudents}</strong> คน
          </span>
          <span className="muted">·</span>
          <span>
            เผยแพร่แล้ว <strong>{publishedCount}</strong> คน
          </span>
        </div>
      )}

      {/* Accordion — คลิกเปิดทีละคน */}
      {!loading &&
        entries.map(([studentId, group]) => {
          const { name, self, peers } = group;
          const existing = summaries.find((s) => s.studentId === studentId);

          const peerScores = peers.filter((p) => p.scoreValue !== null);
          const selfScores = self.filter((p) => p.scoreValue !== null);

          const peerAvg =
            peerScores.length > 0
              ? peerScores.reduce((sum, i) => sum + (i.scoreValue ?? 0), 0) /
                peerScores.length
              : null;
          const selfAvg =
            selfScores.length > 0
              ? selfScores.reduce((sum, i) => sum + (i.scoreValue ?? 0), 0) /
                selfScores.length
              : null;

          // ป้ายเตือน: เพื่อนให้คะแนนต่ำ หรือ ประเมินตนเองต่ำกว่าเพื่อนมาก
          const lowPeer = peerScores.some((p) => (p.scoreValue ?? 5) <= 2);
          const selfCritical =
            selfAvg !== null && peerAvg !== null && peerAvg - selfAvg >= 1.5;
          const flagged = lowPeer || selfCritical;

          const isOpen = openId === studentId;

          // สถานะ badge — ต้องมีเสมอทั้ง 3 กรณี ไม่ใช่ปล่อยว่างตอนยังไม่เขียนสรุป
          const statusBadge = !existing
            ? "badge-empty"
            : existing.isPublished
              ? "badge-published"
              : "badge-draft";
          const statusText = !existing
            ? "ยังไม่เขียนสรุป"
            : existing.isPublished
              ? "เผยแพร่แล้ว"
              : "ฉบับร่าง";

          return (
            <div key={studentId} data-cy={`review-${studentId}`}>
              {/* แถวกะทัดรัด — คลิกเปิด/ปิด */}
              <div
                className="review-student-row"
                data-open={isOpen}
                onClick={() => setOpenId(isOpen ? null : studentId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(isOpen ? null : studentId);
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className="review-student-name">{name}</span>
                  {flagged && (
                    <span className="badge badge-flag">
                      {selfCritical
                        ? "ประเมินตนเองต่ำผิดปกติ"
                        : "ควรเข้าไปดูแล"}
                    </span>
                  )}
                  <span className={`badge ${statusBadge}`}>
                    {statusText}
                  </span>
                </div>
                <div className="review-student-meta">
                  <span className="muted">
                    {peerAvg !== null
                      ? `เพื่อน ${peerAvg.toFixed(1)}`
                      : "ยังไม่มีเพื่อนประเมิน"}
                    {" · "}
                    {selfAvg !== null
                      ? `ตนเอง ${selfAvg.toFixed(1)}`
                      : "ยังไม่ประเมินตนเอง"}
                  </span>
                  <span className="muted">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Detail panel — แสดงเมื่อเปิด */}
              {isOpen && (
                <div className="review-detail">
                  <details style={{ marginBottom: "0.75rem" }} open>
                    <summary>ประเมินตนเอง ({self.length} ข้อ)</summary>
                    <AnswerList items={self} />
                  </details>

                  <details style={{ marginBottom: "0.75rem" }}>
                    <summary>ความเห็นจากเพื่อนร่วมทีม ({peers.length} ข้อ)</summary>
                    <AnswerList items={peers} />
                  </details>

                  <label style={{ marginTop: "0.75rem" }}>
                    สรุปข้อเสนอแนะเชิงสร้างสรรค์ถึงนักศึกษา
                    <textarea
                      rows={4}
                      value={drafts[studentId] ?? ""}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [studentId]: e.target.value }))
                      }
                      placeholder="เรียบเรียงใหม่ให้เป็นข้อเสนอแนะที่นำไปพัฒนาต่อได้ โดยไม่ระบุว่าใครเป็นผู้ให้ความเห็น"
                      data-cy={`summary-${studentId}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>

                  <div className="row-between">
                    <div>
                      <span className={`badge ${statusBadge}`}>
                        {statusText}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="secondary outline"
                        style={{ width: "auto" }}
                        onClick={(e) => { e.stopPropagation(); saveSummary(studentId, false); }}
                      >
                        บันทึกร่าง
                      </button>
                      {existing ? (
                        <button
                          style={{
                            width: "auto",
                            background: existing.isPublished
                              ? "var(--cr-muted)"
                              : "var(--cr-positive)",
                            borderColor: "transparent",
                          }}
                          onClick={(e) => { e.stopPropagation(); togglePublish(existing); }}
                          data-cy={`publish-${studentId}`}
                        >
                          {existing.isPublished ? "ยกเลิกเผยแพร่" : "เผยแพร่"}
                        </button>
                      ) : (
                        <button
                          style={{
                            width: "auto",
                            background: "var(--cr-positive)",
                            borderColor: "transparent",
                          }}
                          onClick={(e) => { e.stopPropagation(); saveSummary(studentId, true); }}
                          data-cy={`publish-${studentId}`}
                        >
                          บันทึกและเผยแพร่
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}

function AnswerList({ items }: { items: RawAnswer[] }) {
  if (items.length === 0) return <p className="safety-hint">ยังไม่มีคำตอบ</p>;

  return (
    <>
      {[...items]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((a) => (
          <div
            key={a.answerId}
            style={{
              borderLeft: "3px solid var(--cr-border)",
              paddingLeft: "1rem",
              marginBottom: "0.75rem",
            }}
          >
            <small className="muted">{a.questionContent}</small>
            <div>
              {a.questionType === "scale" ? (
                <strong>คะแนน {a.scoreValue}</strong>
              ) : (
                a.textValue
              )}
            </div>
          </div>
        ))}
    </>
  );
}