import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu email")
    .email("Digite um email válido"),
  password: z
    .string()
    .min(1, "Informe sua senha"),
  rememberMe: z.boolean().default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
