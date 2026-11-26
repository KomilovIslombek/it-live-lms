import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Role } from "@/features/auth/auth-api";

export interface Stats {
  users: { total: number; active: number; by_role: Record<string, number> };
  courses: { total: number; active: number };
  categories: number;
  enrollments: number;
  payments: { succeeded: number; revenue: string; revenue_this_month: string };
}

export interface UserListItem {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: boolean;
  role: Role;
  created_at: string;
}

export interface Page {
  page: number;
  limit: number;
  total: number;
}

export interface UsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
}

export interface NewUser {
  full_name: string;
  phone: string;
  password: string;
  role: Role;
  email?: string | null;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  status: boolean;
  courses_count: number;
}

export interface Level {
  id: number;
  title: string;
  slug: string | null;
  status: boolean;
  courses_count: number;
}

export interface CourseListItem {
  id: number;
  title: string;
  price: string;
  banner: string;
  status: boolean;
  category_id: number;
  category: string;
  level_id: number;
  level: string;
  students_count: number;
  created_at: string;
}

export interface Course extends CourseListItem {
  description: string;
  intro_video: string | null;
}

export interface CoursesQuery {
  page: number;
  limit: number;
  search?: string;
  category_id?: number;
  level_id?: number;
}

export const adminKeys = {
  stats: ["admin", "stats"] as const,
  users: ["admin", "users"] as const,
  categories: ["admin", "categories"] as const,
  levels: ["admin", "levels"] as const,
  courses: ["admin", "courses"] as const,
  course: (id: number) => ["admin", "courses", "detail", id] as const,
};

export function useStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => api<{ stats: Stats }>("/admin/stats").then((r) => r.stats),
  });
}

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: [...adminKeys.users, query],
    queryFn: () =>
      api<{ users: UserListItem[] } & Page>("/admin/users", {
        query: { ...query },
      }),
    placeholderData: keepPreviousData,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly string[])[]) =>
    Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

export function useCreateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (user: NewUser) =>
      api<{ user: UserListItem }>("/admin/users", {
        method: "POST",
        body: user,
      }),
    onSuccess: () => invalidate(adminKeys.users, adminKeys.stats),
  });
}

export function useSetUserStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: boolean }) =>
      api(`/admin/users/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => invalidate(adminKeys.users, adminKeys.stats),
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => api(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(adminKeys.users, adminKeys.stats),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: () =>
      api<{ categories: Category[] }>("/admin/categories").then(
        (r) => r.categories,
      ),
  });
}

export function useLevels() {
  return useQuery({
    queryKey: adminKeys.levels,
    queryFn: () =>
      api<{ levels: Level[] }>("/admin/levels").then((r) => r.levels),
  });
}

type CatalogKind = "categories" | "levels";

export function useCreateCatalogItem(kind: CatalogKind) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (title: string) =>
      api(`/admin/${kind}`, { method: "POST", body: { title } }),
    onSuccess: () => invalidate(adminKeys[kind], adminKeys.stats),
  });
}

export function useDeleteCatalogItem(kind: CatalogKind) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/admin/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(adminKeys[kind], adminKeys.stats),
  });
}

export function useCourses(query: CoursesQuery) {
  return useQuery({
    queryKey: [...adminKeys.courses, "list", query],
    queryFn: () =>
      api<{ courses: CourseListItem[] } & Page>("/admin/courses", {
        query: { ...query },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCourse(id: number | null) {
  return useQuery({
    queryKey: adminKeys.course(id ?? 0),
    queryFn: () =>
      api<{ course: Course }>(`/admin/courses/${id}`).then((r) => r.course),
    enabled: id !== null,
  });
}

export function useSaveCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, form }: { id: number | null; form: FormData }) =>
      api<{ course: Course }>(id ? `/admin/courses/${id}` : "/admin/courses", {
        method: id ? "PATCH" : "POST",
        body: form,
      }),
    onSuccess: () =>
      invalidate(
        adminKeys.courses,
        adminKeys.stats,
        adminKeys.categories,
        adminKeys.levels,
      ),
  });
}

export function useDeleteCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/admin/courses/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      invalidate(
        adminKeys.courses,
        adminKeys.stats,
        adminKeys.categories,
        adminKeys.levels,
      ),
  });
}
