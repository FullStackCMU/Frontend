import { useQuery } from "@tanstack/react-query";
import { getData } from "../lib/api";
import { keys } from "../lib/query-keys";
import type { AvailableGroup, CourseStudent, GroupsOverview, MyGroup } from "../types";

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: keys.students(courseId),
    queryFn: () => getData<CourseStudent[]>(`/courses/${courseId}/students`),
  });
}

export function useCourseGroups(courseId: string) {
  return useQuery({
    queryKey: keys.groups(courseId),
    queryFn: () => getData<GroupsOverview>(`/groups?courseId=${courseId}`),
  });
}

// data = null คือยังไม่มีกลุ่ม (undefined = กำลังโหลด)
export function useMyGroup(courseId: string) {
  return useQuery({
    queryKey: keys.myGroup(courseId),
    queryFn: () => getData<MyGroup | null>(`/groups/my?courseId=${courseId}`),
  });
}

export function useAvailableGroups(courseId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.availableGroups(courseId),
    queryFn: () => getData<AvailableGroup[]>(`/groups/available?courseId=${courseId}`),
    enabled,
  });
}
