"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  LayoutDashboard,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  X,
  MapPin,
  Copy,
  Send,
  Navigation,
  ShieldCheck,
  Info,
  LoaderCircle,
  Menu,
  Download,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Brand } from "@/app/components/Shell";
import { EmailStatus } from "@/app/components/EmailStatus";
import PlacePicker from "@/app/components/PlacePicker";
import ShipmentMap from "@/app/components/ShipmentMap";
import {
  type Shipment,
  type PublicShipment,
  type BusinessSettings,
  services,
  statuses,
  statusLabels,
  displayDate,
} from "@/app/lib/domain";

type RequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  service: string;
  description: string;
  weight: number;
  status: string;
  createdAt: string;
};
type Session = {
  sitesHost: boolean;
  authorized: boolean;
  canClaim: boolean;
  signedIn: boolean;
  name: string;
};
type Tab = "overview" | "shipments" | "requests" | "settings";
const blankSettings = {
  contactEmail: "",
  contactPhone: "",
  address: "",
  businessHours: "",
};
async function api(data: unknown) {
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const d = (await r.json()) as {
    error: string;
    id: string;
    code: string;
    token: string;
    expiresAt: string;
    shipment: Shipment;
    shipments: Shipment[];
    requests: RequestRow[];
    settings: BusinessSettings;
  } & Session;
  if (!r.ok) throw new Error(d.error || "Request failed.");
  return d;
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const all = dialog.current?.querySelectorAll<HTMLElement>(
          'button,a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!all?.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={dialog}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Label({
  children,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  children: React.ReactNode;
}) {
  return (
    <label>
      {children}
      <input {...props} />
    </label>
  );
}
function localDate(date: string) {
  if (!date) return "";
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function dateISO(value: FormDataEntryValue | null) {
  return value ? new Date(String(value)).toISOString() : "";
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null),
    [tab, setTab] = useState<Tab>("overview"),
    [shipments, setShipments] = useState<Shipment[]>([]),
    [requests, setRequests] = useState<RequestRow[]>([]),
    [settings, setSettings] = useState<BusinessSettings>(blankSettings),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [newOpen, setNewOpen] = useState(false),
    [editing, setEditing] = useState<Shipment | null>(null),
    [nextOffset, setNextOffset] = useState<number | null>(null),
    [selected, setSelected] = useState<Shipment | null>(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [share, setShare] = useState<{
      url: string;
      title: string;
      code?: string;
      email?: string;
    } | null>(null),
    [busy, setBusy] = useState(false);
  const notify = useCallback((s: string) => setToast(s), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const load = useCallback(async () => {
    const r = await fetch("/api/admin");
    const d = (await r.json()) as {
      error: string;
      id: string;
      code: string;
      token: string;
      expiresAt: string;
      shipment: Shipment;
      shipments: Shipment[];
      requests: RequestRow[];
      settings: BusinessSettings;
    } & Session;
    if (!r.ok) throw new Error(d.error);
    setNextOffset(
      d.shipments.length === 200 || d.requests.length === 200 ? 200 : null,
    );
    setShipments(d.shipments);
    setRequests(d.requests);
    setSettings(d.settings);
  }, []);
  async function loadOlder() {
    if (nextOffset === null || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin?offset=" + nextOffset);
      const d = (await r.json()) as {
        shipments: Shipment[];
        requests: RequestRow[];
        error: string;
      };
      if (!r.ok) throw new Error(d.error);
      setShipments((old) => [
        ...new Map([...old, ...d.shipments].map((x) => [x.id, x])).values(),
      ]);
      setRequests((old) => [
        ...new Map([...old, ...d.requests].map((x) => [x.id, x])).values(),
      ]);
      setNextOffset(
        d.shipments.length === 200 || d.requests.length === 200
          ? nextOffset + 200
          : null,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const init = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin?session=1");
      const d = (await r.json()) as {
        error: string;
        id: string;
        code: string;
        token: string;
        expiresAt: string;
        shipment: Shipment;
        shipments: Shipment[];
        requests: RequestRow[];
        settings: BusinessSettings;
      } & Session;
      if (!r.ok) throw new Error(d.error);
      setSession(d);
      if (d.authorized) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    init();
  }, [init]);
  async function claim() {
    setBusy(true);
    setError("");
    try {
      await api({ action: "claim" });
      await init();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function open(s: Shipment) {
    setError("");
    try {
      const r = await fetch("/api/admin?id=" + s.id);
      const d = (await r.json()) as {
        error: string;
        id: string;
        code: string;
        token: string;
        expiresAt: string;
        shipment: Shipment;
        shipments: Shipment[];
        requests: RequestRow[];
        settings: BusinessSettings;
      } & Session;
      if (!r.ok) throw new Error(d.error);
      setSelected(d.shipment);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify("Link copied to clipboard.");
    } catch {
      notify("Select and copy the link shown in the field.");
    }
  }
  const trackingLink = (code: string) =>
    location.origin + "/track?code=" + encodeURIComponent(code);
  const shareTracking = (s: Shipment) =>
    setShare({
      url: trackingLink(s.code),
      title: "Share customer tracking",
      code: s.code,
      email: s.recipientEmail,
    });
  const filtered = shipments.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      [s.code, s.recipientName, s.origin, s.destination]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const active = shipments.filter(
    (s) => !["delivered", "cancelled"].includes(s.status),
  );
  if (!session?.authorized)
    return (
      <div className="admin-login">
        <div className="admin-login-header">
          <Brand />
          <a href="/" className="text-link">
            Back to website <ArrowUpRight size={15} />
          </a>
        </div>
        <main className="login-card">
          <div className="login-icon">
            <ShieldCheck size={28} />
          </div>
          <span className="eyebrow">ADEXEC OPERATIONS</span>
          <h1>
            {session?.canClaim
              ? "Make it your control centre."
              : "Good to have you back."}
          </h1>
          <p>
            {loading
              ? "Checking your access…"
              : session?.canClaim
                ? "Activate your administrator account to manage shipments, customer requests, and tracking updates."
                : !session?.sitesHost
                  ? "/admin/login"
                  : session?.signedIn
                    ? "This account is not the designated administrator. Sign in with the account that manages this business."
                    : "Sign in to your secure dashboard to keep every shipment moving."}
          </p>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          {loading ? (
            <LoaderCircle className="spinner" />
          ) : session?.canClaim ? (
            <button className="button orange" onClick={claim} disabled={busy}>
              Activate admin dashboard <ArrowRight size={18} />
            </button>
          ) : (
            <a
              className="button orange"
              href={
                !session?.sitesHost
                  ? "/admin/login"
                  : session?.signedIn
                    ? "/signout-with-chatgpt?return_to=%2Fadmin"
                    : "/signin-with-chatgpt?return_to=%2Fadmin"
              }
              target="_top"
            >
              {session?.sitesHost
                ? session.signedIn
                  ? "Switch account"
                  : "Sign in with ChatGPT"
                : "Dispatch sign-in"}
              <ArrowRight size={18} />
            </a>
          )}
          {error && (
            <button
              className="link-button"
              style={{ marginTop: 16 }}
              onClick={init}
            >
              Try again
            </button>
          )}
          <div className="login-footnote">
            <ShieldCheck size={13} /> Restricted to authorised ADEXEC personnel
          </div>
        </main>
      </div>
    );
  return (
    <div className="admin-layout">
      <aside className={"admin-sidebar " + (mobile ? "show" : "")}>
        <div className="admin-brand">
          <Brand />
          <button
            className="menu-toggle"
            onClick={() => setMobile(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav>
          {(
            [
              { id: "overview", title: "Overview", icon: LayoutDashboard },
              { id: "shipments", title: "Shipments", icon: Package },
              {
                id: "requests",
                title: "Shipping requests",
                icon: ClipboardList,
              },
              { id: "settings", title: "Business settings", icon: Settings },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "selected" : ""}
              onClick={() => {
                setTab(n.id);
                setMobile(false);
                setError("");
              }}
            >
              <n.icon size={18} />
              {n.title}
              {n.id === "requests" &&
                requests.filter((r) => r.status === "new").length > 0 && (
                  <span className="nav-count">
                    {requests.filter((r) => r.status === "new").length}
                  </span>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noopener">
            View website <ExternalLink size={15} />
          </a>
          <div className="admin-user">
            <div className="avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>{session.name}</span>
            </div>
          </div>
          {session.sitesHost ? (
            <a href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top">
              <LogOut size={15} /> Sign out
            </a>
          ) : (
            <button
              className="link-button"
              onClick={async () => {
                try {
                  const r = await fetch("/api/admin/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "logout" }),
                  });
                  if (!r.ok) throw Error("Sign-out failed. Please try again.");
                  location.replace("/admin/login");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <div className="row">
            <button
              className="icon-button mobile-admin-menu"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <span>
              ADEXEC <ChevronRight size={13} />{" "}
              <strong>
                {tab === "overview"
                  ? "Overview"
                  : tab === "shipments"
                    ? "Shipments"
                    : tab === "requests"
                      ? "Shipping requests"
                      : "Business settings"}
              </strong>
            </span>
          </div>
          <div className="row">
            <span className="admin-badge">
              <span className="live-dot" />
              Operations portal
            </span>
            <div className="avatar small-avatar">A</div>
          </div>
        </header>
        <main className="admin-content">
          {error && (
            <div className="notice error" role="alert">
              <Info size={16} />
              {error}
              <button className="link-button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          <div className="admin-heading">
            <div>
              <span className="eyebrow">YOUR BUSINESS, IN MOTION</span>
              <h1>
                {tab === "overview"
                  ? "Let’s keep things moving."
                  : tab === "shipments"
                    ? "Shipment management."
                    : tab === "requests"
                      ? "Your next opportunities."
                      : "Make it your own."}
              </h1>
              <p>
                {tab === "overview"
                  ? "A clear view of your shipments and what needs your attention."
                  : tab === "shipments"
                    ? "Create shipments, share tracking links, and keep customers informed."
                    : tab === "requests"
                      ? "Review enquiries and follow up with your customers."
                      : "Manage the contact information customers see on your website."}
              </p>
            </div>
            {(tab === "overview" || tab === "shipments") && (
              <button
                className="button orange"
                onClick={() => setNewOpen(true)}
              >
                <Plus size={17} />
                Create shipment
              </button>
            )}
          </div>
          {(tab === "overview" || tab === "shipments") && (
            <>
              <div className="stat-grid">
                {[
                  {
                    label: "Total shipments",
                    value: shipments.length,
                    icon: Package,
                    note: "Loaded shipment records",
                  },
                  {
                    label: "Active shipments",
                    value: active.length,
                    icon: Truck,
                    note: "Booked through delivery",
                  },
                  {
                    label: "Delivered",
                    value: shipments.filter((s) => s.status === "delivered")
                      .length,
                    icon: CheckCircle2,
                    note: "Delivery confirmed",
                  },
                  {
                    label: "New requests",
                    value: requests.filter((r) => r.status === "new").length,
                    icon: ClipboardList,
                    note: "Ready for your review",
                  },
                ].map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div>
                      <span>{s.label}</span>
                      <s.icon size={18} />
                    </div>
                    <strong>{s.value.toString().padStart(2, "0")}</strong>
                    <p>{s.note}</p>
                  </div>
                ))}
              </div>
              {tab === "overview" && (
                <div className="admin-callout">
                  <div className="callout-icon">
                    <Navigation size={25} />
                  </div>
                  <div>
                    <h3>Good communication goes a long way.</h3>
                    <p>
                      Update a shipment’s position or enable driver GPS. Your
                      customer’s tracking page will refresh automatically.
                    </p>
                  </div>
                  <a
                    href="/track?code=ADX-DEMO"
                    target="_blank"
                    rel="noopener"
                    className="button outline small"
                  >
                    Preview tracking <ArrowUpRight size={15} />
                  </a>
                </div>
              )}
              <section className="admin-table-panel">
                <div className="table-heading">
                  <h2>
                    {tab === "overview" ? "Recent shipments" : "All shipments"}{" "}
                    <span>{shipments.length}</span>
                  </h2>
                  <div className="table-tools">
                    <div className="search-field">
                      <Search size={15} />
                      <input
                        placeholder="Search shipments…"
                        aria-label="Search shipments"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter shipment status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {filtered.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Tracking / recipient</th>
                          <th>Route</th>
                          <th>Status</th>
                          <th>Est. delivery</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered
                          .slice(0, tab === "overview" ? 8 : filtered.length)
                          .map((s) => (
                            <tr key={s.id}>
                              <td>
                                <button
                                  className="table-code"
                                  onClick={() => open(s)}
                                >
                                  {s.code}
                                </button>
                                <span>{s.recipientName}</span>
                              </td>
                              <td>
                                <strong>{s.origin}</strong>
                                <span>→ {s.destination}</span>
                              </td>
                              <td>
                                <span className={"status-pill " + s.status}>
                                  {statusLabels[s.status]}
                                </span>
                              </td>
                              <td>{displayDate(s.eta)}</td>
                              <td>
                                <div className="row">
                                  <button
                                    className="icon-button"
                                    title="Share tracking link"
                                    onClick={() => shareTracking(s)}
                                    aria-label={"Share tracking " + s.code}
                                  >
                                    <Copy size={15} />
                                  </button>
                                  <button
                                    className="icon-button"
                                    onClick={() => open(s)}
                                    aria-label={"Manage shipment " + s.code}
                                  >
                                    <ChevronRight size={17} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="table-empty">
                    <Package size={37} />
                    <h3>
                      {shipments.length
                        ? "No matching shipments."
                        : "Your first shipment starts here."}
                    </h3>
                    <p>
                      {shipments.length
                        ? "Try a different search or status."
                        : "Create a shipment to generate a tracking number and start managing its journey."}
                    </p>
                    {!shipments.length && (
                      <button
                        className="button outline small"
                        onClick={() => setNewOpen(true)}
                      >
                        <Plus size={15} />
                        Create shipment
                      </button>
                    )}
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    Showing{" "}
                    {Math.min(
                      filtered.length,
                      tab === "overview" ? 8 : filtered.length,
                    )}{" "}
                    of {filtered.length} matching shipments
                  </span>
                  {tab === "overview" && (
                    <button
                      className="link-button"
                      onClick={() => setTab("shipments")}
                    >
                      View all shipments →
                    </button>
                  )}
                </div>
              </section>
            </>
          )}
          {tab === "requests" && (
            <div className="request-cards">
              {requests.length ? (
                requests.map((r) => (
                  <article className="panel request-card" key={r.id}>
                    <div className="row spread">
                      <span className="eyebrow">{r.id}</span>
                      <select
                        aria-label={"Request status " + r.id}
                        value={r.status}
                        onChange={async (e) => {
                          try {
                            await api({
                              action: "request-status",
                              id: r.id,
                              status: e.target.value,
                            });
                            await load();
                            notify("Request status updated.");
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <h3>{r.name}</h3>
                    <p className="request-route">
                      {r.origin} → {r.destination}
                    </p>
                    <p className="text-sm muted">
                      {r.service} · {r.weight} kg
                    </p>
                    <p className="request-description">{r.description}</p>
                    <div className="divider" />
                    <div className="row spread">
                      <div>
                        <a href={"mailto:" + r.email} className="contact-link">
                          {r.email}
                        </a>
                        <a
                          className="contact-link"
                          href={"tel:" + r.phone.replace(/[^+\d]/g, "")}
                        >
                          {r.phone}
                        </a>
                        <small className="muted">
                          {displayDate(r.createdAt, true)}
                        </small>
                      </div>
                      <a
                        className="button outline small"
                        href={
                          "mailto:" +
                          r.email +
                          "?subject=" +
                          encodeURIComponent(
                            "Your ADEXEC shipping request " + r.id,
                          )
                        }
                      >
                        Reply <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <ClipboardList />
                  <h2>No shipping requests yet.</h2>
                  <p>
                    Requests submitted through your website will appear here for
                    you to review.
                  </p>
                  <a
                    className="button outline small"
                    href="/request"
                    target="_blank"
                    rel="noopener"
                  >
                    View request form <ArrowUpRight size={15} />
                  </a>
                </div>
              )}
            </div>
          )}
          {tab === "settings" && (
            <form
              className="panel settings-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await api({ action: "settings", data: settings });
                  notify("Business information saved.");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2>Business contact details</h2>
              <p className="muted text-sm">
                These details appear in the website footer. Leave a field blank
                to hide it.
              </p>
              <div className="form-grid">
                <Label
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, contactEmail: e.target.value })
                  }
                  maxLength={180}
                >
                  Contact email
                </Label>
                <Label
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) =>
                    setSettings({ ...settings, contactPhone: e.target.value })
                  }
                  maxLength={40}
                >
                  Phone number
                </Label>
                <label className="full">
                  Business address
                  <textarea
                    value={settings.address}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                    maxLength={300}
                  />
                </label>
                <label className="full">
                  Business hours
                  <input
                    value={settings.businessHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        businessHours: e.target.value,
                      })
                    }
                    maxLength={160}
                    placeholder="e.g. Monday–Friday, 9am–5pm"
                  />
                </label>
              </div>
              <div className="form-actions">
                <button className="button orange" disabled={busy}>
                  {busy ? "Saving…" : "Save business details"}
                  <CheckCircle2 size={17} />
                </button>
              </div>
            </form>
          )}
          {tab === "settings" && <EmailStatus />}
          {(tab === "shipments" || tab === "requests") &&
            nextOffset !== null && (
              <button
                className="button outline"
                disabled={busy}
                onClick={loadOlder}
              >
                Load older records
              </button>
            )}
        </main>
        <div className="admin-footer">
          ADEXEC Logistics <span>Every shipment. A promise delivered.</span>
        </div>
      </div>
      {(newOpen || editing) && (
        <ShipmentForm
          initial={editing}
          close={() => {
            setNewOpen(false);
            setEditing(null);
          }}
          done={async (s) => {
            if (editing) {
              setEditing(null);
              await load();
              notify("Booking details saved.");
              return;
            }
            setNewOpen(false);
            await load();
            setTab("shipments");
            setShare({
              title: "Shipment created — share tracking",
              url: trackingLink(s.code),
              code: s.code,
              email: s.email,
            });
            notify("Shipment created successfully.");
          }}
        />
      )}
      {selected && (
        <ManageShipment
          key={selected.code}
          shipment={selected}
          edit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          refresh={() => open(selected)}
          close={() => setSelected(null)}
          done={async () => {
            await load();
            notify("Shipment updated.");
          }}
          share={() => shareTracking(selected)}
          notify={notify}
        />
      )}
      {share && (
        <Modal title={share.title} close={() => setShare(null)}>
          <p className="text-sm muted">
            Share this link with{" "}
            {share.code
              ? "your customer to follow the shipment."
              : "the assigned driver only. It allows location updates for this shipment and expires in 48 hours."}
          </p>
          {share.code && <div className="share-code">{share.code}</div>}
          <label style={{ marginTop: 20 }}>
            Private link
            <input
              value={share.url}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          </label>
          <div className="form-actions">
            <button className="button orange" onClick={() => copy(share.url)}>
              <Copy size={16} />
              Copy link
            </button>
            {share.code && (
              <a
                className="button outline"
                href={
                  "mailto:" +
                  (share.email || "") +
                  "?subject=" +
                  encodeURIComponent("Your ADEXEC shipment " + share.code) +
                  "&body=" +
                  encodeURIComponent(
                    "Your ADEXEC Logistics shipment is ready to track.\n\nTracking number: " +
                      share.code +
                      "\nFollow your shipment: " +
                      share.url +
                      "\n\nADEXEC Logistics",
                  )
                }
              >
                <Mail size={16} />
                Prepare email
              </a>
            )}
          </div>
          <p className="privacy-note">
            Email opens in your mail app for review and sending. Tracking links
            are private; share them only with the intended recipient.
          </p>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function ShipmentForm({
  initial,
  close,
  done,
}: {
  close: () => void;
  initial: Shipment | null;
  done: (s: { code: string; email: string }) => Promise<void>;
}) {
  const [coords, setCoords] = useState({
      originLat: initial ? String(initial.originLat) : "",
      originLng: initial ? String(initial.originLng) : "",
      destinationLat: initial ? String(initial.destinationLat) : "",
      destinationLng: initial ? String(initial.destinationLng) : "",
    }),
    [target, setTarget] = useState<"origin" | "destination">("origin"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [origin, setOrigin] = useState(initial?.origin || ""),
    [destination, setDestination] = useState(initial?.destination || "");
  const fake: PublicShipment = {
    id: "picker",
    code: "",
    origin: "Pickup",
    destination: "Destination",
    originLat: coords.originLat ? Number(coords.originLat) : -30,
    originLng: coords.originLng ? Number(coords.originLng) : -110,
    destinationLat: coords.destinationLat ? Number(coords.destinationLat) : 50,
    destinationLng: coords.destinationLng ? Number(coords.destinationLng) : 110,
    currentLat: coords.originLat ? Number(coords.originLat) : 15,
    currentLng: coords.originLng ? Number(coords.originLng) : 10,
    status: "booked",
    locationSource: "admin",
    locationUpdatedAt: "",
    currentLocation: "Select pickup or destination",
    eta: "",
    description: "",
    service: "Road freight",
    weight: 0,
    pieces: 1,
    createdAt: "",
    updatedAt: "",
  };
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(f),
      ...Object.fromEntries(
        Object.entries(coords).map(([k, v]) => [k, Number(v)]),
      ),
      weight: Number(f.get("weight")),
      pieces: Number(f.get("pieces")),
      eta: dateISO(f.get("eta")),
    };
    try {
      const r = await api({
        action: initial ? "edit-details" : "create",
        id: initial?.id,
        expectedUpdatedAt: initial?.updatedAt,
        data,
      });
      await done({
        code: r.code,
        email: String(f.get("recipientEmail") || ""),
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={initial ? "Edit booking details" : "Create a shipment"}
      close={close}
    >
      <form onSubmit={submit}>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        
        {/* Sender Information Section */}
        <div className="form-section">
          <h3>📤 Sender Information</h3>
          <div className="form-grid">
            <Label
              name="senderName"
              defaultValue={initial?.senderName}
              required
              minLength={2}
              maxLength={160}
            >
              Sender name
            </Label>
            <Label
              name="senderEmail"
              defaultValue={initial?.senderEmail}
              type="email"
              maxLength={180}
            >
              Sender email
            </Label>
            <Label
              name="senderPhone"
              defaultValue={initial?.senderPhone}
              type="tel"
              maxLength={40}
            >
              Sender phone
            </Label>
            <Label
              name="senderAddress"
              defaultValue={initial?.senderAddress}
              maxLength={300}
            >
              Sender address
            </Label>
          </div>
        </div>

        {/* Recipient Information Section */}
        <div className="form-section">
          <h3>📥 Recipient Information</h3>
          <div className="form-grid">
            <Label
              name="recipientName"
              defaultValue={initial?.recipientName}
              required
              minLength={2}
              maxLength={160}
            >
              Recipient name
            </Label>
            <Label
              name="recipientEmail"
              defaultValue={initial?.recipientEmail}
              type="email"
              maxLength={180}
            >
              Recipient email (for tracking updates)
            </Label>
            <Label
              name="recipientPhone"
              defaultValue={initial?.recipientPhone}
              type="tel"
              maxLength={40}
            >
              Recipient phone
            </Label>
            <Label
              name="recipientAddress"
              defaultValue={initial?.recipientAddress}
              maxLength={300}
            >
              Recipient address
            </Label>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="form-section">
          <h3>📦 Shipment Details</h3>
          <div className="form-grid">
            <label>
              Service
              <select name="service" defaultValue={initial?.service}>
                {services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <PlacePicker
              name="origin"
              label="Pickup"
              value={origin}
              onChange={setOrigin}
              onPosition={(lat, lng) =>
                setCoords((c) => ({
                  ...c,
                  originLat: String(lat),
                  originLng: String(lng),
                }))
              }
            />
            <PlacePicker
              name="destination"
              label="Destination"
              value={destination}
              onChange={setDestination}
              onPosition={(lat, lng) =>
                setCoords((c) => ({
                  ...c,
                  destinationLat: String(lat),
                  destinationLng: String(lng),
                }))
              }
            />
          </div>
        </div>
        <div className="form-section">
          <div className="row spread" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Set route locations</h3>
            <select
              style={{ width: 170 }}
              value={target}
              onChange={(e) =>
                setTarget(e.target.value as "origin" | "destination")
              }
              aria-label="Map selection target"
            >
              <option value="origin">Select pickup</option>
              <option value="destination">Select destination</option>
            </select>
          </div>
          <p className="help-text" style={{ marginBottom: 12 }}>
            Zoom and click the map, or enter coordinates. Choose both pickup and
            destination.
          </p>
          <div className="map-pick">
            <ShipmentMap
              shipment={fake}
              onPick={(lat, lng) =>
                setCoords((c) => ({
                  ...c,
                  [target + "Lat"]: String(lat),
                  [target + "Lng"]: String(lng),
                }))
              }
            />
          </div>
          <div className="form-grid coords" style={{ marginTop: 14 }}>
            {(
              [
                "originLat",
                "originLng",
                "destinationLat",
                "destinationLng",
              ] as const
            ).map((k) => (
              <Label
                key={k}
                type="number"
                required
                step="any"
                min={k.endsWith("Lat") ? -85 : -180}
                max={k.endsWith("Lat") ? 85 : 180}
                value={coords[k]}
                onChange={(e) => setCoords({ ...coords, [k]: e.target.value })}
              >
                {
                  {
                    originLat: "Pickup latitude",
                    originLng: "Pickup longitude",
                    destinationLat: "Destination latitude",
                    destinationLng: "Destination longitude",
                  }[k]
                }
              </Label>
            ))}
          </div>
        </div>
        <div className="form-section">
          <h3>Cargo and delivery</h3>
          <div className="form-grid">
            <Label
              name="weight"
              defaultValue={initial?.weight}
              type="number"
              required
              min="0"
              max="1000000"
              step="0.01"
            >
              Weight (kg)
            </Label>
            <Label
              name="pieces"
              type="number"
              required
              min="1"
              max="100000"
              defaultValue={initial?.pieces ?? 1}
            >
              Number of packages
            </Label>
            <label className="full">
              Cargo description
              <textarea
                name="description"
                defaultValue={initial?.description}
                required
                minLength={2}
                maxLength={1000}
                rows={2}
              />
              <span className="help-text">
                Visible to people with the tracking link. Do not include
                personal contact details.
              </span>
            </label>
            <label className="full">
              Estimated delivery (your local time)
              <input
                name="eta"
                defaultValue={localDate(initial?.eta || "")}
                type="datetime-local"
              />
            </label>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="button outline" onClick={close}>
            Cancel
          </button>
          <button className="button orange" disabled={busy}>
            {busy
              ? "Saving…"
              : initial
                ? "Save booking details"
                : "Create shipment"}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ManageShipment({
  edit,
  refresh,
  shipment,
  close,
  done,
  share,
  notify,
}: {
  edit: () => void;
  refresh: () => Promise<void>;
  shipment: Shipment;
  close: () => void;
  done: () => Promise<void>;
  share: () => void;
  notify: (text: string) => void;
}) {
  const [s, setS] = useState(shipment),
    [status, setStatus] = useState(shipment.status),
    [lat, setLat] = useState(shipment.currentLat),
    [lng, setLng] = useState(shipment.currentLng),
    [location, setLocation] = useState(shipment.currentLocation),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [driver, setDriver] = useState("");
  const [history, setHistory] = useState(shipment.events || []);
  const [hasMore, setHasMore] = useState(history.length === 150);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  async function moreHistory() {
    setBusy(true);
    try {
      const r = await fetch(
        "/api/admin?id=" + s.id + "&offset=" + history.length,
      );
      const result = (await r.json()) as { shipment: Shipment; error: string };
      if (!r.ok) throw Error(result.error);
      const more = result.shipment.events || [];
      setHistory((old) => [
        ...new Map([...old, ...more].map((e) => [e.id, e])).values(),
      ]);
      setHasMore(more.length === 150);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function correct() {
    const entry = history.find((e) => e.id === correcting);
    if (!entry) return;
    setBusy(true);
    try {
      await api({
        action: "correct-note",
        id: s.id,
        eventId: entry.id,
        note,
        previousNote: entry.note,
      });
      setHistory((old) =>
        old.map((e) => (e.id === entry.id ? { ...e, note: note.trim() } : e)),
      );
      setCorrecting(null);
      notify("Milestone note corrected.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function replaceCode() {
    setBusy(true);
    try {
      await api({ action: "replace-code", id: s.id, previousCode: s.code });
      await done();
      await refresh();
      setConfirmReplace(false);
      notify(
        "New tracking number issued. Share the new link with the recipient.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api({
        action: "update",
        id: s.id,
        data: {
          status,
          lat,
          lng,
          location,
          note: String(f.get("note") || ""),
          eta: dateISO(f.get("eta")),
        },
      });
      await done();
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function driverLink(revoke = false) {
    setBusy(true);
    setError("");
    try {
      const r = await api({
        action: revoke ? "revoke-driver" : "driver-link",
        id: s.id,
      });
      if (revoke) {
        setDriver("");
        setS({ ...s, driverTokenExpiresAt: null });
        notify("Driver location link revoked.");
      } else {
        setDriver(
          window.location.origin + "/driver?shipment=" + s.id + "#" + r.token,
        );
        setS({ ...s, driverTokenExpiresAt: r.expiresAt });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Manage shipment" close={close}>
      <div className="row spread" style={{ marginBottom: 20 }}>
        <div>
          <strong className="text-sm">{s.code}</strong>
          <p className="text-sm muted">
            {s.recipientName} · {s.service}
          </p>
        </div>
        <button className="button outline small" onClick={share}>
          <Copy size={14} />
          Share tracking
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="row" style={{ flexWrap: "wrap", marginBottom: 20 }}>
        <button className="button outline small" onClick={edit}>
          Edit booking details
        </button>
        <a
          className="button outline small"
          href={"/track?code=" + encodeURIComponent(s.code)}
          target="_blank"
          rel="noopener"
        >
          Review customer tracking ↗
        </a>
        <button
          className="link-button"
          onClick={() => setConfirmReplace(!confirmReplace)}
        >
          Replace tracking number
        </button>
      </div>
      {confirmReplace && (
        <div className="notice">
          <div>
            The old customer link will stop working. Send the new link to the
            recipient after replacing it.
            <div className="row">
              <button
                className="button outline small"
                onClick={() => setConfirmReplace(false)}
              >
                Keep current number
              </button>
              <button
                className="button orange small"
                disabled={busy}
                onClick={replaceCode}
              >
                Issue replacement
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={save}>
        <div className="form-grid">
          <label>
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                if (e.target.value === "delivered") {
                  setLat(s.destinationLat);
                  setLng(s.destinationLng);
                  setLocation(s.destination);
                }
              }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estimated delivery
            <input
              type="datetime-local"
              name="eta"
              defaultValue={localDate(s.eta)}
            />
          </label>
          <PlacePicker
            label="Reported location"
            value={location}
            onChange={setLocation}
            onPosition={(lat, lng) => {
              setLat(lat);
              setLng(lng);
            }}
          />
        </div>
        <div className="map-pick" style={{ marginTop: 18 }}>
          <ShipmentMap
            shipment={{
              ...s,
              currentLat: lat,
              currentLng: lng,
              currentLocation: location,
            }}
            onPick={(a, b) => {
              setLat(a);
              setLng(b);
            }}
          />
        </div>
        <div className="form-grid coords" style={{ marginTop: 15 }}>
          <Label
            type="number"
            step="any"
            required
            min="-85"
            max="85"
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
          >
            Reported latitude
          </Label>
          <Label
            type="number"
            step="any"
            required
            min="-180"
            max="180"
            value={lng}
            onChange={(e) => setLng(Number(e.target.value))}
          >
            Reported longitude
          </Label>
          <label className="full">
            Customer-facing update
            <textarea
              name="note"
              rows={2}
              maxLength={1000}
              placeholder="e.g. Arrived at the destination hub. Preparing for delivery."
            />
          </label>
        </div>
        <p className="help-text" style={{ marginTop: 10 }}>
          This update appears on the customer’s timeline. Selecting delivered
          places the marker at the destination and revokes driver access.
        </p>
        <div className="form-actions">
          <button type="button" className="button outline" onClick={close}>
            Close
          </button>
          <button className="button orange" disabled={busy}>
            {busy ? "Saving…" : "Publish shipment update"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
      <div className="form-section">
        <div className="row">
          <Navigation size={20} />
          <h3 style={{ margin: 0 }}>Driver GPS sharing</h3>
        </div>
        <p className="text-sm muted" style={{ marginTop: 12 }}>
          Give the assigned driver a private link to share their phone’s GPS
          position. Links expire after 48 hours. Creating a new link replaces
          the old one.
        </p>
        {driver && (
          <label style={{ marginTop: 15 }}>
            Private driver link
            <input readOnly value={driver} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="link-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(driver);
                  notify("Driver link copied.");
                } catch {
                  notify("Select and copy the driver link.");
                }
              }}
            >
              Copy driver link
            </button>
          </label>
        )}
        {s.driverTokenExpiresAt && (
          <p className="help-text" style={{ marginTop: 12 }}>
            Current link expires {displayDate(s.driverTokenExpiresAt, true)}.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button outline small"
            disabled={busy || ["delivered", "cancelled"].includes(s.status)}
            onClick={() => driverLink()}
          >
            Generate driver link <ArrowUpRight size={15} />
          </button>
          {s.driverTokenExpiresAt && (
            <button
              className="button ghost small"
              disabled={busy}
              onClick={() => driverLink(true)}
            >
              Revoke access
            </button>
          )}
        </div>
      </div>
      <section className="form-section">
        <h3>Tracking history</h3>
        <p className="text-sm muted">
          Review recorded milestones and correct customer-facing notes. Publish
          a new update above to change the current status or position.
        </p>
        <ol className="timeline">
          {history.map((entry) => (
            <li key={entry.id}>
              <strong>
                {statusLabels[entry.status]} · {entry.location}
              </strong>
              <p>{entry.note}</p>
              <time>
                {displayDate(entry.createdAt, true)} · {entry.lat.toFixed(4)},{" "}
                {entry.lng.toFixed(4)}
              </time>
              {correcting === entry.id ? (
                <div>
                  <label>
                    Corrected customer note
                    <textarea
                      value={note}
                      maxLength={1000}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <button
                    className="button outline small"
                    onClick={() => setCorrecting(null)}
                  >
                    Cancel
                  </button>{" "}
                  <button
                    className="button orange small"
                    disabled={busy}
                    onClick={correct}
                  >
                    Save note
                  </button>
                </div>
              ) : (
                <button
                  className="link-button"
                  onClick={() => {
                    setCorrecting(entry.id);
                    setNote(entry.note);
                  }}
                >
                  Edit note
                </button>
              )}
            </li>
          ))}
        </ol>
        {hasMore && (
          <button
            className="button outline small"
            disabled={busy}
            onClick={moreHistory}
          >
            Earlier milestones
          </button>
        )}
      </section>
    </Modal>
  );
}
