import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import Icon from "../../components/Icon";
import { EmptyCoursesArt } from "../../components/illustrations";
import type { ApiResponse, Course, Me } from "../../types";

/**
 * (หน้าเดิม — Pico) รายวิชาที่ลงทะเบียน ใช้ชั่วคราวกับเมนู แบบประเมิน / วิชาของฉัน / ฟีดแบ็ก
 * จนกว่าจะย้ายเป็นหน้าตาม design-ref (ขั้น 4) — linkTo บอกว่าคลิกวิชาแล้วไปหน้าไหน
 */
export default function CourseListView({
  me,
  subtitle,
  linkTo,
}: {
  me: Me;
  subtitle: string;
  linkTo: (courseId: string) => string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses/my")
      .then((res) => setCourses(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="student-hero">
        <h2 className="student-hero-title">
          สวัสดี, {me.firstnameTh ?? me.firstnameEn ?? ""} 👋
        </h2>
        <p className="student-hero-sub">{subtitle}</p>
      </div>

      {loading && <article aria-busy="true">กำลังโหลดรายวิชา</article>}
      {!loading && error && <article className="status-toast">{error}</article>}

      {!loading && !error && courses.length === 0 && (
        <article className="empty-state">
          <div className="empty-state-art">
            <EmptyCoursesArt />
          </div>
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
              onClick={() => navigate(linkTo(c.id))}
              data-cy={`course-${c.id}`}
            >
              <div className="course-card-code">{c.courseCode}</div>
              <div className="course-card-name">{c.name}</div>
              <div className="course-card-arrow">
                <Icon name="arrow-right" size={18} />
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
