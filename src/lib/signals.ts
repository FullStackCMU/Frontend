import type { OverviewGroup, RoundOverview, Signal } from "../types";

// ข้อมูลประกอบ ไม่นับเป็นเรื่องที่ต้องตามต่อ
const INFO_TYPES: Signal["type"][] = ["self_under", "few_raters"];

export const isWarning = (signal: Signal) => !INFO_TYPES.includes(signal.type);

// เรื่องที่ต้องตามต่อขึ้นก่อน
export function groupSignals(group: OverviewGroup): Signal[] {
  const all = [...group.signals.received, ...group.signals.givers];
  return [...all.filter(isWarning), ...all.filter((s) => !isWarning(s))];
}

export const warningCount = (group: OverviewGroup) => groupSignals(group).filter(isWarning).length;

export type NamedGroup = OverviewGroup & { id: string };

// ลำดับเดียวกันทั้งหน้าการ์ดและปุ่มก่อนหน้า/ถัดไป — กลุ่มที่มีเรื่องต้องดูขึ้นก่อน
export function groupsByAttention(overview: RoundOverview): NamedGroup[] {
  const groups = overview.groups.filter((g): g is NamedGroup => g.id !== null);
  return groups.sort((a, b) => warningCount(b) - warningCount(a));
}

const n1 = (n: number) => n.toFixed(1);

export function describeSignal(signal: Signal, questions: RoundOverview["questions"]): string {
  switch (signal.type) {
    case "low_overall":
      return `คะแนนรวมจากเพื่อน ${n1(signal.value)} ต่ำกว่าระดับ 3`;
    case "low_dimension": {
      const name = (id: string) => questions.find((q) => q.id === id)?.prompt ?? "";
      if (signal.dimensions.length === 1) {
        const d = signal.dimensions[0];
        return `ด้าน${name(d.questionId)} ต่ำกว่าเพื่อนร่วมกลุ่ม ${n1(d.reference - d.value)} (${n1(d.value)})`;
      }
      return `ต่ำกว่าเพื่อนร่วมกลุ่ม ${signal.dimensions.length} ด้าน: ${signal.dimensions.map((d) => name(d.questionId)).join(", ")}`;
    }
    case "self_over":
      return `ให้ตัวเอง ${n1(signal.value)} สูงกว่าที่เพื่อนให้ (${n1(signal.reference)})`;
    case "self_under":
      return `ให้ตัวเอง ${n1(signal.value)} ต่ำกว่าที่เพื่อนให้ (${n1(signal.reference)})`;
    case "few_raters":
      return signal.count === 0
        ? "ไม่มีเพื่อนประเมิน จึงไม่เห็นผลของตัวเอง"
        : `มีเพื่อนประเมิน ${signal.count} คน จึงไม่เห็นผลของตัวเอง`;
    case "not_submitted":
      return "ไม่ได้ส่งแบบประเมิน";
    case "straight_lining":
      return `ให้เพื่อนทุกคน ${signal.value} เท่ากันทุกข้อ`;
    case "self_serving":
      return `ให้ตัวเองเฉลี่ย ${n1(signal.value)} แต่ให้เพื่อนเฉลี่ย ${n1(signal.reference)}`;
    case "lenient":
      return `ให้เพื่อนเฉลี่ย ${n1(signal.value)} สูงกว่าค่ากลางของกลุ่ม (${n1(signal.reference)})`;
    case "harsh":
      return `ให้เพื่อนเฉลี่ย ${n1(signal.value)} ต่ำกว่าค่ากลางของกลุ่ม (${n1(signal.reference)})`;
    case "ignored_warnings":
      return `ส่งข้อความถึงเพื่อนที่ AI เตือน ${signal.count} ข้อความโดยไม่แก้`;
  }
}
