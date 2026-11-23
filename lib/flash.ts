import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Redirects back to the page the form was submitted from with a message in the
 * query string (?error=... or ?ok=...). Pages show it with <Flash />.
 */
export async function backTo(kind: "error" | "ok", message: string): Promise<never> {
  const ref = (await headers()).get("referer");
  let url: URL;
  try {
    url = new URL(ref ?? "http://local/dashboard");
  } catch {
    url = new URL("http://local/dashboard");
  }
  url.searchParams.delete("error");
  url.searchParams.delete("ok");
  url.searchParams.set(kind, message);
  redirect(url.pathname + url.search);
}

export const fail = (message: string) => backTo("error", message);
export const done = (message: string) => backTo("ok", message);
