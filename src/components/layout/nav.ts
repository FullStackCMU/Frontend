import { BookOpen, ClipboardList, MessageSquare, type LucideIcon } from "lucide-react";

export interface NavSection {
  // ต่อท้าย /courses/:courseId — ว่าง = หน้าแรกของวิชา
  path: string;
  label: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  // หัวข้อย่อยที่กางออกใต้เมนูนี้เมื่อเปิดวิชาอยู่
  sections?: NavSection[];
}

// หน้าละหนึ่งหน้าที่: ดูผล / จัดคน / จัดรอบ / เขียนฟีดแบ็กถึงนักศึกษา
export const COURSE_SECTIONS: NavSection[] = [
  { path: "", label: "ภาพรวม" },
  { path: "members", label: "สมาชิก" },
  { path: "rounds", label: "รอบประเมิน" },
  { path: "feedback", label: "ฟีดแบ็ก" },
];

// แบบประเมิน = สิ่งที่ต้องทำ, วิชาของฉัน = ทีมและกำหนดการ, ฟีดแบ็ก = ผลที่เผยแพร่แล้ว
export const STUDENT_NAV: NavItem[] = [
  { to: "/assignments", label: "แบบประเมิน", icon: ClipboardList },
  { to: "/courses", label: "วิชาของฉัน", icon: BookOpen },
  { to: "/feedback", label: "ฟีดแบ็ก", icon: MessageSquare },
];

export const STAFF_NAV: NavItem[] = [
  { to: "/courses", label: "คอร์สของฉัน", icon: BookOpen, sections: COURSE_SECTIONS },
];
