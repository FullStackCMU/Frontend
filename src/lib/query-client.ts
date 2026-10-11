import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx ลองใหม่ก็ได้ผลเดิม — ลองซ้ำครั้งเดียวเฉพาะเน็ตหลุด/5xx
      retry: (failureCount, err) =>
        failureCount < 1 && !(axios.isAxiosError(err) && err.response && err.response.status < 500),
    },
  },
});
