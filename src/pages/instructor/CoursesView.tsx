import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import { toggleInArray, type Notice } from "../../lib/utils";
import type { ApiResponse, Course, User } from "../../types";

export default function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [courseCode, setCourseCode] = useState("");
  const [name, setName] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sending, setSending] = useState(false);

  async function load() {
    const [c, u] = await Promise.all([
      api.get<ApiResponse<Course[]>>("/courses"),
      api.get<ApiResponse<User[]>>("/users"),
    ]);
    setCourses(c.data.data);
    setStudents(u.data.data.filter((x) => x.role === "student"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseCode || !name) return;
    setSending(true);
    setNotice(null);
    try {
      await api.post("/courses", { courseCode, name });
      setCourseCode("");
      setName("");
      setNotice({ text: "สร้างรายวิชาเรียบร้อย", ok: true });
      await load();
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    } finally {
      setSending(false);
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollCourseId || userIds.length === 0) {
      setNotice({ text: "เลือกวิชาและนักศึกษาอย่างน้อย 1 คน", ok: false });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      await api.post(`/courses/${enrollCourseId}/enroll`, { userIds });
      setUserIds([]);
      setNotice({ text: "ลงทะเบียนเรียบร้อย", ok: true });
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    } finally {
      setSending(false);
    }
  }

  function toggle(id: string) {
    setUserIds((p) => toggleInArray(p, id));
  }

  return (
    <>
      <article>
        <h4>สร้างรายวิชาใหม่</h4>
        <form onSubmit={handleCreate}>
          <div className="grid">
            <label>
              รหัสวิชา
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="261497"
                data-cy="input-course-code"
              />
            </label>
            <label>
              ชื่อวิชา
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fullstack Development"
                data-cy="input-course-name"
              />
            </label>
          </div>
          <button type="submit" aria-busy={sending} data-cy="submit-course">
            สร้างรายวิชา
          </button>
        </form>
      </article>

      <article>
        <h4>ลงทะเบียนนักศึกษาเข้าวิชา</h4>
        <form onSubmit={handleEnroll}>
          <label>
            รายวิชา
            <select
              value={enrollCourseId}
              onChange={(e) => setEnrollCourseId(e.target.value)}
              data-cy="select-enroll-course"
            >
              <option value="">— เลือกรายวิชา —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} · {c.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>นักศึกษา</legend>
            {students.map((s) => (
              <label key={s.id} style={{ fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={userIds.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                {s.name} <span className="muted">({s.username})</span>
              </label>
            ))}
          </fieldset>

          <button type="submit" aria-busy={sending} data-cy="submit-enroll">
            ลงทะเบียน
          </button>
        </form>
        {notice && (
          <p
            className="status-toast"
            data-variant={notice.ok ? "success" : undefined}
          >
            {notice.text}
          </p>
        )}
      </article>

      <article>
        <h4>รายวิชาทั้งหมด</h4>
        <table>
          <thead>
            <tr>
              <th>รหัสวิชา</th>
              <th>ชื่อวิชา</th>
            </tr>
          </thead>
          <tbody data-cy="course-list">
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.courseCode}</td>
                <td>{c.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}