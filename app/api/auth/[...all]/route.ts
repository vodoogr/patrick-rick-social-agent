import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;
export async function POST(request: Request) {
  const response = await handlers.POST(request);
  if (new URL(request.url).pathname === "/api/auth/sign-up/email" && !response.ok) {
    let code = "UNAVAILABLE";
    try {
      const body = await response.clone().json();
      if (typeof body.code === "string" && /^[A-Z_]{1,80}$/.test(body.code)) code = body.code;
    } catch { /* no response body */ }
    console.warn("Owner signup response", { status: response.status, code });
  }
  return response;
}
