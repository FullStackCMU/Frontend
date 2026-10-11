import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvaluation } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { Evaluation } from "../types";

// ฟอร์มตั้งค่าเริ่มจากคำตอบที่โหลดมาครั้งเดียว — ต้องเป็นของล่าสุดเสมอ (ไม่เก็บ cache ข้ามหน้า)
// และไม่โหลดซ้ำระหว่างกรอก
export function useEvaluation(roundId: string) {
  return useQuery({
    queryKey: keys.evaluation(roundId),
    queryFn: () => fetchEvaluation(roundId),
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

// backend คืนแบบประเมินล่าสุดทุกครั้งที่บันทึก/ส่ง — สถานะการส่งในหน้าอื่นต้องโหลดใหม่
export function useSetEvaluation(courseId: string, roundId: string) {
  const queryClient = useQueryClient();
  return (evaluation: Evaluation) => {
    queryClient.setQueryData(keys.evaluation(roundId), evaluation);
    queryClient.invalidateQueries({ queryKey: keys.rounds(courseId) });
    queryClient.invalidateQueries({ queryKey: keys.assignments });
  };
}
