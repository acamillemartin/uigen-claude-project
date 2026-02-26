// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// vi.hoisted ensures these are available inside the vi.mock factory (which is hoisted)
const { mockCookieSet } = vi.hoisted(() => ({
  mockCookieSet: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockCookieSet,
      get: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));

import { createSession } from "@/lib/auth";

// Must match the fallback secret used in auth.ts
const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  mockCookieSet.mockClear();
});

test("createSession sets a cookie named 'auth-token'", async () => {
  await createSession("user-123", "test@example.com");
  expect(mockCookieSet).toHaveBeenCalledOnce();
  expect(mockCookieSet.mock.calls[0][0]).toBe("auth-token");
});

test("createSession cookie is httpOnly", async () => {
  await createSession("user-123", "test@example.com");
  const options = mockCookieSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
});

test("createSession cookie has sameSite lax", async () => {
  await createSession("user-123", "test@example.com");
  const options = mockCookieSet.mock.calls[0][2];
  expect(options.sameSite).toBe("lax");
});

test("createSession cookie path is /", async () => {
  await createSession("user-123", "test@example.com");
  const options = mockCookieSet.mock.calls[0][2];
  expect(options.path).toBe("/");
});

test("createSession cookie expires approximately 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const options = mockCookieSet.mock.calls[0][2];
  const expires: Date = options.expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession token is a valid HS256 JWT", async () => {
  await createSession("user-123", "test@example.com");
  const token: string = mockCookieSet.mock.calls[0][1];
  // jwtVerify throws if the token is invalid or the signature doesn't match
  await expect(jwtVerify(token, JWT_SECRET)).resolves.toBeDefined();
});

test("createSession token contains correct userId", async () => {
  await createSession("user-123", "test@example.com");
  const token: string = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
});

test("createSession token contains correct email", async () => {
  await createSession("user-123", "test@example.com");
  const token: string = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.email).toBe("test@example.com");
});

test("createSession token has an expiration claim set", async () => {
  await createSession("user-123", "test@example.com");
  const token: string = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.exp).toBeDefined();
});

test("createSession works with different userId and email values", async () => {
  await createSession("user-abc", "another@example.com");
  const token: string = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-abc");
  expect(payload.email).toBe("another@example.com");
});
