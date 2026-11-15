import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Adresse email invalide." }));

export const passwordSchema = z
  .string()
  .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
  .max(72, { error: "Le mot de passe ne peut pas dépasser 72 caractères." });

const confirmedPasswordShape = {
  password: passwordSchema,
  confirmPassword: z.string(),
};

const passwordsMatch = {
  error: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
};

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    ...confirmedPasswordShape,
  })
  .refine((data) => data.password === data.confirmPassword, passwordsMatch);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object(confirmedPasswordShape)
  .refine((data) => data.password === data.confirmPassword, passwordsMatch);

// N'accepte qu'un chemin interne ("/documents/123"), pour éviter les
// redirections ouvertes après connexion.
export function safeRedirectPath(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}
