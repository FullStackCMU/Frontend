import { useEffect, useState } from "react";
import { Navigate, useMatch, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";
import CourseDetailView from "./student/CourseDetailView";
import type { ApiResponse, Course, User } from "../types";

/**
 * ฝั่งนักศึกษา
 * - "/"            → เลือกรายวิชา (grid)
 * - "/course/:id"  → ส่งต่อให้ CourseDetailView (แท็บแบบประเมิน/ฟีดแบ็ก)
 */
export default function StudentDashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const courseMatch = useMatch("/course/:courseId/*");
  const courseId = courseMatch?.params.courseId;

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses/my")
      .then((res) => setCourses(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // อยู่ที่ /course/:id → แสดงหน้าในรายวิชา
  if (courseId) {
    if (loading) return <article aria-busy="true">กำลังโหลด</article>;
    const course = courses.find((c) => c.id === courseId);
    // ไม่ได้ลงทะเบียน/id ผิด → กลับหน้าเลือกวิชา
    if (!course) return <Navigate to="/" replace />;
    return <CourseDetailView course={course} user={user} onLogout={onLogout} />;
  }

  // หน้าเลือกรายวิชา (path "/")
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
                onClick={() => navigate(`/course/${c.id}`)}
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
