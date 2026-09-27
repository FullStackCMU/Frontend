export const SEMESTERS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "ฤดูร้อน" },
] as const;

/** "1/2569", "ฤดูร้อน/2569" */
export function formatTerm(semester: number, academicYear: number) {
  const label = SEMESTERS.find((s) => s.value === semester)?.label ?? semester;
  return `${label}/${academicYear}`;
}

/** "261497 ตอน 001" */
export function formatCourseCode(courseCode: string, section: string | null) {
  return section ? `${courseCode} ตอน ${section}` : courseCode;
}

/**
 * ภาคการศึกษาปัจจุบันตามปฏิทิน มช. (โดยประมาณ) — ใช้เป็นค่าเริ่มต้นของฟอร์ม
 * ภาค 1 = มิ.ย.–ต.ค., ภาค 2 = พ.ย.–มี.ค., ฤดูร้อน = เม.ย.–พ.ค.
 * ปีการศึกษาเริ่มเดือน มิ.ย. (ม.ค.–พ.ค. ยังเป็นปีการศึกษาของปีก่อน)
 */
export function currentTerm(now: Date = new Date()) {
  const month = now.getMonth() + 1;
  const academicYear = now.getFullYear() + 543 - (month < 6 ? 1 : 0);
  const semester = month >= 6 && month <= 10 ? 1 : month >= 4 && month <= 5 ? 3 : 2;
  return { semester, academicYear };
}
