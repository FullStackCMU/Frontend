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

export interface CourseStudent extends Person {
  group: { id: string; name: string } | null;
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
  comments: { questionId: string; orderNo: number; prompt: string; comments: string[] }[] | null;
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
}

export interface RoundOverview {
  round: RoundSummary & { courseId: string; scaleMin: number; scaleMax: number };
  questions: { id: string; orderNo: number; prompt: string }[];
  groups: { id: string | null; name: string; rows: OverviewRow[] }[];
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
}
