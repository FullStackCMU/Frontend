import { useEffect, useState } from "react";
import dayjs from "dayjs";
import AppShell from "../components/AppShell";
import { api, getErrorMessage } from "../lib/api";
import EvaluationWizard from "./EvaluationWizard";
import type {
  ApiResponse,
  Course,
  FeedbackSummary,
  Group,
  Progress,
  Round,
  User,
} from "../types";

export default function StudentDashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses/my")
      .then((res) => setCourses(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // ── Course detail view ──
  if (selectedCourse) {
    return (
      <CourseDetailView
        course={selectedCourse}
        user={user}
        onBack={() => setSelectedCourse(null)}
        onLogout={onLogout}
      />
    );
  }

  // ── Course selection view ──
  return (
    <div className="student-page">
      {/* Top bar */}
      <header className="student-topbar">
        <div className="student-topbar-brand">
          <div className="student-topbar-logo">CollabReflect</div>
          <span className="student-topbar-tagline">
            พื้นที่ปลอดภัยสำหรับสะท้อนการทำงานเป็นทีม
          </span>
        </div>
        <div className="student-topbar-right">
          <div className="student-topbar-user">
            <strong>{user.name}</strong>
            <span>นักศึกษา</span>
          </div>
          <button
            className="student-topbar-logout"
            onClick={onLogout}
            data-cy="logout"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="student-content">
        <div className="student-hero">
          <h2 className="student-hero-title">
            สวัสดี, {user.name.split(" ")[0]} 👋
          </h2>
          <p className="student-hero-sub">
            เลือกรายวิชาเพื่อเริ่มประเมินเพื่อนร่วมทีมหรือดูฟีดแบ็ก
          </p>
        </div>

        {loading && <article aria-busy="true">กำลังโหลดรายวิชา</article>}
        {!loading && error && <article className="status-toast">{error}</article>}

        {!loading && !error && courses.length === 0 && (
          <article className="empty-state">
            <span className="empty-state-icon">📚</span>
            <h4>ยังไม่ได้ลงทะเบียนวิชาใด</h4>
            <p>
              ติดต่ออาจารย์ผู้สอนเพื่อลงทะเบียนเข้าสู่รายวิชา
              จากนั้นรายวิชาจะแสดงที่หน้านี้โดยอัตโนมัติ
            </p>
          </article>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="course-grid">
            {courses.map((c) => (
              <button
                key={c.id}
                className="course-card"
                onClick={() => setSelectedCourse(c)}
                data-cy={`course-${c.id}`}
              >
                <div className="course-card-code">{c.courseCode}</div>
                <div className="course-card-name">{c.name}</div>
                <div className="course-card-arrow">→</div>
              </button>
            ))}
          </div>
        )}

        <footer className="safety-hint" style={{ paddingTop: "3rem" }}>
          ความคิดเห็นทุกข้อจะผ่านการพิจารณาของอาจารย์ก่อนเผยแพร่เสมอ
        </footer>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Course detail — sidebar layout with rounds / feedback nav
// ─────────────────────────────────────────────────

function CourseDetailView({
  course,
  user,
  onBack,
  onLogout,
}: {
  course: Course;
  user: User;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [active, setActive] = useState("rounds");

  const sidebarSlot = (
    <>
      <div className="sidebar-section">รายวิชา</div>
      <div style={{ padding: "0 0.75rem", marginBottom: "0.5rem" }}>
        <strong style={{ fontSize: "0.92rem" }}>{course.courseCode}</strong>
        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", marginTop: "0.15rem" }}>
          {course.name}
        </div>
      </div>
      <button className="sidebar-back-btn" onClick={onBack}>
        ← เปลี่ยนรายวิชา
      </button>
    </>
  );

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      nav={[
        { key: "rounds", label: "รอบประเมิน" },
        { key: "feedback", label: "ฟีดแบ็กจากอาจารย์" },
      ]}
      active={active}
      onNavigate={setActive}
      slot={sidebarSlot}
    >
      <h3 className="page-heading">{course.name}</h3>
      <p className="page-description">{course.courseCode} — ดูรอบประเมินและฟีดแบ็กจากอาจารย์</p>

      {active === "rounds" ? (
        <RoundsView course={course} user={user} />
      ) : (
        <FeedbackView courseId={course.id} />
      )}
    </AppShell>
  );
}

// ─────────────────────────────────────────────────
// Rounds tab
// ─────────────────────────────────────────────────

function RoundsView({ course, user }: { course: Course; user: User }) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 3d) progress ของแต่ละรอบ: roundId → Progress[]
  const [progressMap, setProgressMap] = useState<Record<string, Progress[]>>({});

  useEffect(() => {
    setLoading(true);
    setActiveRound(null);
    Promise.all([
      api.get<ApiResponse<Round[]>>(`/rounds?courseId=${course.id}`),
      api.get<ApiResponse<Group | null>>(`/groups/my?courseId=${course.id}`),
    ])
      .then(async ([r, g]) => {
        setRounds(r.data.data);
        setGroup(g.data.data);
        // โหลด progress ของทุกรอบ (ถ้ามี group)
        if (g.data.data) {
          const map: Record<string, Progress[]> = {};
          await Promise.all(
            r.data.data.map(async (round) => {
              try {
                const res = await api.get<ApiResponse<Progress[]>>(
                  `/answers/progress?roundId=${round.id}&groupId=${g.data.data!.id}`
                );
                map[round.id] = res.data.data;
              } catch {
                map[round.id] = [];
              }
            })
          );
          setProgressMap(map);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [course.id]);

  if (loading) return <article aria-busy="true">กำลังโหลด</article>;
  if (error) return <article className="status-toast">{error}</article>;

  if (activeRound && group)
    return (
      <EvaluationWizard
        round={activeRound}
        group={group}
        user={user}
        onExit={() => {
          setActiveRound(null);
          // รีโหลด progress เมื่อกลับจาก wizard
          if (group) {
            Promise.all(
              rounds.map(async (round) => {
                try {
                  const res = await api.get<ApiResponse<Progress[]>>(
                    `/answers/progress?roundId=${round.id}&groupId=${group.id}`
                  );
                  return [round.id, res.data.data] as const;
                } catch {
                  return [round.id, []] as const;
                }
              })
            ).then((results) => {
              const map: Record<string, Progress[]> = {};
              results.forEach(([id, prog]) => { map[id] = prog; });
              setProgressMap(map);
            });
          }
        }}
      />
    );

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
          <h4 data-cy="no-round">ยังไม่มีรอบประเมินที่เปิดอยู่</h4>
          <p>
            อาจารย์จะเปิดรอบประเมินตามช่วงเวลาที่กำหนด
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
                  onClick={() => setActiveRound(r)}
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

// ─────────────────────────────────────────────────
// Feedback tab
// ─────────────────────────────────────────────────

function FeedbackView({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<FeedbackSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<ApiResponse<FeedbackSummary[]>>("/feedback/me")
      .then((res) =>
        setItems(res.data.data.filter((f) => f.courseId === courseId)),
      )
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <article aria-busy="true">กำลังโหลดฟีดแบ็ก</article>;

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
            <strong>{f.roundName ?? "รอบประเมิน"}</strong>
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