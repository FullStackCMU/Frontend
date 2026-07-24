import { useState } from "react";
import AppShell from "../../components/AppShell";
import StudentRoundsView from "./StudentRoundsView";
import FeedbackView from "./FeedbackView";
import type { Course, User } from "../../types";

/** หน้าในรายวิชาของนักศึกษา — sidebar layout สลับแท็บ แบบประเมิน / ฟีดแบ็ก */
export default function CourseDetailView({
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
        { key: "rounds", label: "แบบประเมิน" },
        { key: "feedback", label: "ฟีดแบ็กจากอาจารย์" },
      ]}
      active={active}
      onNavigate={setActive}
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
