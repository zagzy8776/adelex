"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  PackageCheck,
  LoaderCircle,
  Info,
} from "lucide-react";
import { Header, Footer } from "@/app/components/Shell";
import { services } from "@/app/lib/domain";
export default function RequestPage() {
  const [service, setService] = useState<string>(services[0]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState("");
  useEffect(() => {
    const s = new URLSearchParams(location.search).get("service");
    if (s && services.includes(s as (typeof services)[number])) setService(s);
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, service, weight: Number(data.weight) }),
      });
      const d = (await r.json()) as { error: string; id: string };
      if (!r.ok) throw new Error(d.error);
      setReference(d.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to submit your request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <div className="page-intro">
        <div className="wrap">
          <span className="eyebrow light">LET’S GET IT MOVING</span>
          <h1>Your next journey starts here.</h1>
          <p>
            Tell us what you need to ship. Our team will review your details and
            get in touch to confirm the options.
          </p>
        </div>
      </div>
      <main className="request-layout wrap">
        <div className="panel">
          {reference ? (
            <div className="empty-state" style={{ border: 0 }}>
              <PackageCheck />
              <h2>Your request is with us.</h2>
              <p>
                Reference: <strong>{reference}</strong>
                <br />
                Our team will contact you using the details you provided. Your
                shipment and pricing will be confirmed separately.
              </p>
              <a href="/" className="button navy">
                Back to home <ArrowRight size={17} />
              </a>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{ fontSize: 24, marginBottom: 24 }}>
                Request a shipping quote
              </h2>
              {error && (
                <div className="notice error" role="alert">
                  <Info size={16} />
                  {error}
                </div>
              )}
              <div className="form-grid">
                <label>
                  Full name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={180}
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                </label>
                <label className="full">
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    required
                    minLength={5}
                    maxLength={40}
                    autoComplete="tel"
                    placeholder="Include your country code"
                  />
                </label>
              </div>
              <div className="form-section">
                <h3>Shipment details</h3>
                <div className="form-grid">
                  <label>
                    Pickup location
                    <input
                      name="origin"
                      required
                      minLength={2}
                      maxLength={160}
                      placeholder="City and country"
                    />
                  </label>
                  <label>
                    Delivery location
                    <input
                      name="destination"
                      required
                      minLength={2}
                      maxLength={160}
                      placeholder="City and country"
                    />
                  </label>
                  <label>
                    Shipping service
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Estimated weight (kg)
                    <input
                      name="weight"
                      type="number"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      required
                      placeholder="e.g. 24"
                    />
                  </label>
                  <label className="full">
                    What are you shipping?
                    <textarea
                      name="description"
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={4}
                      placeholder="Tell us about your goods, package sizes, preferred dates, and any special handling needs."
                    />
                  </label>
                  <label className="honey" aria-hidden="true">
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
              </div>
              <p className="privacy-note">
                We use these details to email your request receipt, respond to
                your request and arrange shipping. Read our{" "}
                <a href="/privacy">privacy information</a>. Submitting a request
                does not confirm a booking or payment.
              </p>
              <div className="form-actions">
                <button className="button orange" disabled={busy}>
                  {busy ? <LoaderCircle className="spinner" size={17} /> : null}
                  {busy ? "Sending request…" : "Send shipping request"}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
        <aside className="request-aside">
          <ShieldCheck size={31} />
          <h3>Clear from the first step.</h3>
          <p>
            A good delivery starts with a good plan. Share as much detail as you
            can so we can help you find the right option.
          </p>
          <ul>
            <li>
              <Check size={17} />
              Your route and cargo reviewed
            </li>
            <li>
              <Check size={17} />
              Pricing confirmed before booking
            </li>
            <li>
              <Check size={17} />
              Tracking once your shipment is created
            </li>
          </ul>
          <div className="divider" />
          <p>Already have a tracking number?</p>
          <a href="/track" className="text-link dark">
            Follow your shipment <ArrowRight size={16} />
          </a>
        </aside>
      </main>
      <Footer />
    </>
  );
}
