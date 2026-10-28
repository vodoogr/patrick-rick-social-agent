"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ConsentActions() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function decide(accept: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const { error } = await authClient.oauth2.consent({ accept });
      if (error) throw new Error("Consent could not be saved");
      setMessage(accept ? "Autorizado. Si no se redirige automáticamente, vuelve a ChatGPT." : "Acceso denegado.");
    } catch {
      setMessage("No se ha podido tramitar el consentimiento. Comprueba que hayas iniciado sesión.");
    } finally {
      setBusy(false);
    }
  }
  return <section style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
    <button disabled={busy} onClick={() => decide(true)} style={{ padding: 12 }}>Permitir</button>
    <button disabled={busy} onClick={() => decide(false)} style={{ padding: 12 }}>Denegar</button>
    <p role="status" style={{ width: "100%" }}>{message}</p>
  </section>;
}
