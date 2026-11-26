import { Navigate, Outlet, useLocation } from "react-router";
import { FullScreenLoader, ErrorState } from "@/components/states";
import { homePathByRole, useMe, type Role } from "./auth-api";

export function RequireRole({ roles }: { roles: Role[] }) {
  const location = useLocation();
  const { data: user, isPending, isError, error, refetch } = useMe();

  if (isPending) return <FullScreenLoader />;

  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={homePathByRole[user.role]} replace />;
  }

  return <Outlet />;
}

export function HomeRedirect() {
  const { data: user, isPending, isError, error, refetch } = useMe();

  if (isPending) return <FullScreenLoader />;
  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return <Navigate to={user ? homePathByRole[user.role] : "/login"} replace />;
}
