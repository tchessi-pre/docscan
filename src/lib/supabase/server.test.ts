import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { describe, expect, it, vi } from "vitest";
import { createClient } from "./server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => "server-client"),
}));

const mockCookieStore = {
  getAll: vi.fn(() => [{ name: "sb-session", value: "token" }]),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe("createClient (serveur)", () => {
  it("appelle createServerClient avec les cookies Next.js", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const result = await createClient();

    expect(cookies).toHaveBeenCalled();
    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
    expect(result).toBe("server-client");

    const options = vi.mocked(createServerClient).mock.calls[0][2];
    expect(options?.cookies.getAll()).toEqual([
      { name: "sb-session", value: "token" },
    ]);

    options?.cookies.setAll?.([{ name: "foo", value: "bar", options: {} }], {});
    expect(mockCookieStore.set).toHaveBeenCalledWith("foo", "bar", {});
  });
});
