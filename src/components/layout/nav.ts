import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** ตัวเลขบน badge — ยังไม่มี API นับ (รอบที่เปิด/ฟีดแบ็กใหม่) จึงยังไม่มีใครส่งมา */
  badge?: number;
}

// เมนูตาม design-ref — หน้าที่ยังไม่ได้ย้ายจะ render หน้าเดิม (.pico) ที่ path เดียวกัน
export const STUDENT_NAV: NavItem[] = [
  { to: "/assignments", label: "แบบประเมิน", icon: ClipboardList },
  { to: "/courses", label: "วิชาของฉัน", icon: BookOpen },
  // P1 ไม่มีสรุปจากอาจารย์ — ฟีดแบ็ก = คะแนนเฉลี่ย + ความเห็นจากเพื่อนแบบไม่ระบุชื่อ
  { to: "/feedback", label: "ฟีดแบ็ก", icon: MessageSquare },
];

export const STAFF_NAV: NavItem[] = [
  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { to: "/courses", label: "คอร์สของฉัน", icon: BookOpen },
];
