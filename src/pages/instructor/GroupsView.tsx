import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import { toggleInArray, type Notice } from "../../lib/utils";
import type { ApiResponse, Course, Group, User } from "../../types";

export default function GroupsView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<Course[]>>("/courses"),
      api.get<ApiResponse<User[]>>("/users"),
    ])
      .then(([c, u]) => {
        setCourses(c.data.data);
        setStudents(u.data.data.filter((x) => x.role === "student"));
      })
      .catch((err) => setNotice({ text: getErrorMessage(err), ok: false }));
  }, []);

  useEffect(() => {
    if (!courseId) {
      setGroups([]);
      return;
    }
    api
      .get<ApiResponse<Group[]>>(`/groups?courseId=${courseId}`)
      .then((res) => setGroups(res.data.data))
      .catch((err) => setNotice({ text: getErrorMessage(err), ok: false }));
  }, [courseId]);

  function toggle(id: string) {
    setMemberIds((p) => toggleInArray(p, id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !name) {
      setNotice({ text: "เลือกรายวิชาและตั้งชื่อกลุ่ม", ok: false });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      await api.post("/groups", {
        name,
        courseId,
        section: section || null,
        memberIds,
      });
      setName("");
      setSection("");
      setMemberIds([]);
      setNotice({ text: "สร้างกลุ่มเรียบร้อย", ok: true });
      const res = await api.get<ApiResponse<Group[]>>(
        `/groups?courseId=${courseId}`
      );
      setGroups(res.data.data);
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <article>
        <h4>สร้างกลุ่มงาน</h4>
        <form onSubmit={handleSubmit}>
          <label>
            รายวิชา
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              data-cy="select-course"
            >
              <option value="">— เลือกรายวิชา —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} · {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid">
            <label>
              ชื่อกลุ่ม
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-cy="input-group-name"
              />
            </label>
            <label>
              กลุ่มเรียน (ถ้ามี)
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="001"
              />
            </label>
          </div>

          <fieldset>
            <legend>เลือกสมาชิก</legend>
            {students.map((s) => (
              <label key={s.id} style={{ fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={memberIds.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                {s.name} <span className="muted">({s.username})</span>
              </label>
            ))}
          </fieldset>

          {notice && (
            <p
              className="status-toast"
              data-variant={notice.ok ? "success" : undefined}
            >
              {notice.text}
            </p>
          )}
          <button type="submit" aria-busy={sending} data-cy="submit-group">
            สร้างกลุ่ม
          </button>
        </form>
      </article>

      <article>
        <h4>กลุ่มในวิชานี้</h4>
        {groups.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👥</span>
            <h4>เลือกรายวิชาเพื่อดูกลุ่ม</h4>
            <p>เลือกรายวิชาด้านบนเพื่อแสดงกลุ่มที่สร้างไว้แล้ว</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.id} style={{ marginBottom: "1.25rem" }}>
              <strong>{g.name}</strong>{" "}
              <span className="muted">{g.section && `· ${g.section}`}</span>
              <div style={{ marginTop: "0.5rem" }}>
                {g.members.length === 0 ? (
                  <span className="safety-hint">ยังไม่มีสมาชิก</span>
                ) : (
                  g.members.map((m) => (
                    <span key={m.id} className="member-chip">
                      {m.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </article>
    </>
  );
}