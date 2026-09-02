"use client";

import type { ApiResponse } from "@/lib/api";

/**
 * Browser-side wrapper for the CMS API.
 *
 * This is the one place a client component talks to /api. Server components
 * read Prisma directly (see lib/queries.ts); forms and toggles go through
 * here, which is what the API routes are for.
 */

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issues?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...rest } = init;

  const response = await fetch(path, {
    ...rest,
    // Sent so the server's same-origin check has something to read even when
    // the browser omits Sec-Fetch-Site.
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // A non-JSON body means something upstream failed before the handler.
  }

  if (!response.ok || !payload?.success) {
    if (response.status === 401) {
      // The session expired mid-edit. A full document load is deliberate here
      // rather than router.push: the client cache still holds pages rendered
      // for the old session, and only a reload clears it.
      const next = window.location.pathname + window.location.search;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    throw new ApiClientError(
      payload?.error ?? `Request failed (${response.status})`,
      response.status,
      payload?.issues
    );
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json: unknown) =>
    request<T>(path, { method: "POST", json }),
  put: <T>(path: string, json: unknown) =>
    request<T>(path, { method: "PUT", json }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};

/** "Omega Seamaster 2846" -> "omega-seamaster-2846" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
