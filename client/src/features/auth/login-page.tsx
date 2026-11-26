import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation, useNavigate } from "react-router";
import {
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FullScreenLoader } from "@/components/states";
import { ApiError, errorMessage } from "@/lib/api";
import { homePathByRole, useLogin, useMe } from "./auth-api";

const loginSchema = z.object({
  phone: z
    .string()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\+998\d{9}$/, "Enter the phone as +998 followed by 9 digits"),
    ),
  password: z.string().min(1, "Enter your password"),
});

const highlights = [
  { icon: LayoutDashboard, text: "Admins manage users, courses and content" },
  { icon: Users, text: "Mentors teach their own courses" },
  { icon: BookOpenCheck, text: "Students learn and track their progress" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const me = useMe();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "+998", password: "" },
  });

  if (me.isPending) return <FullScreenLoader />;
  if (me.data) return <Navigate to={homePathByRole[me.data.role]} replace />;

  const from = (location.state as { from?: string } | null)?.from;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        const home = homePathByRole[user.role];
        navigate(from?.startsWith(home) ? from : home, { replace: true });
      },
    }),
  );

  const loginError =
    login.error instanceof ApiError && login.error.status === 401
      ? "Invalid phone or password"
      : login.error
        ? errorMessage(login.error)
        : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-primary/40 blur-3xl"
        />
        <div className="relative flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          IT Live LMS
        </div>
        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            One place to run an online IT school.
          </h1>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-zinc-300">
                <span className="flex size-8 items-center justify-center rounded-md bg-white/10">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-zinc-500">
          Express · PostgreSQL · React · TypeScript
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold lg:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </span>
              IT Live LMS
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use the phone number and password your school gave you.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Field data-invalid={!!form.formState.errors.phone}>
                <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+998 90 123 45 67"
                  aria-invalid={!!form.formState.errors.phone}
                  {...form.register("phone")}
                />
                <FieldError errors={[form.formState.errors.phone]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Button type="submit" size="lg" disabled={login.isPending}>
                {login.isPending && <Spinner />}
                Sign in
              </Button>
            </FieldGroup>
          </form>
        </div>
      </main>
    </div>
  );
}
