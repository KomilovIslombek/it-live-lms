import { useState, type FormEvent } from "react";
import { Layers, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/states";
import { errorMessage } from "@/lib/api";
import {
  useCategories,
  useCreateCatalogItem,
  useDeleteCatalogItem,
  useLevels,
} from "./admin-api";

interface CatalogItem {
  id: number;
  title: string;
  slug: string | null;
  courses_count: number;
}

export function CatalogPage() {
  const categories = useCategories();
  const levels = useLevels();

  return (
    <>
      <PageHeader
        title="Categories & levels"
        description="Every course belongs to one category and one level."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CatalogCard
          kind="categories"
          title="Categories"
          description="Topics such as Frontend, Backend or Design."
          placeholder="e.g. Frontend"
          icon={<Tags />}
          query={categories}
        />
        <CatalogCard
          kind="levels"
          title="Levels"
          description="How hard a course is, such as Beginner or Advanced."
          placeholder="e.g. Beginner"
          icon={<Layers />}
          query={levels}
        />
      </div>
    </>
  );
}

function CatalogCard({
  kind,
  title,
  description,
  placeholder,
  icon,
  query,
}: {
  kind: "categories" | "levels";
  title: string;
  description: string;
  placeholder: string;
  icon: React.ReactNode;
  query: ReturnType<typeof useCategories> | ReturnType<typeof useLevels>;
}) {
  const create = useCreateCatalogItem(kind);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name) {
      setError("Enter a name");
      return;
    }
    create.mutate(name, {
      onSuccess: () => {
        setValue("");
        setError(null);
        toast.success(`“${name}” was added`);
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-1.5" noValidate>
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              aria-label={`New ${kind === "categories" ? "category" : "level"}`}
              aria-invalid={!!error}
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner />}
              Add
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {query.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.data.length === 0 ? (
          <EmptyState
            icon={icon}
            title={`No ${kind} yet`}
            description="Add one above to start creating courses."
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {query.data.map((item) => (
              <CatalogRow key={item.id} kind={kind} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CatalogRow({
  kind,
  item,
}: {
  kind: "categories" | "levels";
  item: CatalogItem;
}) {
  const remove = useDeleteCatalogItem(kind);
  const [confirm, setConfirm] = useState(false);
  const inUse = item.courses_count > 0;

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground">
          {item.courses_count} {item.courses_count === 1 ? "course" : "courses"}
          {item.slug && ` · ${item.slug}`}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setConfirm(true)}
        disabled={inUse}
        title={inUse ? "Used by courses, can't be deleted" : undefined}
        aria-label={`Delete ${item.title}`}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete “${item.title}”?`}
        description="No course uses it, so nothing else changes."
        confirmLabel="Delete"
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(item.id, {
            onSuccess: () => {
              setConfirm(false);
              toast.success(`“${item.title}” was deleted`);
            },
            onError: (error) => {
              setConfirm(false);
              toast.error(errorMessage(error));
            },
          })
        }
      />
    </li>
  );
}
