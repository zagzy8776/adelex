"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Menu,
  X,
  ArrowRight,
  Plane,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import type { BusinessSettings } from "@/app/lib/domain";
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="ADEXEC Logistics home">
      <img src="/images/adexec-logo.png" alt="ADEXEC Logistics" />
    </a>
  );
}
export function Header({ active = "" }: { active?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="wrap nav-inner">
        <Brand />
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          <a href="/#services" onClick={() => setOpen(false)}>
            Our services
          </a>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </a>
          <a href="/track" className={active === "track" ? "active" : ""}>
            Track shipment
          </a>
          <a href="/#contact" onClick={() => setOpen(false)}>
            Contact us
          </a>
          <a href="/request" className="button orange nav-cta">
            Ship with us <ArrowUpRight size={17} />
          </a>
        </nav>
        <button
          className="menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function Footer() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) =>
        r.ok ? (r.json() as Promise<{ settings: BusinessSettings }>) : null,
      )
      .then((d) => d && setSettings(d.settings))
      .catch(() => {});
  }, []);
  return (
    <footer id="contact">
      <div className="wrap footer-top">
        <div>
          <Brand />
          <p>
            Moving your business forward.
            <br />
            One shipment at a time.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="/#services">Shipping services</a>
          <a href="/track">Track your shipment</a>
          <a href="/request">Request a quote</a>
        </div>
        <div>
          <h4>Let’s get it moving</h4>
          {settings?.contactEmail && (
            <a href={"mailto:" + settings.contactEmail}>
              {settings.contactEmail}
            </a>
          )}
          {settings?.contactPhone && (
            <a href={"tel:" + settings.contactPhone.replace(/[^+\d]/g, "")}>
              {settings.contactPhone}
            </a>
          )}
          <a
            href="https://wa.me/15625216164"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp +1 (562) 521-6164
          </a>
          {settings?.address && <p>{settings.address}</p>}
          {settings?.businessHours && <p>{settings.businessHours}</p>}
          <a href="/request" className="footer-contact">
            Talk to our shipping team <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>
          © {new Date().getFullYear()} ADEXEC Logistics. All rights reserved.
        </span>
        <div>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
export function TrackingForm({
  compact = false,
  initial = "",
}: {
  compact?: boolean;
  initial?: string;
}) {
  const [code, setCode] = useState(initial);
  return (
    <form
      action="/track"
      className={compact ? "tracking-form compact" : "tracking-form"}
    >
      <div className="tracking-input">
        <Plane size={21} strokeWidth={1.8} />
        <input
          name="code"
          aria-label="Tracking number"
          placeholder="Enter your tracking number"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={60}
          autoComplete="off"
        />
      </div>
      <button className="button orange" type="submit">
        Track shipment <ArrowRight size={18} />
      </button>
    </form>
  );
}
export function Assurance() {
  return (
    <div className="assurance">
      <span>
        <ShieldCheck size={17} />
        Handled with care
      </span>
      <span>
        <MapPin size={17} />
        Shipment visibility
      </span>
      <span>
        <Plane size={17} />
        From pickup to delivery
      </span>
    </div>
  );
}
