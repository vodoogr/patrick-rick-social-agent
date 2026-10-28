import { auth } from "@/lib/auth";
import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";
import ConsentActions from "./consent-actions";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function ConsentPage({ searchParams }: { searchParams: Params }) {
  const incoming = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string") qs.set(key, value);
    if (Array.isArray(value)) value.forEach(v => qs.append(key, v));
  }
  const context = await auth.$context;
  const valid = await verifyOAuthQueryParams(qs.toString(), context.secret);
  if (!valid) {
    return <main style={{ padding: 32 }}>Solicitud de autorización inválida o caducada.</main>;
  }
  return (
    <main style={{ maxWidth: 550, margin: "70px auto", fontFamily: "Arial,sans-serif", padding: 24 }}>
      <h1>Patrick Rick · Autorizar ChatGPT</h1>
      <p>Cliente solicitante: <strong>{qs.get("client_id")}</strong></p>
      <p>Permisos solicitados: <strong>{qs.get("scope")}</strong></p>
      <p>Solo se permite consultar y crear borradores. No hay herramientas de publicación.</p>
      <ConsentActions />
    </main>
  );
}
