import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, Layers, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { api } from "@/lib/api";

interface MentorCourse {
  id: number;
  title: string;
  banner: string;
  status: boolean;
  category: string;
  level: string;
  sections_count: number;
  lessons_count: number;
  students_count: number;
}

export function MentorCoursesPage() {
  const courses = useQuery({
    queryKey: ["mentor", "courses"],
    queryFn: () =>
      api<{ courses: MentorCourse[] }>("/mentor/courses").then(
        (r) => r.courses,
      ),
  });

  return (
    <>
      <PageHeader
        title="My courses"
        description="The courses an admin linked you to as a mentor."
      />
      {courses.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : courses.isError ? (
        <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
      ) : courses.data.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No courses yet"
          description="When an admin links you to a course, it shows up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.data.map((course) => (
            <Card key={course.id} className="gap-0 overflow-hidden py-0">
              <div className="relative aspect-[16/8] bg-muted">
                <img
                  src={course.banner}
                  alt=""
                  className="size-full object-cover"
                />
                {!course.status && (
                  <Badge variant="secondary" className="absolute top-3 left-3">
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="space-y-3 p-4">
                <h3 className="font-semibold">{course.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{course.category}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                  <Metric
                    icon={<Layers />}
                    label="Sections"
                    value={course.sections_count}
                  />
                  <Metric
                    icon={<FileText />}
                    label="Lessons"
                    value={course.lessons_count}
                  />
                  <Metric
                    icon={<Users />}
                    label="Students"
                    value={course.students_count}
                  />
                </dl>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground [&_svg]:size-3">
        {icon}
        {label}
      </dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
