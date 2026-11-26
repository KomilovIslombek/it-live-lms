import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MyCourse {
  id: number;
  title: string;
  description: string;
  banner: string;
  category: string;
  level: string;
  enrolled_at: string;
  lessons_done: number;
  lessons_total: number;
  progress_percent: number;
}

export interface MyLesson {
  id: number;
  section_id: number;
  title: string;
  video_url: string | null;
  position: number;
  completed: boolean;
}

export interface MyCourseDetails extends MyCourse {
  sections: {
    id: number;
    title: string;
    position: number;
    lessons: MyLesson[];
  }[];
}

export const studentKeys = {
  courses: ["student", "courses"] as const,
  course: (id: number) => ["student", "courses", id] as const,
};

export function useMyCourses() {
  return useQuery({
    queryKey: studentKeys.courses,
    queryFn: () =>
      api<{ courses: MyCourse[] }>("/student/courses").then((r) => r.courses),
  });
}

export function useMyCourse(id: number) {
  return useQuery({
    queryKey: studentKeys.course(id),
    queryFn: () =>
      api<{ course: MyCourseDetails }>(`/student/courses/${id}`).then(
        (r) => r.course,
      ),
  });
}

export function useToggleLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, done }: { lessonId: number; done: boolean }) =>
      api(`/student/lessons/${lessonId}/complete`, {
        method: done ? "POST" : "DELETE",
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: studentKeys.course(courseId),
        }),
        queryClient.invalidateQueries({
          queryKey: studentKeys.courses,
          exact: true,
        }),
      ]),
  });
}
