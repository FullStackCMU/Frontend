import { useMatch, useNavigate } from "react-router-dom";
import AppShell from "../../components/AppShell";
import StudentRoundsView from "./StudentRoundsView";
import FeedbackView from "./FeedbackView";
import type { Course, User } from "../../types";

/**
 * หน้าในรายวิชาของนักศึกษา — sidebar layout สลับแท็บจาก URL
 * - /course/:id           → แท็บแบบประเมิน
 * - /course/:id/feedback   → แท็บฟีดแบ็ก
 */
export default function CourseDetailView({
  course,
  user,
  onLogout,
}: {
  course: Course;
  user: User;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const active = useMatch("/course/:courseId/feedback") ? "feedback" : "rounds";

  const sidebarSlot = (
    <>
      <div className="sidebar-section">รายวิชา</div>
      <div style={{ padding: "0 0.75rem", marginBottom: "0.5rem" }}>
        <strong style={{ fontSize: "0.92rem" }}>{course.courseCode}</strong>
        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", marginTop: "0.15rem" }}>
          {course.name}
        </div>
      </div>
      <button className="sidebar-back-btn" onClick={() => navigate("/")}>
        ← เปลี่ยนรายวิชา
      </button>
    </>
  );

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      nav={[
        { key: "rounds", label: "แบบประเมิน" },
        { key: "feedback", label: "ฟีดแบ็กจากอาจารย์" },
      ]}
      active={active}
      onNavigate={(key) =>
        navigate(
          key === "feedback"
            ? `/course/${course.id}/feedback`
            : `/course/${course.id}`
        )
      }
      slot={sidebarSlot}
    >
      <h3 className="page-heading">{course.name}</h3>
      <p className="page-description">{course.courseCode} — ดูแบบประเมินและฟีดแบ็กจากอาจารย์</p>

      {active === "rounds" ? (
        <StudentRoundsView course={course} user={user} />
      ) : (
        <FeedbackView courseId={course.id} />
      )}
    </AppShell>
  );
}
