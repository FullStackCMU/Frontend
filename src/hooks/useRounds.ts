import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getData } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { ApiResponse, Assignment, CourseRound } from "../types";

export function useRounds(courseId: string) {
  return useQuery({
    queryKey: keys.rounds(courseId),
    queryFn: () => getData<CourseRound[]>(`/rounds?courseId=${courseId}`),
    enabled: !!courseId,
  });
}

export function useAssignments() {
  return useQuery({ queryKey: keys.assignments, queryFn: () => getData<Assignment[]>("/rounds/assignments") });
}

// endpoint ที่แก้รอบคืนรอบทั้งวิชา (เลขรอบอาจเลื่อนหลังลบ) จึงใส่ cache ได้เลย
// ข้อมูลวิชา (รอบปัจจุบัน) และผลรายรอบ (สถานะเผยแพร่) ขึ้นกับรอบ ต้องโหลดใหม่
export function useSetRounds(courseId: string) {
  const queryClient = useQueryClient();
  return (rounds: CourseRound[]) => {
    queryClient.setQueryData(keys.rounds(courseId), rounds);
    queryClient.invalidateQueries({ queryKey: keys.courses });
    queryClient.invalidateQueries({ queryKey: keys.courseInfo(courseId) });
    queryClient.invalidateQueries({ queryKey: keys.overviewRoot });
  };
}

export function useReleaseRound(round: CourseRound) {
  const setRounds = useSetRounds(round.courseId);
  return useMutation({
    mutationFn: async (change: { scores?: boolean; feedback?: boolean }) => {
      const res = await api.patch<ApiResponse<CourseRound[]>>(`/rounds/${round.id}/release`, change);
      return res.data.data;
    },
    onSuccess: setRounds,
  });
}
