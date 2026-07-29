import { useCallback, useEffect, useState } from "react";
import { Navigate, useMatch, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import EvaluationWizard from "../EvaluationWizard";
import type {
  ApiResponse,
  Course,
  Group,
  Progress,
  Round,
  User,
} from "../../types";

/** แท็บ "แบบประเมิน" ฝั่งนักศึกษา — ชื่อมี Student นำหน้ากันสับสนกับ instructor/RoundsView */
export default function StudentRoundsView({
  course,
  user,
}: {
  course: Course;
  user: User;
}) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 3d) progress ของแต่ละรอบ: roundId → Progress[]
  const [progressMap, setProgressMap] = useState<Record<string, Progress[]>>({});
  const navigate = useNavigate();
  const roundMatch = useMatch("/course/:courseId/round/:roundId");
  const activeRoundId = roundMatch?.params.roundId;

  const loadProgress = useCallback(async (rnds: Round[], grp: Group) => {
    const results = await Promise.all(
      rnds.map(async (round) => {
        try {
          const res = await api.get<ApiResponse<Progress[]>>(
            `/answers/progress?roundId=${round.id}&groupId=${grp.id}`
          );
          return [round.id, res.data.data] as const;
        } catch {
          return [round.id, [] as Progress[]] as const;
        }
      })
    );
    const map: Record<string, Progress[]> = {};
    results.forEach(([id, prog]) => {
      map[id] = prog;
    });
    setProgressMap(map);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<Round[]>>(`/rounds?courseId=${course.id}`),
      api.get<ApiResponse<Group | null>>(`/groups/my?courseId=${course.id}`),
    ])
      .then(async ([r, g]) => {
        setRounds(r.data.data);
        setGroup(g.data.data);
        if (g.data.data) await loadProgress(r.data.data, g.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [course.id, loadProgress]);

  if (loading) return <article aria-busy="true">กำลังโหลด</article>;
  if (error) return <article className="status-toast">{error}</article>;

  // ทำแบบประเมิน — เปิดจาก URL /course/:id/round/:roundId
  if (activeRoundId) {
    const round = rounds.find((r) => r.id === activeRoundId);
    if (group && round)
      return (
        <EvaluationWizard
          round={round}
          group={group}
          user={user}
          onExit={() => {
            navigate(`/course/${course.id}`);
            // รีโหลด progress เมื่อกลับจาก wizard
            loadProgress(rounds, group);
          }}
        />
      );
    // ไม่มีกลุ่ม / หา round ไม่เจอ (id ผิด) → กลับหน้ารายการ
    return <Navigate to={`/course/${course.id}`} replace />;
  }

  if (!group)
    return (
      <article className="empty-state">
        <span className="empty-state-icon">👥</span>
        <h4>ยังไม่ได้เข้ากลุ่ม</h4>
        <p>
          คุณยังไม่ถูกจัดเข้ากลุ่มในวิชานี้ จึงยังเริ่มประเมินไม่ได้
          ติดต่ออาจารย์ผู้สอนเพื่อเข้ากลุ่ม
        </p>
      </article>
    );

  // คำนวณจำนวน target (ตนเอง + เพื่อน)
  const targetCount = group.members.length;

  return (
    <>
      <article>
        <strong>{group.name}</strong>
        <div style={{ marginTop: "0.5rem" }}>
          {group.members.map((m) => (
            <span key={m.id} className="member-chip">
              {m.name}
            </span>
          ))}
        </div>
      </article>

      {rounds.length === 0 ? (
        <article className="empty-state">
          <span className="empty-state-icon">📋</span>
          <h4 data-cy="no-round">ยังไม่มีแบบประเมินที่เปิดอยู่</h4>
          <p>
            อาจารย์จะเปิดแบบประเมินตามช่วงเวลาที่กำหนด
            กลับมาดูอีกครั้งเมื่อถึงช่วงประเมิน
          </p>
        </article>
      ) : (
        rounds.map((r) => {
          const prog = progressMap[r.id] ?? [];
          const completedCount = prog.filter((p) => p.completed).length;
          const allDone = completedCount >= targetCount && targetCount > 0;
          const started = completedCount > 0;

          return (
            <article key={r.id} data-cy={`round-${r.id}`}>
              <div className="row-between">
                <div>
                  <strong>{r.name}</strong>
                  {allDone && (
                    <>
                      {" "}
                      <span className="badge badge-published">ส่งแล้ว</span>
                    </>
                  )}
                  {r.description && (
                    <p className="safety-hint" style={{ margin: "0.25rem 0 0" }}>
                      {r.description}
                    </p>
                  )}
                </div>
                <button
                  style={{ width: "auto" }}
                  className={allDone ? "secondary outline" : undefined}
                  onClick={() => navigate(`/course/${course.id}/round/${r.id}`)}
                  data-cy={`enter-round-${r.id}`}
                >
                  {allDone
                    ? "ดู/แก้ไขคำตอบ"
                    : started
                      ? `ทำต่อ (${completedCount}/${targetCount})`
                      : "เริ่มประเมิน"}
                </button>
              </div>
            </article>
          );
        })
      )}
    </>
  );
}
