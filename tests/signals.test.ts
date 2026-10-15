import { describe, expect, it } from "vitest";
import { describeSignal, groupSignals, groupsByAttention, isWarning, warningCount } from "../src/lib/signals";
import type { OverviewGroup, RoundOverview, Signal } from "../src/types";

const questions = [
  { id: "q1", orderNo: 1, prompt: "การมีส่วนร่วมในงาน", focus: "task" },
  { id: "q2", orderNo: 2, prompt: "การปฏิสัมพันธ์กับเพื่อน", focus: "team" },
] as RoundOverview["questions"];

function group(id: string | null, received: Signal[], givers: Signal[] = []): OverviewGroup {
  return { id, name: id ?? "ยังไม่มีกลุ่ม", rows: [], signals: { received, givers } } as OverviewGroup;
}

const lowOverall: Signal = { studentId: "a", type: "low_overall", value: 2.5 };
const selfUnder: Signal = { studentId: "b", type: "self_under", value: 3, reference: 4.5 };
const fewRaters: Signal = { studentId: "c", type: "few_raters", count: 1 };
const notSubmitted: Signal = { studentId: "d", type: "not_submitted" };

describe("การจัดลำดับสัญญาณ", () => {
  it("ให้ตัวเองต่ำกว่าเพื่อน และผู้ประเมินไม่พอ เป็นข้อมูลประกอบ ไม่ใช่เรื่องต้องตาม", () => {
    expect([lowOverall, notSubmitted].every(isWarning)).toBe(true);
    expect([selfUnder, fewRaters].some(isWarning)).toBe(false);
  });

  it("เรื่องที่ต้องตามขึ้นก่อนข้อมูลประกอบ รวมทั้งสองด้านของกลุ่ม", () => {
    const g = group("g1", [selfUnder, lowOverall], [notSubmitted]);
    expect(groupSignals(g)).toEqual([lowOverall, notSubmitted, selfUnder]);
    expect(warningCount(g)).toBe(2);
  });

  it("กลุ่มที่มีเรื่องต้องตามมากกว่าขึ้นก่อน และไม่รวมนักศึกษาที่ยังไม่มีกลุ่ม", () => {
    const overview = {
      groups: [group("quiet", [selfUnder]), group(null, [lowOverall]), group("busy", [lowOverall], [notSubmitted])],
    } as RoundOverview;
    expect(groupsByAttention(overview).map((g) => g.id)).toEqual(["busy", "quiet"]);
  });
});

describe("describeSignal", () => {
  it("คะแนนรวมต่ำ", () => {
    expect(describeSignal(lowOverall, questions)).toBe("คะแนนรวมจากเพื่อน 2.5 ต่ำกว่าระดับ 3");
  });

  it("ต่ำกว่าเพื่อนด้านเดียวบอกส่วนต่างและคะแนน หลายด้านบอกจำนวนกับชื่อด้าน", () => {
    const one: Signal = { studentId: "a", type: "low_dimension", dimensions: [{ questionId: "q1", value: 3, reference: 4.5 }] };
    expect(describeSignal(one, questions)).toBe("ด้านการมีส่วนร่วมในงาน ต่ำกว่าเพื่อนร่วมกลุ่ม 1.5 (3.0)");

    const two: Signal = {
      studentId: "a",
      type: "low_dimension",
      dimensions: [
        { questionId: "q1", value: 3, reference: 4.5 },
        { questionId: "q2", value: 2, reference: 4 },
      ],
    };
    expect(describeSignal(two, questions)).toBe("ต่ำกว่าเพื่อนร่วมกลุ่ม 2 ด้าน: การมีส่วนร่วมในงาน, การปฏิสัมพันธ์กับเพื่อน");
  });

  it("ไม่มีผู้ประเมินเลยใช้ข้อความต่างจากมีผู้ประเมินไม่พอ", () => {
    expect(describeSignal({ studentId: "a", type: "few_raters", count: 0 }, questions)).toBe(
      "ไม่มีเพื่อนประเมิน จึงไม่เห็นผลของตัวเอง"
    );
    expect(describeSignal(fewRaters, questions)).toBe("มีเพื่อนประเมิน 1 คน จึงไม่เห็นผลของตัวเอง");
  });

  it("สัญญาณฝั่งผู้ให้", () => {
    expect(describeSignal({ studentId: "a", type: "straight_lining", value: 5 }, questions)).toBe("ให้เพื่อนทุกคน 5 เท่ากันทุกข้อ");
    expect(describeSignal({ studentId: "a", type: "harsh", value: 2, reference: 4 }, questions)).toBe(
      "ให้เพื่อนเฉลี่ย 2.0 ต่ำกว่าค่ากลางของกลุ่ม (4.0)"
    );
    expect(describeSignal({ studentId: "a", type: "ignored_warnings", count: 2 }, questions)).toBe(
      "ส่งข้อความถึงเพื่อนที่ AI เตือน 2 ข้อความโดยไม่แก้"
    );
  });
});
