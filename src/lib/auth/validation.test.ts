import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  safeRedirectPath,
  signInSchema,
  signUpSchema,
} from "./validation";

describe("signInSchema", () => {
  it("normalise l'email (espaces + majuscules)", () => {
    const result = signInSchema.parse({ email: "  Alice@Example.COM ", password: "x" });

    expect(result.email).toBe("alice@example.com");
  });

  it("rejette un email invalide", () => {
    const result = signInSchema.safeParse({ email: "pas-un-email", password: "x" });

    expect(result.success).toBe(false);
  });

  it("accepte un mot de passe court (comptes existants)", () => {
    const result = signInSchema.safeParse({ email: "a@b.fr", password: "abc" });

    expect(result.success).toBe(true);
  });

  it("rejette un mot de passe vide", () => {
    const result = signInSchema.safeParse({ email: "a@b.fr", password: "" });

    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepte un email valide et un mot de passe de 8 caractères", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.fr",
      password: "motdepasse",
      confirmPassword: "motdepasse",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un mot de passe trop court", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.fr",
      password: "court",
      confirmPassword: "court",
    });

    expect(result.success).toBe(false);
  });

  it("signale la confirmation quand les mots de passe diffèrent", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.fr",
      password: "motdepasse",
      confirmPassword: "autre-chose",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("normalise l'email", () => {
    const result = forgotPasswordSchema.parse({ email: " Bob@Mail.FR " });

    expect(result.email).toBe("bob@mail.fr");
  });
});

describe("resetPasswordSchema", () => {
  it("rejette des mots de passe différents", () => {
    const result = resetPasswordSchema.safeParse({
      password: "motdepasse",
      confirmPassword: "motdepasse2",
    });

    expect(result.success).toBe(false);
  });

  it("accepte des mots de passe identiques", () => {
    const result = resetPasswordSchema.safeParse({
      password: "motdepasse",
      confirmPassword: "motdepasse",
    });

    expect(result.success).toBe(true);
  });
});

describe("safeRedirectPath", () => {
  it("conserve un chemin interne", () => {
    expect(safeRedirectPath("/documents/123")).toBe("/documents/123");
  });

  it("rejette les redirections ouvertes et retombe sur /", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
  });
});
