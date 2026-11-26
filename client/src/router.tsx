import { createBrowserRouter } from "react-router";
import { AppShell } from "@/components/app-shell";
import { NoPanelPage, NotFoundPage } from "@/components/status-pages";
import { LoginPage } from "@/features/auth/login-page";
import { HomeRedirect, RequireRole } from "@/features/auth/require-role";
import { DashboardPage } from "@/features/admin/dashboard-page";
import { UsersPage } from "@/features/admin/users-page";
import { CoursesPage } from "@/features/admin/courses-page";
import { CatalogPage } from "@/features/admin/catalog-page";
import { MentorCoursesPage } from "@/features/mentor/mentor-courses-page";
import { StudentCoursesPage } from "@/features/student/student-courses-page";
import { StudentCoursePage } from "@/features/student/student-course-page";

export const router = createBrowserRouter([
  { path: "/", element: <HomeRedirect /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireRole roles={["assistant"]} />,
    children: [{ path: "/no-panel", element: <NoPanelPage /> }],
  },
  {
    element: <RequireRole roles={["admin"]} />,
    children: [
      {
        path: "/admin",
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "courses", element: <CoursesPage /> },
          { path: "catalog", element: <CatalogPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole roles={["mentor"]} />,
    children: [
      {
        path: "/mentor",
        element: <AppShell />,
        children: [{ index: true, element: <MentorCoursesPage /> }],
      },
    ],
  },
  {
    element: <RequireRole roles={["student"]} />,
    children: [
      {
        path: "/student",
        element: <AppShell />,
        children: [
          { index: true, element: <StudentCoursesPage /> },
          { path: "courses/:courseId", element: <StudentCoursePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
