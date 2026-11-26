import { Link } from "react-router";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { useMyCourses } from "./student-api";

export function StudentCoursesPage() {
  const courses = useMyCourses();

  return (
    <>
      <PageHeader
        title="My courses"
        description="Pick up where you left off."
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
          title="You're not enrolled yet"
          description="Once the school enrolls you in a course, it shows up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.data.map((course) => (
            <Link
              key={course.id}
              to={`/student/courses/${course.id}`}
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow group-hover:shadow-md">
                <div className="aspect-[16/8] bg-muted">
                  <img
                    src={course.banner}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{course.category}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <div className="mt-auto space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {course.lessons_done} of {course.lessons_total} lessons
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {course.progress_percent}%
                      </span>
                    </div>
                    <Progress value={course.progress_percent} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
