"use client";

import { useState, type FormEvent } from "react";

export default function RecoverOwnerPage() {
  const [email, setEmail] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirm) {
      setMessage("Las nuevas contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 14 || newPassword.length > 128) {
      setMessage("Usa una contraseña de entre 14 y 128 caracteres.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/owner-recovery", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ email, setupToken, newPassword }),
      });
      const payload: unknown = await response.json();
      const text = payload && typeof payload === "object" &&
        "message" in payload && typeof payload.message === "string"
        ? payload.message : "No se ha podido completar la recuperación.";
      setSetupToken("");
      setNewPassword("");
      setConfirm("");
      setMessage(text);
      if (response.ok) setDone(true);
    } catch {
      setMessage("No se ha podido conectar con el servidor.");
      setSetupToken("");
      setNewPassword("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  }

  const input: React.CSSProperties = { display: "block", boxSizing: "border-box", width: "100%", padding: 11, marginTop: 6 };

  return (
    <main style={{ maxWidth: 470, margin: "70px auto", padding: 24, fontFamily: "Arial,sans-serif" }}>
      <h1>Patrick Rick · Recuperar acceso</h1>
      <p>Restablecimiento privado y de un solo uso. No hace falta conocer la contraseña anterior.</p>
      {!done ? (
        <form onSubmit={submit} style={{ display: "grid", gap: 16 }} autoComplete="off">
          <label>Correo autorizado
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={input} autoComplete="username" />
          </label>
          <label>Clave privada PATRICK_SETUP_TOKEN
            <input type="password" required value={setupToken} onChange={e => setSetupToken(e.target.value)} style={input} autoComplete="off" />
          </label>
          <label>Nueva contraseña (14 caracteres como mínimo)
            <input type="password" required minLength={14} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={input} autoComplete="new-password" />
          </label>
          <label>Confirmar nueva contraseña
            <input type="password" required minLength={14} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} style={input} autoComplete="new-password" />
          </label>
          <button type="submit" disabled={busy} style={{ padding: 13 }}>
            {busy ? "Restableciendo…" : "Guardar nueva contraseña"}
          </button>
        </form>
      ) : (
        <p><a href="/sign-in">Ir a iniciar sesión</a></p>
      )}
      <p role="status">{message}</p>
      <p style={{ fontSize: 13, color: "#666" }}>La clave y la contraseña solo se envían al servidor. No las compartas por chat.</p>
    </main>
  );
}
