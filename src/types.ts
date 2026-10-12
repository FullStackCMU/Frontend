export type AccountType = "StdAcc" | "MISEmpAcc";

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

export interface ConsentStatus {
  policyVersion: string;
  accepted: boolean;
  acceptedAt: string | null;
}

export type EnrollmentRole = "instructor" | "student";

export interface RoundSummary {
  id: string;
  sequenceNo: number;
  opensAt: string;
  closesAt: string;
  scoresReleasedAt: string | null;
  feedbackReleasedAt: string | null;
}

export interface CourseRound extends RoundSummary {
  courseId: string;
  scaleMin: number;
  scaleMax: number;
  createdAt: string;
  // มีเฉพาะเมื่อผู้เรียกเป็นอาจารย์ — นับเฉพาะคนที่มีกลุ่มอยู่ตอนนี้
  submittedCount?: number;
  studentCount?: number;
  // มีเฉพาะเมื่อผู้เรียกเป็นนักศึกษา — null = ยังไม่เริ่มทำ
  mySubmission?: { status: "draft" | "submitted"; submittedAt: string | null } | null;
}

export interface Course {
  id: string;
  courseCode: string;
  title: string;
  section: string | null;
  // 3 = ฤดูร้อน
  semester: number;
  // พ.ศ.
  academicYear: number;
  createdAt: string;
  role: EnrollmentRole;
  instructors: string[];
  myGroup: { id: string; name: string } | null;
  roundCount: number;
  openRoundCount: number;
  studentCount: number;
  currentRound: RoundSummary | null;
}

export interface Person {
  id: string;
  studentId: string | null;
  cmuAccount: string;
  name: string;
  // null = import แล้วแต่ยังไม่เคยเข้าระบบ
  firstLoginAt: string | null;
}

export interface GroupMember extends Person {
  joinedAt: string;
  contractAcceptedAt: string | null;
}

export interface Group {
  id: string;
  courseId: string;
  name: string;
  // null = ไม่จำกัด
  maxMembers: number | null;
  contractText: string | null;
  createdAt: string;
  members: GroupMember[];
}

export interface MyGroup {
  id: string;
  courseId: string;
  name: string;
  maxMembers: number | null;
  contractText: string | null;
  members: { id: string; name: string; contractAcceptedAt: string | null }[];
}

export interface AvailableGroup {
  id: string;
  name: string;
  maxMembers: number | null;
  contractText: string | null;
  members: { id: string; name: string }[];
}

export interface GroupsOverview {
  groups: Group[];
  unassigned: Person[];
}

export interface ImportIssue {
  // บรรทัดแรกคือหัวตาราง
  line: number;
  reason: string;
  kind: "duplicate" | "invalid";
}

export interface ImportResult {
  added: number;
  created: number;
  duplicate: number;
  invalid: number;
  issues: ImportIssue[];
}

export interface ApiResponse<T> {
  msg: string;
  data: T;
}

export interface EvalTarget {
  id: string;
  name: string;
  isSelf: boolean;
}

export interface EvalQuestion {
  id: string;
  orderNo: number;
  type: "rating" | "text";
  prompt: string;
  description: string | null;
  // เฉพาะ rating เรียงจากน้อยไปมาก — ระดับที่ไม่มีในนี้คือ "อยู่ระหว่าง" ระดับข้างเคียง
  anchors: { score: number; text: string }[];
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
  // ตัวเองอยู่ลำดับแรก
  targets: EvalTarget[];
  questions: EvalQuestion[];
  submission: { status: "draft" | "submitted"; submittedAt: string | null } | null;
  answers: EvalAnswer[];
  // null = บันทึก/ส่งได้
  blocker: string | null;
  warnings: CommentWarning[];
}

export type FlagCategory = "profanity" | "personal_attack" | "negative_tone" | "other";
export type FlagSeverity = "low" | "medium" | "high";

export interface CommentWarning {
  questionId: string;
  evaluateeId: string;
  category: FlagCategory;
  severity: FlagSeverity;
  suggestion: string;
}

// คะแนนรวม = เฉลี่ยของคะแนนรายมิติ, gap = ตัวเอง − เพื่อน
export interface OverallScore {
  peerAverage: number | null;
  selfAverage: number | null;
  gap: number | null;
}

interface CourseRef {
  courseId: string;
  courseCode: string;
  section: string | null;
  courseTitle: string;
}

export interface FeedbackListItem extends CourseRef {
  roundId: string;
  sequenceNo: number;
  scoresReleasedAt: string | null;
  feedbackReleasedAt: string | null;
  releasedAt: string;
}

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
  peerCount: number;
  // มีค่า = เผยแพร่แล้วแต่ซ่อนผลเพราะผู้ประเมินน้อยกว่า minPeers
  withheldReason: string | null;
  minPeers: number;
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
  overall: OverallScore | null;
  comments: { questionId: string; orderNo: number; prompt: string; comments: string[] }[] | null;
  // เผยแพร่พร้อมความเห็นจากเพื่อน แต่ไม่ถูกซ่อนด้วย withheldReason
  instructorNote: InstructorNote | null;
}

// ฟีดแบ็กจากอาจารย์ถึงนักศึกษารายคน หนึ่งข้อความต่อรอบ — authorName = อาจารย์คนล่าสุดที่แก้
export interface InstructorNote {
  body: string;
  updatedAt: string;
  authorName: string;
}

export interface Assignment extends CourseRef {
  roundId: string;
  sequenceNo: number;
  opensAt: string;
  closesAt: string;
  myGroup: { id: string; name: string } | null;
  contractPending: boolean;
  mySubmission: { status: "draft" | "submitted"; submittedAt: string | null } | null;
  // total = คำถาม × คนในกลุ่ม
  progress: { answered: number; total: number };
}

export interface OverviewRow {
  student: { id: string; studentId: string | null; name: string };
  groupId: string | null;
  submission: { status: "draft" | "submitted"; submittedAt: string | null } | null;
  // ไม่นับตัวเอง
  peerCount: number;
  scores: { questionId: string; peerAverage: number | null; selfScore: number | null }[];
  overall: OverallScore;
  // เฉลี่ยคะแนนจากเพื่อนเฉพาะมิติด้านงาน / ด้านทีม
  focus: { task: number | null; team: number | null };
  // อาจารย์เขียนฟีดแบ็กถึงคนนี้ในรอบนี้แล้ว
  hasNote: boolean;
}

// ตรงกับ Backend/src/lib/insights.ts — value = ค่าของนักศึกษาคนนั้น, reference = ค่าที่เอามาเทียบ
export type ReceivedSignal = { studentId: string } & (
  | { type: "low_overall"; value: number }
  | { type: "low_dimension"; dimensions: { questionId: string; value: number; reference: number }[] }
  | { type: "self_over" | "self_under"; value: number; reference: number }
  | { type: "few_raters"; count: number }
);

export type GiverSignal = { studentId: string } & (
  | { type: "not_submitted" }
  | { type: "straight_lining"; value: number }
  | { type: "self_serving"; value: number; reference: number }
  | { type: "lenient" | "harsh"; value: number; reference: number }
  | { type: "ignored_warnings"; count: number }
);

export type Signal = ReceivedSignal | GiverSignal;

export interface OverviewGroup {
  // null = นักศึกษาที่ยังไม่มีกลุ่ม
  id: string | null;
  name: string;
  rows: OverviewRow[];
  signals: { received: ReceivedSignal[]; givers: GiverSignal[] };
}

export interface RoundOverview {
  round: RoundSummary & { courseId: string; scaleMin: number; scaleMax: number };
  questions: { id: string; orderNo: number; prompt: string; focus: "task" | "team" | null }[];
  // ค่ากลางของทั้งวิชาในรอบนี้
  section: {
    selfMedian: number | null;
    peerMedian: number | null;
    taskMedian: number | null;
    teamMedian: number | null;
  };
  groups: OverviewGroup[];
  minPeers: number;
}

export interface StudentFeedbackDetail {
  student: { id: string; studentId: string | null; name: string; group: { id: string; name: string } | null };
  questions: { id: string; orderNo: number; type: "rating" | "text"; prompt: string }[];
  scale: { min: number; max: number };
  evaluations: {
    evaluator: { id: string; name: string; isSelf: boolean };
    answers: {
      questionId: string;
      score: number | null;
      comment: string | null;
      ignoredWarning: FlagCategory | null;
    }[];
  }[];
  writtenFlags: {
    total: number;
    edited: number;
    ignored: number;
    pending: number;
    items: {
      questionNo: number | null;
      evaluateeName: string | null;
      isSelf: boolean;
      category: FlagCategory;
      severity: FlagSeverity;
      studentAction: "pending" | "edited" | "ignored";
    }[];
  };
  note: InstructorNote | null;
  // false = รอบยังไม่ปิดรับ
  canWriteNote: boolean;
}
