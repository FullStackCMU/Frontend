import { useQuery } from "@tanstack/react-query";
import { getData } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { FeedbackListItem, RoundFeedback } from "../types";

export function useFeedbackList() {
  return useQuery({ queryKey: keys.feedbackList, queryFn: () => getData<FeedbackListItem[]>("/feedback") });
}

export function useRoundFeedback(roundId: string) {
  return useQuery({
    queryKey: keys.feedback(roundId),
    queryFn: () => getData<RoundFeedback>(`/feedback/rounds/${roundId}`),
  });
}
