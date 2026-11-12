import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;

export async function POST(request: Request) {
  // Owner account is provisioned. Never accept further registration requests.
  // Keep login, session and OAuth endpoints available.
  if (new URL(request.url).pathname === "/api/auth/sign-up/email") {
    return Response.json(
      { message: "Registration closed" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return handlers.POST(request);
}
