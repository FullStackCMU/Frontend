import type { EvalAnswer, EvalQuestion, Evaluation, FlagCategory } from "../types";

export const MAX_COMMENT_LENGTH = 500; // ตรงกับ Backend/src/routes/answer.ts

export const FLAG_LABEL: Record<FlagCategory, string> = {
  profanity: "หยาบคาย",
  personal_attack: "โจมตีตัวบุคคล",
  negative_tone: "เชิงลบไม่สร้างสรรค์",
  other: "อื่นๆ",
};

/** คำตอบของ (คำถาม, ผู้ถูกประเมิน) — key = `${questionId}:${evaluateeId}` */
export type AnswerMap = Record<string, { score: number | null; comment: string }>;

export const answerKey = (questionId: string, evaluateeId: string) => `${questionId}:${evaluateeId}`;

export function toAnswerMap(answers: EvalAnswer[]): AnswerMap {
  return Object.fromEntries(
    answers.map((a) => [answerKey(a.questionId, a.evaluateeId), { score: a.score, comment: a.comment ?? "" }])
  );
}

export function toAnswerList(map: AnswerMap): EvalAnswer[] {
  return Object.entries(map).map(([key, a]) => {
    const [questionId, evaluateeId] = key.split(":");
    return { questionId, evaluateeId, score: a.score, comment: a.comment };
  });
}

export function isAnswered(question: EvalQuestion, answer: AnswerMap[string] | undefined) {
  if (!answer) return false;
  return question.type === "rating" ? answer.score !== null : answer.comment.trim() !== "";
}

/** ตอบครบทุกคนในคำถามนี้หรือยัง */
export function isQuestionComplete(data: Evaluation, question: EvalQuestion, map: AnswerMap) {
  return data.targets.every((t) => isAnswered(question, map[answerKey(question.id, t.id)]));
}

/** จำนวนช่องที่ตอบแล้ว / ทั้งหมด (คำถาม × ผู้ถูกประเมิน) */
export function answerProgress(data: Evaluation, map: AnswerMap) {
  const total = data.questions.length * data.targets.length;
  const done = data.questions.reduce(
    (sum, q) => sum + data.targets.filter((t) => isAnswered(q, map[answerKey(q.id, t.id)])).length,
    0
  );
  return { done, total };
}

/** เวลาโดยประมาณ (นาที) — ให้คะแนน ~15 วินาที/คน, เขียนความเห็น ~1.5 นาที/คน */
export function estimatedMinutes(data: Evaluation) {
  const perTarget = data.questions.reduce((m, q) => m + (q.type === "rating" ? 0.25 : 1.5), 0);
  return Math.max(1, Math.ceil(perTarget * data.targets.length));
}
