import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;

export async function POST(request: Request) {
  const isOwnerSignup = new URL(request.url).pathname === "/api/auth/sign-up/email";
  if (isOwnerSignup) console.info("OWNER_SIGNUP_REQUEST_RECEIVED");

  const response = await handlers.POST(request);
  if (isOwnerSignup) {
    if (response.ok) {
      console.info("OWNER_SIGNUP_COMPLETED");
    } else {
      // Only inspect a cloned response; never log the body, request headers or credentials.
      let code = "NO_ERROR_CODE";
      let responseFormat = "NON_JSON";
      try {
        const body: unknown = await response.clone().json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
          responseFormat = "JSON_OBJECT";
          const candidate = (body as { code?: unknown }).code;
          if (typeof candidate === "string" && /^[A-Z_]{1,80}$/.test(candidate)) {
            code = candidate;
          }
        } else {
          responseFormat = "OTHER_JSON";
        }
      } catch { /* Do not expose raw response bodies or parser errors. */ }
      console.warn("OWNER_SIGNUP_RESPONSE_FAILED", {
        status: response.status,
        code,
        responseFormat,
      });
    }
  }
  return response;
}
