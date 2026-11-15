import { describe, expect, it } from "vitest";
import { translateAuthError } from "./errors";

describe("translateAuthError", () => {
  it("traduit un identifiant invalide", () => {
    expect(translateAuthError("Invalid login credentials")).toBe(
      "Email ou mot de passe incorrect.",
    );
  });

  it("traduit un email déjà utilisé", () => {
    expect(translateAuthError("User already registered")).toBe(
      "Un compte existe déjà avec cet email.",
    );
  });

  it("retombe sur un message générique pour une erreur inconnue", () => {
    expect(translateAuthError("Something unexpected happened")).toBe(
      "Une erreur est survenue. Réessaie.",
    );
  });
});
