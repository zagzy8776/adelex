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
import { useT } from "@/app/components/LanguageProvider";

export default function RequestPage() {
  const t = useT();
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
        e instanceof Error ? e.message : t("req.error"),
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
          <span className="eyebrow light">{t("req.eyebrow")}</span>
          <h1>{t("req.title")}</h1>
          <p>{t("req.intro")}</p>
        </div>
      </div>
      <main className="request-layout wrap">
        <div className="panel">
          {reference ? (
            <div className="empty-state" style={{ border: 0 }}>
              <PackageCheck />
              <h2>{t("req.successTitle")}</h2>
              <p>
                {t("req.reference")} <strong>{reference}</strong>
                <br />
                {t("req.successBody")}
              </p>
              <a href="/" className="button navy">
                {t("req.back")} <ArrowRight size={17} />
              </a>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{ fontSize: 24, marginBottom: 24 }}>
                {t("req.formTitle")}
              </h2>
              {error && (
                <div className="notice error" role="alert">
                  <Info size={16} />
                  {error}
                </div>
              )}
              <div className="form-grid">
                <label>
                  {t("req.name")}
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="name"
                    placeholder={t("req.namePh")}
                  />
                </label>
                <label>
                  {t("req.email")}
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={180}
                    autoComplete="email"
                    placeholder={t("req.emailPh")}
                  />
                </label>
                <label className="full">
                  {t("req.phone")}
                  <input
                    type="tel"
                    name="phone"
                    required
                    minLength={5}
                    maxLength={40}
                    autoComplete="tel"
                    placeholder={t("req.phonePh")}
                  />
                </label>
              </div>
              <div className="form-section">
                <h3>{t("req.details")}</h3>
                <div className="form-grid">
                  <label>
                    {t("req.origin")}
                    <input
                      name="origin"
                      required
                      minLength={2}
                      maxLength={160}
                      placeholder={t("req.cityPh")}
                    />
                  </label>
                  <label>
                    {t("req.dest")}
                    <input
                      name="destination"
                      required
                      minLength={2}
                      maxLength={160}
                      placeholder={t("req.cityPh")}
                    />
                  </label>
                  <label>
                    {t("req.service")}
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s} value={s}>
                          {s === "Road freight"
                            ? t("services.road")
                            : s === "Air freight"
                              ? t("services.air")
                              : s === "Ocean freight"
                                ? t("services.ocean")
                                : t("services.express")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("req.weight")}
                    <input
                      name="weight"
                      type="number"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      required
                      placeholder={t("req.weightPh")}
                    />
                  </label>
                  <label className="full">
                    {t("req.what")}
                    <textarea
                      name="description"
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={4}
                      placeholder={t("req.whatPh")}
                    />
                  </label>
                  <label className="honey" aria-hidden="true">
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
              </div>
              <p className="privacy-note">
                {t("req.privacy")}{" "}
                <a href="/privacy">{t("req.privacyLink")}</a>. {t("req.privacy2")}
              </p>
              <div className="form-actions">
                <button className="button orange" disabled={busy}>
                  {busy ? <LoaderCircle className="spinner" size={17} /> : null}
                  {busy ? t("req.sending") : t("req.send")}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
        <aside className="request-aside">
          <ShieldCheck size={31} />
          <h3>{t("req.asideTitle")}</h3>
          <p>{t("req.asideBody")}</p>
          <ul>
            <li>
              <Check size={17} />
              {t("req.li1")}
            </li>
            <li>
              <Check size={17} />
              {t("req.li2")}
            </li>
            <li>
              <Check size={17} />
              {t("req.li3")}
            </li>
          </ul>
          <div className="divider" />
          <p>{t("req.haveCode")}</p>
          <a href="/track" className="text-link dark">
            {t("req.follow")} <ArrowRight size={16} />
          </a>
        </aside>
      </main>
      <Footer />
    </>
  );
}
