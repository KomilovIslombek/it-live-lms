import { useState } from "react";
import { MoreHorizontal, Plus, Search, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatDate, formatPhone } from "@/lib/format";
import { useMe, type Role } from "@/features/auth/auth-api";
import {
  useDeleteUser,
  useSetUserStatus,
  useUsers,
  type UserListItem,
} from "./admin-api";
import { RoleBadge } from "./role-badge";
import { UserFormDialog } from "./user-form-dialog";

const LIMIT = 10;
const roles: Role[] = ["admin", "mentor", "assistant", "student"];
const roleLabel: Record<Role, string> = {
  admin: "Admins",
  mentor: "Mentors",
  assistant: "Assistants",
  student: "Students",
};

function isRole(value: string | null): value is Role {
  return roles.includes(value as Role);
}

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const [creating, setCreating] = useState(false);

  const users = useUsers({
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
    role,
  });

  const filtered = Boolean(debouncedSearch || role);

  return (
    <>
      <PageHeader
        title="Users"
        description="Admins, mentors, assistants and students of the school."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Add user
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
            placeholder="Search by name or phone"
            className="pl-8"
            aria-label="Search users"
          />
        </div>
        <Select
          value={role ?? "all"}
          onValueChange={(value) => {
            setRole(isRole(value) ? value : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabel[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : users.isSuccess && users.data.total === 0 ? (
        filtered ? (
          <EmptyState
            icon={<Search />}
            title="No users match"
            description="Try another name, phone or role."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRole(undefined);
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users />}
            title="No users yet"
            description="Add the first mentor or student."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus /> Add user
              </Button>
            }
          />
        )
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody className={users.isPlaceholderData ? "opacity-60" : ""}>
              {users.isPending
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-4">
                        <Skeleton className="h-6" />
                      </TableCell>
                    </TableRow>
                  ))
                : users.data.users.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))}
            </TableBody>
          </Table>
          {users.isSuccess && (
            <div className="border-t px-4 py-3">
              <PaginationBar
                page={page}
                limit={LIMIT}
                total={users.data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      )}

      <UserFormDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function UserRow({ user }: { user: UserListItem }) {
  const { data: me } = useMe();
  const setStatus = useSetUserStatus();
  const deleteUser = useDeleteUser();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMe = me?.id === user.id;

  const toggleStatus = () =>
    setStatus.mutate(
      { id: user.id, status: !user.status },
      {
        onSuccess: () =>
          toast.success(
            `${user.full_name} is now ${user.status ? "inactive" : "active"}`,
          ),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="font-medium">
          {user.full_name}
          {isMe && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (you)
            </span>
          )}
        </div>
        {user.email && (
          <div className="text-xs text-muted-foreground">{user.email}</div>
        )}
      </TableCell>
      <TableCell className="tabular-nums">{formatPhone(user.phone)}</TableCell>
      <TableCell>
        <RoleBadge role={user.role} />
      </TableCell>
      <TableCell>
        {user.status ? (
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-zinc-400" />
            Inactive
          </Badge>
        )}
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        {formatDate(user.created_at)}
      </TableCell>
      <TableCell className="pr-4 text-right">
        {!isMe && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${user.full_name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={toggleStatus}
                disabled={setStatus.isPending}
              >
                <UserX /> {user.status ? "Deactivate" : "Activate"}
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
        )}
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${user.full_name}?`}
          description="Their account, enrollments and progress are removed. Users with payments can only be deactivated."
          confirmLabel="Delete user"
          pending={deleteUser.isPending}
          onConfirm={() =>
            deleteUser.mutate(user.id, {
              onSuccess: () => {
                setConfirmDelete(false);
                toast.success(`${user.full_name} was deleted`);
              },
              onError: (error) => {
                setConfirmDelete(false);
                toast.error(errorMessage(error));
              },
            })
          }
        />
      </TableCell>
    </TableRow>
  );
}
