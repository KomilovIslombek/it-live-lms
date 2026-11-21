import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
