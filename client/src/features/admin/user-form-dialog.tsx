import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
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
import { applyServerErrors } from "@/lib/form-errors";
import { useCreateUser } from "./admin-api";

const userSchema = z.object({
  full_name: z.string().trim().min(1, "Enter the full name").max(255),
  phone: z
    .string()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+998\d{9}$/, "Use +998 followed by 9 digits")),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "At most 72 characters"),
  role: z.enum(["admin", "mentor", "assistant", "student"]),
  email: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value.toLowerCase()))
    .pipe(z.email("Enter a valid email").nullable()),
});

const fields = ["full_name", "phone", "password", "role", "email"] as const;

const defaults = {
  full_name: "",
  phone: "+998",
  password: "",
  role: "student" as const,
  email: "",
};

export function UserFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();
  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: defaults,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) =>
    createUser.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`${user.full_name} was added as ${user.role}`);
        onOpenChange(false);
      },
      onError: (error) => applyServerErrors(error, form.setError, fields),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            They sign in with this phone number and password.
          </DialogDescription>
        </DialogHeader>

        <form id="user-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {errors.root?.server && (
              <Alert variant="destructive">
                <AlertDescription>
                  {errors.root.server.message}
                </AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!errors.full_name}>
              <FieldLabel htmlFor="full_name">Full name</FieldLabel>
              <Input
                id="full_name"
                aria-invalid={!!errors.full_name}
                {...form.register("full_name")}
              />
              <FieldError errors={[errors.full_name]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="new-phone">Phone</FieldLabel>
                <Input
                  id="new-phone"
                  type="tel"
                  aria-invalid={!!errors.phone}
                  {...form.register("phone")}
                />
                <FieldError errors={[errors.phone]} />
              </Field>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.role]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="new-password">Password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">
                Email <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                aria-invalid={!!errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={createUser.isPending}
          >
            {createUser.isPending && <Spinner />}
            Add user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
