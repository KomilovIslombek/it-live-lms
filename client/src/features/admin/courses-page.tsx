import { useState } from "react";
import {
  BookOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/app-shell";
import { PaginationBar } from "@/components/pagination-bar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/states";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  useCategories,
  useCourses,
  useDeleteCourse,
  useLevels,
  type CourseListItem,
} from "./admin-api";
import { CourseFormDialog } from "./course-form-dialog";

const LIMIT = 9;

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [levelId, setLevelId] = useState<number | undefined>();
  const debouncedSearch = useDebouncedValue(search.trim());
  const [dialog, setDialog] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const categories = useCategories();
  const levels = useLevels();

  const courses = useCourses({
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
    category_id: categoryId,
    level_id: levelId,
  });

  const filtered = Boolean(debouncedSearch || categoryId || levelId);
  const openCreate = () => setDialog({ open: true, id: null });

  return (
    <>
      <PageHeader
        title="Courses"
        description="Everything the school teaches."
        actions={
          <Button onClick={openCreate}>
            <Plus /> New course
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title"
            className="pl-8"
            aria-label="Search courses"
          />
        </div>
        <Select
          value={categoryId ? String(categoryId) : "all"}
          onValueChange={(value) => {
            setCategoryId(value === "all" ? undefined : Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Filter by category"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.data?.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={levelId ? String(levelId) : "all"}
          onValueChange={(value) => {
            setLevelId(value === "all" ? undefined : Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full sm:w-40"
            aria-label="Filter by level"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {levels.data?.map((level) => (
              <SelectItem key={level.id} value={String(level.id)}>
                {level.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {courses.isError ? (
        <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
      ) : courses.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : courses.data.total === 0 ? (
        filtered ? (
          <EmptyState
            icon={<Search />}
            title="No courses match"
            description="Try another title, category or level."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategoryId(undefined);
                  setLevelId(undefined);
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="No courses yet"
            description="Create the first course with a banner, price, category and level."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus /> New course
              </Button>
            }
          />
        )
      ) : (
        <>
          <div
            className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${courses.isPlaceholderData ? "opacity-60" : ""}`}
          >
            {courses.data.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => setDialog({ open: true, id: course.id })}
              />
            ))}
          </div>
          <div className="mt-6">
            <PaginationBar
              page={page}
              limit={LIMIT}
              total={courses.data.total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <CourseFormDialog
        courseId={dialog.id}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
      />
    </>
  );
}

function CourseCard({
  course,
  onEdit,
}: {
  course: CourseListItem;
  onEdit: () => void;
}) {
  const deleteCourse = useDeleteCourse();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative aspect-[16/8] bg-muted">
        <img
          src={course.banner}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
        {!course.status && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Hidden
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-snug font-semibold">{course.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mt-1 -mr-2 shrink-0"
                aria-label={`Actions for ${course.title}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{course.category}</Badge>
          <Badge variant="outline">{course.level}</Badge>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="font-semibold tabular-nums">
            {formatPrice(course.price)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            {course.students_count}
          </span>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${course.title}”?`}
        description="Its sections, lessons, materials and exams are deleted too. Courses with payments can only be hidden."
        confirmLabel="Delete course"
        pending={deleteCourse.isPending}
        onConfirm={() =>
          deleteCourse.mutate(course.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success(`“${course.title}” was deleted`);
            },
            onError: (error) => {
              setConfirmDelete(false);
              toast.error(errorMessage(error));
            },
          })
        }
      />
    </Card>
  );
}
