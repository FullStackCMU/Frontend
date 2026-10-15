import { describe, expect, it } from "vitest";
import {
  answerKey,
  answerProgress,
  estimatedMinutes,
  isQuestionComplete,
  levelText,
  toAnswerList,
  toAnswerMap,
  type AnswerMap,
} from "../src/lib/evaluation";
import type { EvalQuestion, Evaluation } from "../src/types";

const ANCHORS = [
  { score: 1, text: "ต่ำ" },
  { score: 3, text: "กลาง" },
  { score: 5, text: "สูง" },
];

const rating = { id: "r1", type: "rating", anchors: ANCHORS } as unknown as EvalQuestion;
const text = { id: "t1", type: "text", anchors: [] } as unknown as EvalQuestion;

// ฟอร์มของคนในกลุ่ม 3 คน (รวมตัวเอง)
const data = {
  targets: [{ id: "me" }, { id: "a" }, { id: "b" }],
  questions: [rating, text],
} as unknown as Evaluation;

describe("levelText", () => {
  it("ระดับที่มีคำอธิบายใช้คำอธิบายนั้น", () => {
    expect(levelText(ANCHORS, 3)).toBe("กลาง");
  });

  it("ระดับที่ไม่มีคำอธิบายบอกว่าอยู่ระหว่างสองระดับข้างเคียง", () => {
    expect(levelText(ANCHORS, 2)).toBe("อยู่ระหว่างระดับ 1 กับ 3");
    expect(levelText(ANCHORS, 4)).toBe("อยู่ระหว่างระดับ 3 กับ 5");
  });

  it("ระดับนอกช่วงของคำอธิบายไม่มีข้อความ", () => {
    expect(levelText(ANCHORS.slice(1), 1)).toBeNull();
  });
});

describe("แปลงคำตอบระหว่างรายการกับตาราง", () => {
  it("ไปกลับแล้วได้ค่าเดิม และความเห็นที่ว่างกลายเป็นข้อความว่าง", () => {
    const answers = [
      { questionId: "r1", evaluateeId: "a", score: 4, comment: null },
      { questionId: "t1", evaluateeId: "a", score: null, comment: "ดีมาก" },
    ];
    const map = toAnswerMap(answers);
    expect(map[answerKey("r1", "a")]).toEqual({ score: 4, comment: "" });
    expect(toAnswerList(map)).toEqual([
      { questionId: "r1", evaluateeId: "a", score: 4, comment: "" },
      { questionId: "t1", evaluateeId: "a", score: null, comment: "ดีมาก" },
    ]);
  });
});

describe("ความครบของคำตอบ", () => {
  const scoreFor = (...ids: string[]): AnswerMap =>
    Object.fromEntries(ids.map((id) => [answerKey("r1", id), { score: 4, comment: "" }]));

  it("ข้อคะแนนต้องให้ครบทุกคนรวมตัวเอง", () => {
    expect(isQuestionComplete(data, rating, scoreFor("me", "a"))).toBe(false);
    expect(isQuestionComplete(data, rating, scoreFor("me", "a", "b"))).toBe(true);
  });

  it("ข้อความเห็นที่มีแต่ช่องว่างนับว่ายังไม่ตอบ", () => {
    const map: AnswerMap = {
      [answerKey("t1", "me")]: { score: null, comment: "ทำได้ดี" },
      [answerKey("t1", "a")]: { score: null, comment: "   " },
      [answerKey("t1", "b")]: { score: null, comment: "ทำได้ดี" },
    };
    expect(isQuestionComplete(data, text, map)).toBe(false);
    map[answerKey("t1", "a")].comment = "ขอบคุณ";
    expect(isQuestionComplete(data, text, map)).toBe(true);
  });

  it("นับความคืบหน้าเป็นช่อง = คำถาม × คนในกลุ่ม", () => {
    const map: AnswerMap = {
      ...scoreFor("me", "a"),
      [answerKey("t1", "me")]: { score: null, comment: "ทำได้ดี" },
      [answerKey("t1", "a")]: { score: null, comment: " " },
    };
    expect(answerProgress(data, map)).toEqual({ done: 3, total: 6 });
  });
});

describe("estimatedMinutes", () => {
  it("ข้อคะแนน 15 วินาที ข้อความเห็น 1.5 นาที ต่อคน ปัดขึ้น", () => {
    const full = { targets: data.targets, questions: [rating, rating, rating, rating, rating, text, text] } as unknown as Evaluation;
    expect(estimatedMinutes(full)).toBe(13);
  });

  it("อย่างน้อย 1 นาที", () => {
    expect(estimatedMinutes({ targets: [{ id: "me" }], questions: [rating] } as unknown as Evaluation)).toBe(1);
  });
});
