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
  Globe,
  ChevronDown,
} from "lucide-react";
import type { BusinessSettings } from "@/app/lib/domain";
import { useI18n } from "@/app/components/LanguageProvider";
import type { Locale } from "@/app/lib/i18n/dictionaries";

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="ADEXEC Logistics home">
      <img src="/images/adexec-logo.png" alt="ADEXEC Logistics" />
    </a>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, locales, labels, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="lang-switcher">
      <button
        type="button"
        className="lang-trigger"
        aria-label={t("lang.label")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={16} strokeWidth={1.8} />
        <span>{labels[locale]}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="lang-backdrop" onClick={() => setOpen(false)} />
          <div className="lang-menu" role="listbox">
            {locales.map((code) => (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={code === locale}
                className={code === locale ? "active" : ""}
                onClick={() => {
                  setLocale(code as Locale);
                  setOpen(false);
                }}
              >
                {labels[code]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Header({ active = "" }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <header className="site-header">
      <div className="wrap nav-inner">
        <Brand />
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          <a href="/#services" onClick={() => setOpen(false)}>
            {t("nav.services")}
          </a>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>
            {t("nav.how")}
          </a>
          <a href="/track" className={active === "track" ? "active" : ""}>
            {t("nav.track")}
          </a>
          <a href="/#contact" onClick={() => setOpen(false)}>
            {t("nav.contact")}
          </a>
          <LanguageSwitcher />
          <a href="/request" className="button orange nav-cta">
            {t("nav.ship")} <ArrowUpRight size={17} />
          </a>
        </nav>
        <div className="nav-mobile-tools">
          <LanguageSwitcher />
          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? t("nav.close") : t("nav.open")}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const { t } = useI18n();
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
            {t("footer.tagline1")}
            <br />
            {t("footer.tagline2")}
          </p>
        </div>
        <div>
          <h4>{t("footer.explore")}</h4>
          <a href="/#services">{t("footer.services")}</a>
          <a href="/track">{t("footer.track")}</a>
          <a href="/request">{t("footer.quote")}</a>
        </div>
        <div>
          <h4>{t("footer.moving")}</h4>
          {settings?.contactEmail && (
            <a href={"mailto:" + settings.contactEmail}>
              {settings.contactEmail}
            </a>
          )}
          {settings?.contactPhone && (
            <a href={"tel:" + settings.contactPhone.replace(/[^\+\d]/g, "")}>
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
            {t("footer.talk")} <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>
          © {new Date().getFullYear()} ADEXEC Logistics. {t("footer.rights")}
        </span>
        <div>
          <a href="/privacy">{t("footer.privacy")}</a>
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
  const { t } = useI18n();
  return (
    <form
      action="/track"
      className={compact ? "tracking-form compact" : "tracking-form"}
    >
      <div className="tracking-input">
        <Plane size={21} strokeWidth={1.8} />
        <input
          name="code"
          aria-label={t("track.aria")}
          placeholder={t("track.placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={60}
          autoComplete="off"
        />
      </div>
      <button className="button orange" type="submit">
        {t("track.button")} <ArrowRight size={18} />
      </button>
    </form>
  );
}

export function Assurance() {
  const { t } = useI18n();
  return (
    <div className="assurance">
      <span>
        <ShieldCheck size={17} />
        {t("assure.care")}
      </span>
      <span>
        <MapPin size={17} />
        {t("assure.visibility")}
      </span>
      <span>
        <Plane size={17} />
        {t("assure.pickup")}
      </span>
    </div>
  );
}
