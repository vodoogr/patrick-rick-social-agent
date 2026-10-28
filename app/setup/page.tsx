"use client";

import { useState } from "react";

export default function OwnerSetup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-patrick-setup-token": setupToken },
        body: JSON.stringify({ name: "Patrick Rick Admin", email, password }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Registro rechazado");
      setSetupToken("");
      setMessage("Cuenta privada creada. Entra ahora en /sign-in para iniciar sesión.");
    } catch {
      setMessage("No se ha podido crear la cuenta. Comprueba la clave de instalación, el correo autorizado y la migración.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: "70px auto", fontFamily: "Arial,sans-serif", padding: 24 }}>
      <h1>Patrick Rick · Primer acceso</h1>
      <p>Uso exclusivo del propietario. Introduce aquí la clave PATRICK_SETUP_TOKEN que guardaste en Vercel. Nunca la envíes por chat.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>Correo autorizado<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }}/></label>
        <label>Nueva contraseña<input type="password" minLength={14} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }}/></label>
        <label>Clave privada de instalación<input type="password" required autoComplete="off" value={setupToken} onChange={e => setSetupToken(e.target.value)} style={{ display: "block", width: "100%", padding: 10 }}/></label>
        <button disabled={busy} type="submit" style={{ padding: 13 }}>{busy ? "Verificando…" : "Crear acceso privado"}</button>
      </form>
      <p role="status">{message}</p>
    </main>
  );
}
