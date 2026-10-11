import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { Course } from "../types";

const getCourses = () => getData<Course[]>("/courses");
const instructorOnly = (courses: Course[]) => courses.filter((c) => c.role === "instructor");
const studentOnly = (courses: Course[]) => courses.filter((c) => c.role === "student");

export function useInstructorCourses() {
  return useQuery({ queryKey: keys.courses, queryFn: getCourses, select: instructorOnly });
}

export function useStudentCourses() {
  return useQuery({ queryKey: keys.courses, queryFn: getCourses, select: studentOnly });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: keys.courseInfo(courseId),
    queryFn: () => getData<Course>(`/courses/${courseId}`),
    enabled: !!courseId,
  });
}

// เรียกหลังแก้อะไรก็ตามในวิชา (รายชื่อ, กลุ่ม, การเข้า/ออกกลุ่ม) — ข้อมูลของวิชาและสรุปที่คำนวณจากมันโหลดใหม่
export function useCourseChanged(courseId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.course(courseId) });
    queryClient.invalidateQueries({ queryKey: keys.courses });
    queryClient.invalidateQueries({ queryKey: keys.assignments });
    queryClient.invalidateQueries({ queryKey: keys.overviewRoot });
  };
}
