import { useQuery } from "@tanstack/react-query";
import { getData } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { RoundOverview, StudentFeedbackDetail } from "../types";

export function useRoundOverview(roundId: string) {
  return useQuery({
    queryKey: keys.overview(roundId),
    queryFn: () => getData<RoundOverview>(`/feedback/rounds/${roundId}/overview`),
    enabled: !!roundId,
  });
}

export function useStudentFeedback(roundId: string, studentId: string) {
  return useQuery({
    queryKey: keys.studentFeedback(roundId, studentId),
    queryFn: () => getData<StudentFeedbackDetail>(`/feedback/rounds/${roundId}/students/${studentId}`),
  });
}
