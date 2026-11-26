import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Circle, ListTree } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMyCourse, useToggleLesson, type MyLesson } from "./student-api";

export function StudentCoursePage() {
  const courseId = Number(useParams().courseId);
  const course = useMyCourse(courseId);

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" asChild>
        <Link to="/student">
          <ArrowLeft /> My courses
        </Link>
      </Button>

      {course.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : course.isError ? (
        <ErrorState error={course.error} onRetry={() => course.refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border">
              <img
                src={course.data.banner}
                alt=""
                className="aspect-[16/6] w-full bg-muted object-cover"
              />
              <div className="space-y-2 p-5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {course.data.title}
                </h1>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {course.data.description}
                </p>
              </div>
            </div>

            {course.data.sections.length === 0 ? (
              <EmptyState
                icon={<ListTree />}
                title="No lessons yet"
                description="Your mentor hasn't added lessons to this course yet."
              />
            ) : (
              course.data.sections.map((section, index) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardDescription>Section {index + 1}</CardDescription>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No lessons in this section yet.
                      </p>
                    ) : (
                      <ul className="divide-y rounded-lg border">
                        {section.lessons.map((lesson) => (
                          <LessonRow
                            key={lesson.id}
                            courseId={courseId}
                            lesson={lesson}
                          />
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Your progress</CardTitle>
              <CardDescription>
                {course.data.lessons_done} of {course.data.lessons_total}{" "}
                lessons done
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-semibold tabular-nums">
                {course.data.progress_percent}%
              </div>
              <Progress value={course.data.progress_percent} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function LessonRow({
  courseId,
  lesson,
}: {
  courseId: number;
  lesson: MyLesson;
}) {
  const toggle = useToggleLesson(courseId);

  const onToggle = () =>
    toggle.mutate(
      { lessonId: lesson.id, done: !lesson.completed },
      { onError: (error) => toast.error(errorMessage(error)) },
    );

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      {lesson.completed ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span
        className={cn(
          "flex-1 text-sm",
          lesson.completed && "text-muted-foreground line-through",
        )}
      >
        {lesson.title}
      </span>
      <Button
        variant={lesson.completed ? "ghost" : "outline"}
        size="sm"
        onClick={onToggle}
        disabled={toggle.isPending}
      >
        {lesson.completed ? "Undo" : "Mark as done"}
      </Button>
    </li>
  );
}
