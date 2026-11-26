import { Link } from "react-router";
import { Compass, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { useLogout } from "@/features/auth/auth-api";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        icon={<Compass />}
        title="Page not found"
        description="This address doesn't exist."
        action={
          <Button asChild size="sm">
            <Link to="/">Go home</Link>
          </Button>
        }
      />
    </div>
  );
}

export function NoPanelPage() {
  const logout = useLogout();
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        icon={<ShieldQuestion />}
        title="No panel for your role yet"
        description="The assistant panel isn't built yet. Ask an admin for another role."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Log out
          </Button>
        }
      />
    </div>
  );
}
