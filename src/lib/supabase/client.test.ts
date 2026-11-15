import { createBrowserClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";
import { createClient } from "./client";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => "browser-client"),
}));

describe("createClient (navigateur)", () => {
  it("appelle createBrowserClient avec l'URL et la clé publiques", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const result = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
    );
    expect(result).toBe("browser-client");
  });
});
