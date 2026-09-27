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

/** GET /rounds?courseId= — progress มีเฉพาะเมื่อผู้เรียกเป็นอาจารย์ของวิชา */
export interface CourseRound extends RoundSummary {
  courseId: string;
  scaleMin: number;
  scaleMax: number;
  createdAt: string;
  /** จำนวนนักศึกษาที่ส่งแบบประเมินแล้ว (submissions.status = submitted) */
  submittedCount?: number;
  /** นักศึกษาที่มีกลุ่มอยู่ตอนนี้ */
  studentCount?: number;
  /** มีเฉพาะเมื่อผู้เรียกเป็นนักศึกษา — null = ยังไม่เริ่มทำ */
  mySubmission?: { status: "draft" | "submitted"; submittedAt: string | null } | null;
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
  /** ชื่ออาจารย์ผู้สอน */
  instructors: string[];
  /** กลุ่มปัจจุบันของผู้ใช้ (นักศึกษา) */
  myGroup: { id: string; name: string } | null;
  roundCount: number;
  /** รอบที่กำลังเปิดรับตอนนี้ */
  openRoundCount: number;
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

/** GET /groups/available — มุมมองนักศึกษา (ไม่มีรหัส/อีเมลของคนอื่น) */
export interface AvailableGroup {
  id: string;
  name: string;
  maxMembers: number | null;
  contractText: string | null;
  members: { id: string; name: string }[];
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

// ───────────── ทำแบบประเมิน (GET /answers/:roundId) ─────────────

export interface EvalTarget extends Person {
  isSelf: boolean;
}

export interface EvalQuestion {
  id: string;
  orderNo: number;
  type: "rating" | "text";
  prompt: string;
}

export interface EvalAnswer {
  questionId: string;
  evaluateeId: string;
  score: number | null;
  comment: string | null;
}

export interface Evaluation {
  round: {
    id: string;
    courseId: string;
    sequenceNo: number;
    opensAt: string;
    closesAt: string;
    scaleMin: number;
    scaleMax: number;
  };
  group: { id: string; name: string } | null;
  /** ตัวเองอยู่ลำดับแรก */
  targets: EvalTarget[];
  questions: EvalQuestion[];
  submission: { status: "draft" | "submitted"; submittedAt: string | null } | null;
  answers: EvalAnswer[];
  /** เหตุผลที่ยังบันทึก/ส่งไม่ได้ — null = ทำได้ */
  blocker: string | null;
}

// ───────────── ผลประเมิน / แบบประเมินรวมทุกวิชา ─────────────

interface CourseRef {
  courseId: string;
  courseCode: string;
  section: string | null;
  courseTitle: string;
}

/** GET /feedback — รอบที่ดูผลได้แล้ว */
export interface FeedbackListItem extends CourseRef {
  roundId: string;
  sequenceNo: number;
  scoresReleasedAt: string | null;
  feedbackReleasedAt: string | null;
  releasedAt: string;
}

/** GET /feedback/rounds/:roundId — scores/comments เป็น null ถ้ายังไม่เผยแพร่ */
export interface RoundFeedback {
  round: {
    id: string;
    sequenceNo: number;
    opensAt: string;
    closesAt: string;
    scaleMin: number;
    scaleMax: number;
    scoresReleasedAt: string | null;
    feedbackReleasedAt: string | null;
  };
  course: { id: string; courseCode: string; section: string | null; title: string };
  groupName: string | null;
  mySubmission: { status: "draft" | "submitted"; submittedAt: string | null } | null;
  /** จำนวนเพื่อนที่ส่งแบบประเมินให้คุณ */
  peerCount: number;
  scores:
    | {
        questionId: string;
        orderNo: number;
        prompt: string;
        peerAverage: number | null;
        peerCount: number;
        selfScore: number | null;
      }[]
    | null;
  comments: { questionId: string; orderNo: number; prompt: string; comments: string[] }[] | null;
}

/** GET /rounds/assignments — รอบที่เปิดรับอยู่จากทุกวิชา */
export interface Assignment extends CourseRef {
  roundId: string;
  sequenceNo: number;
  opensAt: string;
  closesAt: string;
  myGroup: { id: string; name: string } | null;
  contractPending: boolean;
  mySubmission: { status: "draft" | "submitted"; submittedAt: string | null } | null;
  /** ตอบแล้ว / ทั้งหมด (คำถาม × คนในกลุ่ม) */
  progress: { answered: number; total: number };
}
