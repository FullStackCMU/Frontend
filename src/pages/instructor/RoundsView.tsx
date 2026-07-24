import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import { type Notice } from "../../lib/utils";
import type {
  ApiResponse,
  Course,
  Question,
  QuestionType,
  Round,
} from "../../types";

export default function RoundsView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selected, setSelected] = useState<Round | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses")
      .then((res) => setCourses(res.data.data))
      .catch((err) => setNotice({ text: getErrorMessage(err), ok: false }));
  }, []);

  async function loadRounds(id: string) {
    if (!id) {
      setRounds([]);
      return;
    }
    try {
      const res = await api.get<ApiResponse<Round[]>>(`/rounds?courseId=${id}`);
      setRounds(res.data.data);
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    }
  }

  useEffect(() => {
    loadRounds(courseId);
    setSelected(null);
  }, [courseId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !name) {
      setNotice({ text: "เลือกรายวิชาและตั้งชื่อรอบ", ok: false });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      await api.post("/rounds", {
        courseId,
        name,
        description: description || null,
        isOpen: false,
      });
      setName("");
      setDescription("");
      setNotice({
        text: "สร้างรอบเรียบร้อย (ยังไม่เปิดให้นักศึกษาเห็น)",
        ok: true,
      });
      await loadRounds(courseId);
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    } finally {
      setSending(false);
    }
  }

  async function toggleOpen(r: Round) {
    try {
      await api.patch(`/rounds/${r.id}/open`, { isOpen: !r.isOpen });
      await loadRounds(courseId);
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    }
  }

  return (
    <>
      <article>
        <label>
          รายวิชา
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            data-cy="select-round-course"
          >
            <option value="">— เลือกรายวิชา —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} · {c.name}
              </option>
            ))}
          </select>
        </label>
      </article>

      {courseId && (
        <article>
          <h4>สร้างแบบประเมิน</h4>
          <form onSubmit={handleCreate}>
            <label>
              ชื่อแบบประเมิน
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ประเมินกลางเทอม"
                data-cy="input-round-name"
              />
            </label>
            <label>
              คำอธิบาย (ถ้ามี)
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            {notice && (
              <p
                className="status-toast"
                data-variant={notice.ok ? "success" : undefined}
              >
                {notice.text}
              </p>
            )}
            <button type="submit" aria-busy={sending} data-cy="submit-round">
              สร้างรอบ
            </button>
          </form>
          <p className="safety-hint">
            รอบที่สร้างจะยังไม่เปิด นักศึกษาจะเห็นก็ต่อเมื่อกดเปิดรอบแล้ว
            จึงเตรียมคำถามไว้ล่วงหน้าทั้งเทอมได้
          </p>
        </article>
      )}

      {rounds.map((r) => (
        <article key={r.id} data-cy={`round-${r.id}`}>
          <div className="row-between">
            <div>
              <strong>{r.name}</strong>{" "}
              <span className={`badge ${r.isOpen ? "badge-published" : "badge-draft"}`}>
                {r.isOpen ? "เปิดอยู่" : "ปิดอยู่"}
              </span>
              {r.description && (
                <p className="safety-hint" style={{ margin: "0.25rem 0 0" }}>
                  {r.description}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="secondary outline"
                style={{ width: "auto" }}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                data-cy={`manage-questions-${r.id}`}
              >
                จัดการคำถาม
              </button>
              <button
                style={{
                  width: "auto",
                  background: r.isOpen ? "var(--cr-muted)" : "var(--cr-positive)",
                  borderColor: "transparent",
                }}
                onClick={() => toggleOpen(r)}
                data-cy={`toggle-round-${r.id}`}
              >
                {r.isOpen ? "ปิดรอบ" : "เปิดรอบ"}
              </button>
            </div>
          </div>

          {selected?.id === r.id && <QuestionManager round={r} />}
        </article>
      ))}
    </>
  );
}

function QuestionManager({ round }: { round: Round }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState<QuestionType>("scale");
  const [notice, setNotice] = useState<Notice | null>(null);

  async function load() {
    try {
      const res = await api.get<ApiResponse<Question[]>>(
        `/rounds/${round.id}/questions`
      );
      setQuestions(res.data.data);
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setNotice(null);
    try {
      await api.post(`/rounds/${round.id}/questions`, {
        content,
        type,
        sortOrder: questions.length + 1,
      });
      setContent("");
      await load();
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/rounds/questions/${id}`);
      await load();
    } catch (err) {
      setNotice({ text: getErrorMessage(err), ok: false });
    }
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h5>คำถามในรอบนี้</h5>

      {questions.length === 0 && (
        <p className="safety-hint">ยังไม่มีคำถาม เพิ่มคำถามด้านล่างได้เลย</p>
      )}

      <ol data-cy="question-list">
        {questions.map((q) => (
          <li key={q.id} style={{ marginBottom: "0.5rem" }}>
            <div className="row-between">
              <span>
                {q.content}{" "}
                <span className="badge badge-draft">
                  {q.type === "scale" ? "คะแนน 1-5" : "เขียนตอบ"}
                </span>
              </span>
              <button
                className="secondary outline"
                style={{ width: "auto", padding: "0.2rem 0.75rem" }}
                onClick={() => handleDelete(q.id)}
                data-cy={`delete-question-${q.id}`}
              >
                ลบ
              </button>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={handleAdd}>
        <label>
          คำถามใหม่
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="เช่น การสื่อสารกับเพื่อนร่วมทีม"
            data-cy="input-question"
          />
        </label>
        <label>
          ประเภทคำถาม
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            data-cy="select-question-type"
          >
            <option value="scale">เลือกคะแนน 1-5</option>
            <option value="text">เขียนตอบ</option>
          </select>
        </label>
        {notice && <p className="status-toast">{notice.text}</p>}
        <button type="submit" data-cy="submit-question">
          เพิ่มคำถาม
        </button>
      </form>
    </div>
  );
}