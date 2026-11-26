import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/states";
import { applyServerErrors } from "@/lib/form-errors";
import {
  useCategories,
  useCourse,
  useLevels,
  useSaveCourse,
  type Course,
} from "./admin-api";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BANNER_MB = 500;

const bannerFile = z
  .instanceof(File)
  .refine(
    (file) => IMAGE_TYPES.includes(file.type),
    "Use jpg, png, webp or gif",
  )
  .refine(
    (file) => file.size <= MAX_BANNER_MB * 1024 * 1024,
    `At most ${MAX_BANNER_MB} MB`,
  )
  .nullable();

const courseSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(255),
  description: z.string().trim().min(1, "Describe the course"),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "A number like 1200000 (0 = free)"),
  category_id: z.string().min(1, "Pick a category"),
  level_id: z.string().min(1, "Pick a level"),
  status: z.boolean(),
  banner: bannerFile,
});

const newCourseSchema = courseSchema.extend({
  banner: bannerFile.refine((file) => file !== null, "Upload a banner image"),
});

type CourseForm = z.input<typeof courseSchema>;

const fields = [
  "title",
  "description",
  "price",
  "category_id",
  "level_id",
  "status",
  "banner",
] as const;

function toFormValues(course?: Course): CourseForm {
  return {
    title: course?.title ?? "",
    description: course?.description ?? "",
    price: course ? String(Number(course.price)) : "",
    category_id: course ? String(course.category_id) : "",
    level_id: course ? String(course.level_id) : "",
    status: course?.status ?? true,
    banner: null,
  };
}

export function CourseFormDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const course = useCourse(open ? courseId : null);
  const isEdit = courseId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Change the details students see. Leave the banner empty to keep the current one."
              : "Students see the banner, title, description and price."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && course.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-24" />
            <Skeleton className="h-9" />
          </div>
        ) : isEdit && course.isError ? (
          <ErrorState error={course.error} onRetry={() => course.refetch()} />
        ) : (
          <CourseFormBody
            key={course.data?.id ?? "new"}
            course={isEdit ? course.data : undefined}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseFormBody({
  course,
  onDone,
}: {
  course?: Course;
  onDone: () => void;
}) {
  const categories = useCategories();
  const levels = useLevels();
  const save = useSaveCourse();
  const form = useForm({
    resolver: zodResolver(course ? courseSchema : newCourseSchema),
    defaultValues: toFormValues(course),
  });
  const { errors } = form.formState;
  const [preview, setPreview] = useState<string | null>(course?.banner ?? null);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  const pickBanner = (file: File | null) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = file ? URL.createObjectURL(file) : null;
    setPreview(objectUrl.current ?? course?.banner ?? null);
  };

  const onSubmit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("title", values.title);
    data.set("description", values.description);
    data.set("price", values.price);
    data.set("category_id", values.category_id);
    data.set("level_id", values.level_id);
    data.set("status", String(values.status));
    if (values.banner) data.set("banner", values.banner);

    save.mutate(
      { id: course?.id ?? null, form: data },
      {
        onSuccess: ({ course: saved }) => {
          toast.success(
            course ? "Course saved" : `“${saved.title}” was created`,
          );
          onDone();
        },
        onError: (error) => applyServerErrors(error, form.setError, fields),
      },
    );
  });

  const catalogMissing =
    (categories.isSuccess && categories.data.length === 0) ||
    (levels.isSuccess && levels.data.length === 0);

  return (
    <>
      <form id="course-form" onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {errors.root?.server && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.server.message}</AlertDescription>
            </Alert>
          )}
          {catalogMissing && (
            <Alert>
              <AlertDescription>
                A course needs a category and a level.{" "}
                <Link to="/admin/catalog" className="font-medium underline">
                  Add them first
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}

          <Field data-invalid={!!errors.banner}>
            <FieldLabel htmlFor="banner">Banner</FieldLabel>
            <label
              htmlFor="banner"
              className="group relative flex aspect-[16/7] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors hover:bg-muted"
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Banner preview"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <span className="relative rounded-md bg-background/90 px-2.5 py-1 text-xs font-medium opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    Change image
                  </span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                  <ImageUp className="size-5" />
                  Click to upload an image
                </span>
              )}
            </label>
            <Controller
              control={form.control}
              name="banner"
              render={({ field }) => (
                <input
                  id="banner"
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    field.onChange(file);
                    pickBanner(file);
                  }}
                />
              )}
            />
            <FieldDescription>jpg, png, webp or gif.</FieldDescription>
            <FieldError errors={[errors.banner]} />
          </Field>

          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="Frontend with React"
              aria-invalid={!!errors.title}
              {...form.register("title")}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              rows={4}
              aria-invalid={!!errors.description}
              {...form.register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!errors.price}>
              <FieldLabel htmlFor="price">Price, UZS</FieldLabel>
              <Input
                id="price"
                inputMode="decimal"
                placeholder="1200000"
                aria-invalid={!!errors.price}
                {...form.register("price")}
              />
              <FieldError errors={[errors.price]} />
            </Field>
            <Field data-invalid={!!errors.category_id}>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Controller
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!categories.isSuccess}
                  >
                    <SelectTrigger
                      id="category"
                      className="w-full"
                      aria-invalid={!!errors.category_id}
                    >
                      <SelectValue
                        placeholder={
                          categories.isPending ? "Loading…" : "Choose"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.data?.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={String(category.id)}
                        >
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category_id]} />
            </Field>
            <Field data-invalid={!!errors.level_id}>
              <FieldLabel htmlFor="level">Level</FieldLabel>
              <Controller
                control={form.control}
                name="level_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!levels.isSuccess}
                  >
                    <SelectTrigger
                      id="level"
                      className="w-full"
                      aria-invalid={!!errors.level_id}
                    >
                      <SelectValue
                        placeholder={levels.isPending ? "Loading…" : "Choose"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.data?.map((level) => (
                        <SelectItem key={level.id} value={String(level.id)}>
                          {level.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.level_id]} />
            </Field>
          </div>

          <Field orientation="horizontal">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Switch
                  id="status"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FieldLabel htmlFor="status" className="font-normal">
              Published: enrolled students can open it
            </FieldLabel>
          </Field>
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" form="course-form" disabled={save.isPending}>
          {save.isPending && <Spinner />}
          {course ? "Save changes" : "Create course"}
        </Button>
      </DialogFooter>
    </>
  );
}
