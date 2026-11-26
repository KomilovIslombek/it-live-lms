import type { LucideIcon } from "lucide-react";
import { BookOpen, GraduationCap, Tags, UserCheck, Users } from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { formatDate, formatPrice, plural } from "@/lib/format";
import { useCourses, useStats, useUsers } from "./admin-api";
import { RoleBadge } from "./role-badge";

const roleOrder = ["student", "mentor", "assistant", "admin"];

export function DashboardPage() {
  const stats = useStats();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What's happening in the school right now."
      />

      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.isPending ? (
            Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Users"
                value={stats.data.users.total}
                hint={`${stats.data.users.active} active`}
              />
              <StatCard
                icon={BookOpen}
                label="Courses"
                value={stats.data.courses.total}
                hint={`${stats.data.courses.active} published`}
              />
              <StatCard
                icon={UserCheck}
                label="Enrollments"
                value={stats.data.enrollments}
                hint="Students in courses"
              />
              <StatCard
                icon={Tags}
                label="Categories"
                value={stats.data.categories}
                hint="Course topics"
              />
            </>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Users by role</CardTitle>
            <CardDescription>Everyone with an account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.isPending
              ? Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))
              : stats.isSuccess &&
                roleOrder.map((role) => {
                  const count = stats.data.users.by_role[role] ?? 0;
                  const share = stats.data.users.total
                    ? (count / stats.data.users.total) * 100
                    : 0;
                  return (
                    <div key={role} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{role}s</span>
                        <span className="font-medium tabular-nums">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        <RecentUsers />
        <RecentCourses />
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {value.toLocaleString("en-US")}
        </CardTitle>
        <CardAction>
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {hint}
      </CardContent>
    </Card>
  );
}

function RecentUsers() {
  const users = useUsers({ page: 1, limit: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newest users</CardTitle>
        <CardDescription>The last accounts created</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/users">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {users.isPending ? (
          <ListSkeleton />
        ) : users.isError ? (
          <ErrorState error={users.error} onRetry={() => users.refetch()} />
        ) : (
          <ul className="divide-y">
            {users.data.users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(user.created_at)}
                  </div>
                </div>
                <RoleBadge role={user.role} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCourses() {
  const courses = useCourses({ page: 1, limit: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newest courses</CardTitle>
        <CardDescription>The last courses added</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/courses">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {courses.isPending ? (
          <ListSkeleton />
        ) : courses.isError ? (
          <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
        ) : courses.data.courses.length === 0 ? (
          <EmptyState
            icon={<GraduationCap />}
            title="No courses yet"
            description="Courses you create show up here."
            action={
              <Button size="sm" asChild>
                <Link to="/admin/courses">Create a course</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {courses.data.courses.map((course) => (
              <li key={course.id} className="flex items-center gap-3 py-2.5">
                <img
                  src={course.banner}
                  alt=""
                  className="size-10 shrink-0 rounded-md bg-muted object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {course.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plural(course.students_count, "student")} ·{" "}
                    {formatPrice(course.price)}
                  </div>
                </div>
                {!course.status && <Badge variant="outline">Hidden</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}
