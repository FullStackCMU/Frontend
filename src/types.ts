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

export interface Course {
  id: string;
  courseCode: string;
  name: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  username: string;
}

export interface Group {
  id: string;
  name: string;
  section: string | null;
  courseId: string;
  members: GroupMember[];
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