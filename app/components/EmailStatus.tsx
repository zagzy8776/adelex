"use client";
import { useCallback, useEffect, useState } from "react";
type Row = {
  id: string;
  kind: string;
  recipient: string;
  status: string;
  createdAt: string;
  lastError: string | null;
};
const names: Record<string, string> = {
  request: "Request receipt",
  booking: "Booking confirmation",
  milestone: "Tracking update",
  replacement: "Replacement tracking link",
  correction: "Milestone correction",
  estimate: "Delivery estimate",
};
export function EmailStatus() {
  const [data, setData] = useState<{ configured: boolean; rows: Row[] } | null>(
      null,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const r = await fetch("/api/admin/email", { cache: "no-store" });
    if (!r.ok) throw Error("Email activity is unavailable.");
    setData((await r.json()) as { configured: boolean; rows: Row[] });
  }, []);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);
  async function run(id?: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(result.error || "Email retry failed.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel settings-form" style={{ marginTop: 20 }}>
      <h2>Customer emails</h2>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {data ? (
        <>
          <p className="text-sm muted">
            {data.configured
              ? "Sending is configured. Accepted means the email provider accepted the message for delivery."
              : "Sending is paused until an email provider key and verified sender address are configured."}
          </p>
          <div className="form-actions">
            <button
              disabled={busy}
              className="button outline small"
              onClick={() => refresh().catch((e) => setError(e.message))}
            >
              Refresh activity
            </button>
            <button
              className="button orange small"
              disabled={!data.configured || busy}
              onClick={() => run()}
            >
              Process pending emails
            </button>
          </div>
          {data.rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Recipient</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {names[r.kind] || r.kind}
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                      </td>
                      <td>{r.recipient}</td>
                      <td>
                        {r.status}
                        {r.lastError && <span>{r.lastError}</span>}
                        {r.status === "failed" && data.configured && (
                          <button
                            disabled={busy}
                            className="link-button"
                            onClick={() => run(r.id)}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted text-sm">
              New customer notifications will appear here.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm">Loading email activity…</p>
      )}
    </section>
  );
}
