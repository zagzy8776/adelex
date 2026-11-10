"use client";
import { useState } from "react";
import { Brand } from "@/app/components/Shell";
export default function SignIn() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="admin-login">
      <div className="admin-login-header">
        <Brand />
      </div>
      <form
        className="login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const key = new FormData(e.currentTarget).get("key");
            const r = await fetch("/api/admin/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            });
            if (!r.ok) {
              const data = (await r.json()) as { error: string };
              throw Error(data.error);
            }
            location.replace("/admin");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Dispatch sign-in</h1>
        <label>
          Administrator access key
          <input
            required
            name="key"
            type="password"
            autoComplete="current-password"
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button
          disabled={busy}
          className="button orange"
          style={{ marginTop: 20 }}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
