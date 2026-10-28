"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error("No se ha podido iniciar sesión.");
      setMessage("Sesión iniciada. Continúa la autorización en la ventana de ChatGPT.");
    } catch {
      setMessage("Acceso no autorizado o credenciales incorrectas.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main style={{ maxWidth: 440, margin: "70px auto", fontFamily: "Arial,sans-serif", padding: 24 }}>
      <h1>Patrick Rick · Acceso privado</h1>
      <p>Inicia sesión con la cuenta propietaria para autorizar el agente en ChatGPT.</p>
      <form onSubmit={signIn} style={{ display: "grid", gap: 14 }}>
        <label>Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
        <label>Contraseña<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
        <button type="submit" disabled={busy} style={{ padding: 13 }}>{busy ? "Conectando…" : "Iniciar sesión"}</button>
      </form>
      <p role="status">{message}</p>
      <p>¿Primera vez? El registro del propietario se realiza desde <a href="/setup">configuración inicial</a>.</p>
    </main>
  );
}
