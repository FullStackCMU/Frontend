import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import type {
  Answer,
  ApiResponse,
  Group,
  Progress,
  Question,
  Round,
  User,
} from "../types";

type Draft = Record<string, { scoreValue?: number; textValue?: string }>;

export default function EvaluationWizard({
  round,
  group,
  user,
  onExit,
}: {
  round: Round;
  group: Group;
  user: User;
  onExit: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // ลำดับ: ตนเองก่อน แล้วตามด้วยเพื่อนตามลำดับสมาชิก
  const targets = [
    { id: user.id, name: user.name, isSelf: true },
    ...group.members
      .filter((m) => m.id !== user.id)
      .map((m) => ({ id: m.id, name: m.name, isSelf: false })),
  ];

  const current = targets[step];
  const done = step >= targets.length;

  const loadProgress = useCallback(async () => {
    const res = await api.get<ApiResponse<Progress[]>>(
      `/answers/progress?roundId=${round.id}&groupId=${group.id}`
    );
    setProgress(res.data.data);
    return res.data.data;
  }, [round.id, group.id]);

  useEffect(() => {
    async function init() {
      try {
        const res = await api.get<ApiResponse<Question[]>>(
          `/rounds/${round.id}/questions`
        );
        setQuestions(res.data.data);
        const prog = await loadProgress();

        // 3a) ข้ามไปคนแรกที่ยังไม่ completed
        const firstIncomplete = targets.findIndex(
          (t) => !prog.find((p) => p.evaluateeId === t.id)?.completed
        );
        setStep(firstIncomplete === -1 ? targets.length : firstIncomplete);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [round.id, loadProgress]);

  // โหลดคำตอบเดิมของคนที่กำลังประเมินอยู่ (ถ้าเคยตอบไว้)
  useEffect(() => {
    if (!current) return;
    setError("");
    api
      .get<ApiResponse<Answer[]>>(
        `/answers/mine?roundId=${round.id}&evaluateeId=${current.id}`
      )
      .then((res) => {
        const d: Draft = {};
        res.data.data.forEach((a) => {
          d[a.questionId] = {
            scoreValue: a.scoreValue ?? undefined,
            textValue: a.textValue ?? undefined,
          };
        });
        setDraft(d);
      })
      .catch(() => setDraft({}));
  }, [current?.id, round.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;

    const missing = questions.find((q) => {
      const d = draft[q.id];
      if (q.type === "scale") return !d?.scoreValue;
      return !d?.textValue?.trim();
    });
    if (missing) {
      setError(`กรุณาตอบข้อ "${missing.content}" ให้ครบก่อน`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.post("/answers", {
        roundId: round.id,
        groupId: group.id,
        evaluateeId: current.id,
        answers: questions.map((q) => ({
          questionId: q.id,
          scoreValue: draft[q.id]?.scoreValue,
          textValue: draft[q.id]?.textValue,
        })),
      });
      await loadProgress();
      setDraft({});

      // 3c) แสดง flash "บันทึกแล้ว" ก่อนไปคนถัดไป
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ─── นับจำนวนที่ทำแล้ว ───
  const completedCount = targets.filter((t) =>
    progress.find((p) => p.evaluateeId === t.id)?.completed
  ).length;

  if (loading) return <article aria-busy="true">กำลังเตรียมแบบประเมิน</article>;

  if (questions.length === 0)
    return (
      <div className="wizard-container">
        <button className="back-link" onClick={onExit}>
          ← กลับ
        </button>
        <article className="empty-state">
          <span className="empty-state-icon">📝</span>
          <h4>ยังไม่มีคำถามในรอบนี้</h4>
          <p className="safety-hint">
            กรุณาติดต่ออาจารย์ผู้สอนเพื่อเพิ่มคำถามก่อนเริ่มประเมิน
          </p>
        </article>
      </div>
    );

  // 3b) ถ้าประเมินครบทุกคน + ไม่ได้อยู่ใน edit mode
  if (done && !editMode)
    return (
      <div className="wizard-container">
        <article className="wizard-done-card">
          <span className="wizard-done-icon">✦</span>
          <h4>ส่งแบบประเมินครบทุกคนแล้ว</h4>
          <p className="safety-hint">
            ขอบคุณที่ให้ความเห็นอย่างตั้งใจ
            ความคิดเห็นของคุณจะถูกส่งให้อาจารย์พิจารณาและสรุปก่อนเผยแพร่
            เพื่อนร่วมทีมจะไม่เห็นข้อความของคุณโดยตรง
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="secondary outline"
              style={{ width: "auto" }}
              onClick={() => { setStep(0); setEditMode(true); }}
              data-cy="wizard-edit"
            >
              แก้ไขคำตอบ
            </button>
            <button style={{ width: "auto" }} onClick={onExit} data-cy="wizard-done">
              กลับไปหน้ารอบประเมิน
            </button>
          </div>
        </article>
      </div>
    );

  return (
    <div className="wizard-container">
      <button className="back-link" onClick={onExit}>
        ← ออกจากแบบประเมิน (คำตอบที่ส่งแล้วถูกบันทึกไว้)
      </button>

      {/* ข้อ 2: ถ้ากลุ่มใหญ่กว่า 5 → แถบ progress แทน pill */}
      {targets.length > 5 ? (
        <div className="step-progress-wrap">
          <div className="step-progress">
            <div
              className="step-progress-fill"
              style={{ width: `${((step + 1) / targets.length) * 100}%` }}
            />
          </div>
          <span className="step-progress-label">
            ขั้นที่ {step + 1} จาก {targets.length}
          </span>
        </div>
      ) : (
        <div className="step-bar">
          {targets.map((t, i) => {
            const p = progress.find((x) => x.evaluateeId === t.id);
            const state =
              i === step ? "current" : p?.completed ? "done" : "pending";
            return (
              <div key={t.id} className="step-pill" data-state={state}>
                {t.isSelf ? "ตนเอง" : t.name}
              </div>
            );
          })}
        </div>
      )}

      {/* 3c) flash บันทึกสำเร็จ */}
      {saved && (
        <p className="status-toast" data-variant="success">
          ✓ บันทึกคำตอบสำหรับ {current?.isSelf ? "ตนเอง" : current?.name} เรียบร้อยแล้ว
        </p>
      )}

      <article>
        <hgroup>
          <h4 style={{ marginBottom: "0.25rem" }}>
            {current.isSelf
              ? "ประเมินตนเอง"
              : `ประเมิน ${current.name}`}{" "}
            {current.isSelf && <span className="badge self-tag">ขั้นแรก</span>}
          </h4>
          <p className="muted">
            {round.name} · ขั้นที่ {step + 1} จาก {targets.length}
            {editMode && " · โหมดแก้ไข"}
          </p>
        </hgroup>

        <div className="note-box" style={{ marginBottom: "1.5rem" }}>
          <p className="safety-hint" style={{ margin: 0 }}>
            {current.isSelf
              ? "สะท้อนการทำงานของตัวคุณเองอย่างตรงไปตรงมา ข้อมูลนี้ช่วยให้อาจารย์เข้าใจมุมมองของคุณ"
              : "ข้อความของคุณจะถูกส่งให้อาจารย์อ่านเท่านั้น เพื่อนจะไม่เห็นข้อความนี้โดยตรงและจะไม่ทราบว่าใครเป็นผู้เขียน"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {questions.map((q) => (
            <div key={q.id} className="question-block">
              <strong>{q.content}</strong>

              {q.type === "scale" ? (
                <>
                  <div className="safety-hint">
                    1 = ควรพัฒนา · 5 = โดดเด่น
                  </div>
                  <div className="score-scale" data-cy={`scale-${q.id}`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="score-dot"
                        data-level={n}
                        data-active={draft[q.id]?.scoreValue === n}
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            [q.id]: { ...p[q.id], scoreValue: n },
                          }))
                        }
                        aria-label={`คะแนน ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <textarea
                  rows={3}
                  value={draft[q.id]?.textValue ?? ""}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      [q.id]: { ...p[q.id], textValue: e.target.value },
                    }))
                  }
                  placeholder="เขียนอย่างตรงไปตรงมาเพื่อช่วยให้ทีมพัฒนาต่อได้"
                  data-cy={`text-${q.id}`}
                />
              )}
            </div>
          ))}

          {error && (
            <p className="status-toast">{error}</p>
          )}

          <button type="submit" aria-busy={saving} disabled={saved} data-cy="submit-step">
            {saved
              ? "✓ บันทึกแล้ว"
              : step + 1 < targets.length
                ? "บันทึกและไปคนถัดไป"
                : "บันทึกและจบ"}
          </button>
        </form>
      </article>
    </div>
  );
}