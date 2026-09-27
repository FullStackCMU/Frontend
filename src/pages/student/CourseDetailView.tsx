import { useEffect, useState } from "react";
import { Navigate, NavLink, useMatch, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import StudentRoundsView from "./StudentRoundsView";
import FeedbackView from "./FeedbackView";
import type { ApiResponse, Course, Me } from "../../types";

/**
 * (หน้าเดิม — Pico) หน้าในรายวิชาของนักศึกษา สลับแท็บจาก URL
 * - /courses/:courseId                   → แท็บแบบประเมิน
 * - /courses/:courseId/round/:roundId    → ทำแบบประเมิน
 * - /courses/:courseId/feedback          → แท็บฟีดแบ็ก
 */
export default function CourseDetailView({ me }: { me: Me }) {
  const { courseId } = useParams();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState("");
  const isFeedback = useMatch("/courses/:courseId/feedback") !== null;

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses")
      .then((res) => setCourses(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <article className="status-toast">{error}</article>;
  if (!courses) return <article aria-busy="true">กำลังโหลด</article>;

  const course = courses.find((c) => c.id === courseId);
  // ไม่ได้ลงทะเบียน / id ผิด → กลับหน้ารายวิชา
  if (!course) return <Navigate to="/courses" replace />;

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "secondary" : "secondary outline";

  return (
    <>
      <h3 className="page-heading">{course.title}</h3>
      <p className="page-description">{course.courseCode}</p>

      <nav aria-label="แท็บรายวิชา" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <NavLink to={`/courses/${course.id}`} end role="button" className={tabClass}>
          แบบประเมิน
        </NavLink>
        <NavLink to={`/courses/${course.id}/feedback`} role="button" className={tabClass}>
          ฟีดแบ็ก
        </NavLink>
      </nav>

      {isFeedback ? (
        <FeedbackView courseId={course.id} />
      ) : (
        <StudentRoundsView course={course} me={me} />
      )}
    </>
  );
}
