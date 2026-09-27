export type Role = "student" | "instructor";
export type QuestionType = "scale" | "text";

export type AccountType = "StdAcc" | "MISEmpAcc";

/** ผู้ใช้ที่ login อยู่ — ตรงกับ GET /auth/me (แถว users) */
export interface Me {
  id: string;
  cmuAccount: string;
  studentId: string | null;
  firstnameTh: string | null;
  lastnameTh: string | null;
  firstnameEn: string | null;
  lastnameEn: string | null;
  accountType: AccountType | null;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
}

/** GET /consents/me, POST /consents */
export interface ConsentStatus {
  policyVersion: string;
  accepted: boolean;
  acceptedAt: string | null;
}

/** @deprecated ข้อมูล /users รูปแบบเดิม — ใช้เฉพาะหน้าอาจารย์ที่ยังไม่ได้ย้าย (CoursesView, GroupsView) */
export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export type EnrollmentRole = "instructor" | "student";

/** รอบที่แสดงบนการ์ดวิชา — สถานะคำนวณด้วย getRoundStatus() */
export interface RoundSummary {
  id: string;
  sequenceNo: number;
  opensAt: string;
  closesAt: string;
  scoresReleasedAt: string | null;
  feedbackReleasedAt: string | null;
}

/** GET /courses — วิชาที่ผู้ใช้มี enrollment */
export interface Course {
  id: string;
  courseCode: string;
  title: string;
  section: string | null;
  /** 1, 2 หรือ 3 (ฤดูร้อน) */
  semester: number;
  /** ปี พ.ศ. */
  academicYear: number;
  createdAt: string;
  role: EnrollmentRole;
  studentCount: number;
  currentRound: RoundSummary | null;
}

/** คนในวิชา (จาก users) — name = ชื่อที่แสดงสำเร็จรูปจาก backend */
export interface Person {
  id: string;
  studentId: string | null;
  cmuAccount: string;
  name: string;
  /** null = import แล้วแต่ยังไม่เคยเข้าระบบ */
  firstLoginAt: string | null;
}

export interface GroupMember extends Person {
  joinedAt: string;
  contractAcceptedAt: string | null;
}

/** กลุ่ม + สมาชิกปัจจุบัน (left_at เป็น null) */
export interface Group {
  id: string;
  courseId: string;
  name: string;
  /** null = ไม่จำกัด */
  maxMembers: number | null;
  contractText: string | null;
  createdAt: string;
  members: GroupMember[];
}

/** GET /courses/:courseId/students */
export interface CourseStudent extends Person {
  group: { id: string; name: string } | null;
}

/** GET /groups?courseId= */
export interface GroupsOverview {
  groups: Group[];
  unassigned: Person[];
}

export interface ImportIssue {
  /** บรรทัดในไฟล์ CSV (บรรทัดแรกคือหัวตาราง) */
  line: number;
  reason: string;
  kind: "duplicate" | "invalid";
}

/** POST /courses/:courseId/students/import */
export interface ImportResult {
  added: number;
  created: number;
  duplicate: number;
  invalid: number;
  issues: ImportIssue[];
}

export interface Round {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  isOpen: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  roundId: string;
  content: string;
  type: QuestionType;
  sortOrder: number;
}

export interface Answer {
  id: string;
  questionId: string;
  groupId: string;
  evaluatorId: string;
  evaluateeId: string;
  scoreValue: number | null;
  textValue: string | null;
  createdAt: string;
}

export interface Progress {
  evaluateeId: string;
  answered: number;
  total: number;
  completed: boolean;
}

export interface FeedbackSummary {
  id: string;
  roundId: string;
  roundName?: string;
  courseId?: string;
  studentId?: string;
  studentName?: string;
  summary: string;
  isPublished?: boolean;
  createdAt: string;
}

export interface RawAnswer {
  answerId: string;
  questionId: string;
  questionContent: string;
  questionType: QuestionType;
  sortOrder: number;
  scoreValue: number | null;
  textValue: string | null;
  evaluatorId: string;
  evaluateeId: string;
  evaluateeName: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  msg: string;
  data: T;
}