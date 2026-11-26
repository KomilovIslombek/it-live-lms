import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/features/auth/auth-api";

const roleStyle: Record<Role, string> = {
  admin: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  mentor: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  assistant:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  student:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge className={cn("border-transparent capitalize", roleStyle[role])}>
      {role}
    </Badge>
  );
}
