import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getData } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { ApiResponse, InstructorNote, RoundOverview, StudentFeedbackDetail } from "../types";

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
    enabled: !!roundId && !!studentId,
  });
}

// ข้อความว่าง = ลบ
export function useSaveStudentNote(roundId: string, studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await api.put<ApiResponse<InstructorNote | null>>(
        `/feedback/rounds/${roundId}/students/${studentId}/note`,
        { body }
      );
      return res.data.data;
    },
    onSuccess: (note) => {
      queryClient.setQueryData<StudentFeedbackDetail>(
        keys.studentFeedback(roundId, studentId),
        (prev) => prev && { ...prev, note }
      );
      queryClient.setQueryData<RoundOverview>(
        keys.overview(roundId),
        (prev) =>
          prev && {
            ...prev,
            groups: prev.groups.map((g) => ({
              ...g,
              rows: g.rows.map((r) => (r.student.id === studentId ? { ...r, hasNote: note !== null } : r)),
            })),
          }
      );
    },
  });
}
