import { z } from "zod";

export const idSchema = z.coerce.number().int().positive().max(2147483647);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const statusQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const formNumber = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) =>
      value === ""
        ? undefined
        : typeof value === "string"
          ? Number(value)
          : value,
    schema,
  );

export const formBoolean = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean(),
);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use only a-z, 0-9 and dashes");
