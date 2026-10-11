// ทุกอย่างของวิชาหนึ่งอยู่ใต้ ["course", courseId] — invalidate key นี้ครั้งเดียวได้ทั้งวิชา
export const keys = {
  courses: ["courses"] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseInfo: (courseId: string) => ["course", courseId, "info"] as const,
  rounds: (courseId: string) => ["course", courseId, "rounds"] as const,
  students: (courseId: string) => ["course", courseId, "students"] as const,
  groups: (courseId: string) => ["course", courseId, "groups"] as const,
  myGroup: (courseId: string) => ["course", courseId, "my-group"] as const,
  availableGroups: (courseId: string) => ["course", courseId, "available-groups"] as const,

  assignments: ["assignments"] as const,
  evaluation: (roundId: string) => ["evaluation", roundId] as const,
  feedbackList: ["feedback"] as const,
  feedback: (roundId: string) => ["feedback", roundId] as const,

  overviewRoot: ["round-overview"] as const,
  overview: (roundId: string) => ["round-overview", roundId] as const,
  studentFeedback: (roundId: string, studentId: string) => ["round-overview", roundId, "student", studentId] as const,
};
