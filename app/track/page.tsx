"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Package,
  CalendarDays,
  MapPin,
  Copy,
  Info,
  LoaderCircle,
  Headphones,
} from "lucide-react";
import { Header, Footer, TrackingForm } from "@/app/components/Shell";
import ShipmentMap from "@/app/components/ShipmentMap";
import {
  type PublicShipment,
  exampleJourney,
  statusLabels,
  displayDate,
  isFreshGPS,
  sourceLabel,
} from "@/app/lib/domain";

/** Says plainly what the dashed part of the map is, per transport mode. */
function routeNote(service: string, planned: boolean) {
  if (planned)
    return "The travelled line follows the planned route supplied by dispatch.";
  if (service === "Air freight")
    return "The dashed arc is a great-circle flight path between the two airports, not an airway or radar track.";
  if (service === "Ocean freight")
    return "The dashed arc is an indicative sea leg, not a navigable maritime route.";
  return "The dashed line is a direct guide between reported positions, not road navigation.";
}

/**
 * The tracking number lives in the URL.
 *
 * `useSearchParams` is the framework's own subscription to it: it re-reads when
 * the router commits a navigation — including a `?code=` change made without a
 * page reload — and exposes a server snapshot, so the first client render
 * agrees with the server HTML. Reading `window.location` through
 * `useSyncExternalStore` with a no-op subscribe would only ever see the URL as
 * it was at mount time.
 */
export default function TrackPage() {
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") || "").trim().toUpperCase();
  const [shipment, setShipment] = useState<PublicShipment | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [warning, setWarning] = useState(""),
    [copied, setCopied] = useState(false),
    [now, setNow] = useState(() => Date.now()),
    [replay, setReplay] = useState(false),
    // Which historical update, if any, the map is focused on. The shipment code
    // is stored alongside the id so a different shipment never inherits a
    // selection without needing an effect to reset it.
    [selected, setSelected] = useState<{ code: string; id: string } | null>(
      null,
    );
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!code) return;
    let disposed = false;
    const load = async (initial = false) => {
      if (initial) setBusy(true);
      if (controller.current) return;
      const ac = new AbortController();
      controller.current = ac;
      try {
        const r = await fetch("/api/track?code=" + encodeURIComponent(code), {
          signal: ac.signal,
        });
        const d = (await r.json()) as {
          error: string;
          shipment: PublicShipment;
        };
        if (disposed) return;
        if (!r.ok) {
          if (r.status === 404) {
            setShipment(null);
            setError(d.error);
            return;
          }
          throw new Error(d.error || "Tracking is unavailable.");
        }
        setShipment(d.shipment);
        setError("");
        setWarning("");
      } catch (e) {
        if (disposed || ac.signal.aborted) return;
        const message = e instanceof Error ? e.message : "Unable to connect.";
        if (initial) setError(message);
        else setWarning("Could not refresh. Showing the last received update.");
      } finally {
        if (controller.current === ac) controller.current = null;
        if (!disposed) setBusy(false);
      }
    };
    load(true);
    // The example shipment is static, so polling it would only cost requests.
    const live = code !== "ADX-DEMO";
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        if (live) load();
      }
    }, 10000);
    const visible = () => {
      if (document.visibilityState === "visible" && live) load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      clearInterval(timer);
      controller.current?.abort();
      controller.current = null;
      document.removeEventListener("visibilitychange", visible);
    };
  }, [code]);
  useEffect(() => {
    if (!replay) return;
    const points = exampleJourney.map(({ lat, lng }) => [lat, lng]);
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % points.length;
      setShipment((s) =>
        s
          ? {
              ...s,
              currentLat: points[i][0],
              currentLng: points[i][1],
              currentLocation: "Example route replay · simulated position",
            }
          : s,
      );
    }, 2200);
    return () => clearInterval(timer);
  }, [replay]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setWarning("Copy the tracking link from your browser address bar.");
    }
  }
  const steps = [
    "booked",
    "collected",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  const index = shipment ? steps.indexOf(shipment.status) : -1;
  const fresh =
    shipment &&
    isFreshGPS(shipment.locationSource, shipment.locationUpdatedAt, now);
  // Oldest first: the timeline reads as a journey, not a changelog.
  const journey = [...(shipment?.events ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  // The update the map is currently focused on, if it belongs to this shipment.
  const chosen =
    selected && shipment && selected.code === shipment.code
      ? (journey.find((event) => event.id === selected.id) ?? null)
      : null;
  const focus =
    chosen && shipment
      ? {
          id: chosen.id,
          lat: chosen.lat,
          lng: chosen.lng,
          title: statusLabels[chosen.status] ?? chosen.status,
          detail: `${chosen.location} · ${displayDate(chosen.createdAt, true)}`,
        }
      : null;
  return (
    <>
      <Header active="track" />
      <div className="page-intro">
        <div className="wrap">
          <span className="eyebrow light">YOUR SHIPMENT, IN SIGHT</span>
          <h1>Follow every step.</h1>
          <p>Your latest shipment update is just a tracking number away.</p>
        </div>
      </div>
      <main className="tracking-page">
        <div className="wrap">
          <div className="tracking-search">
            <TrackingForm key={code} initial={code} />
            <p>
              Just exploring?{" "}
              <a href="/track?code=ADX-DEMO">View an example shipment ↗</a>
            </p>
          </div>
          {busy ? (
            <div className="empty-state" role="status">
              <LoaderCircle className="spinner" />
              <h2>Finding your shipment…</h2>
            </div>
          ) : error ? (
            <div className="empty-state" role="alert">
              <Package />
              <h2>We couldn’t find that shipment.</h2>
              <p>{error}</p>
              <a href="/request" className="text-link dark">
                Contact our shipping team <ArrowRight size={16} />
              </a>
            </div>
          ) : !shipment ? (
            <div className="empty-state">
              <MapPin />
              <h2>A clearer view of your delivery.</h2>
              <p>
                Enter the tracking number shared by ADEXEC to view your
                shipment’s location, timeline, and estimated delivery.
              </p>
            </div>
          ) : (
            <>
              {shipment.demo && (
                <div className="notice">
                  <Info size={16} />
                  <span>
                    <strong>Example shipment.</strong> This is a demonstration,
                    not a real delivery.{" "}
                    <button
                      className="link-button"
                      onClick={() => setReplay(!replay)}
                    >
                      {replay
                        ? "Pause example journey"
                        : "Play example journey"}{" "}
                      {replay ? "Ⅱ" : "▷"}
                    </button>
                  </span>
                </div>
              )}
              {warning && (
                <div className="notice error" role="status">
                  <Info size={16} />
                  {warning}
                </div>
              )}
              <div className="shipment-heading">
                <div>
                  <h2>
                    {shipment.origin.split(",")[0]}{" "}
                    <span className="muted">→</span>{" "}
                    {shipment.destination.split(",")[0]}
                  </h2>
                  <p>
                    <span className="code">{shipment.code}</span>{" "}
                    <span> · {shipment.service}</span>
                  </p>
                </div>
                <button className="button outline small" onClick={copy}>
                  <Copy size={14} />
                  {copied ? "Link copied" : "Share tracking"}
                </button>
              </div>
              <div className="progress-steps">
                {steps.map((s, i) => (
                  <div
                    className={"progress-step " + (i <= index ? "done" : "")}
                    key={s}
                  >
                    {statusLabels[s]}
                  </div>
                ))}
              </div>
              <div className="tracking-layout">
                <div className="tracking-main">
                  <section className="map-panel">
                    <div className="map-topbar">
                      <strong>
                        <MapPin
                          size={14}
                          style={{ verticalAlign: "middle", marginRight: 5 }}
                        />
                        Shipment location
                      </strong>
                      <span>
                        {fresh ? (
                          <>
                            <i className="live-dot" />
                            Active GPS
                          </>
                        ) : shipment.demo ? (
                          "Example map"
                        ) : shipment.locationSource === "gps" ? (
                          "Last known GPS position"
                        ) : (
                          "Latest reported position"
                        )}
                      </span>
                    </div>
                    <ShipmentMap shipment={shipment} focus={focus} />
                    <div className="map-report">
                      <div>
                        <span>Status</span>
                        <strong>{statusLabels[shipment.status]}</strong>
                      </div>
                      <div>
                        <span>Last reported</span>
                        <strong title={shipment.currentLocation}>
                          {shipment.currentLocation}
                        </strong>
                      </div>
                      <div>
                        <span>Updated</span>
                        <strong>
                          {displayDate(shipment.locationUpdatedAt, true)}
                        </strong>
                      </div>
                    </div>
                    <p className="map-caption">
                      {shipment.demo
                        ? "Illustrative route and sample updates. "
                        : shipment.locationSource === "gps"
                          ? "Position reported by the assigned driver's device. Refreshes every 10 seconds. "
                          : "Position reported by dispatch. Refreshes every 10 seconds. "}
                      {routeNote(
                        shipment.service,
                        Array.isArray(shipment.routeGeometry) &&
                          shipment.routeGeometry.length > 1,
                      )}
                    </p>
                  </section>
                  <section className="panel">
                    <div className="route-summary">
                      <div>
                        <span>FROM</span>
                        <h3>{shipment.origin}</h3>
                      </div>
                      <ArrowRight size={20} className="muted" />
                      <div>
                        <span>TO</span>
                        <h3>{shipment.destination}</h3>
                      </div>
                    </div>
                    <div className="detail-grid">
                      <div>
                        <span>Service</span>
                        <strong>{shipment.service}</strong>
                      </div>
                      <div>
                        <span>Shipment weight</span>
                        <strong>{shipment.weight} kg</strong>
                      </div>
                      <div>
                        <span>Packages</span>
                        <strong>{shipment.pieces}</strong>
                      </div>
                    </div>
                    <div className="divider" />
                    <p className="text-sm muted">{shipment.description}</p>
                  </section>
                </div>
                <div>
                  <section className="panel timeline-panel">
                    <div className="eta-block">
                      <CalendarDays size={24} />
                      <div>
                        <p>
                          {shipment.status === "delivered"
                            ? "DELIVERY STATUS"
                            : "ESTIMATED DELIVERY"}
                        </p>
                        <strong>
                          {shipment.status === "delivered"
                            ? "Delivered"
                            : displayDate(shipment.eta)}
                        </strong>
                        <small>
                          {shipment.status === "delivered"
                            ? "Delivery confirmed."
                            : "Estimate may change as the shipment progresses."}
                        </small>
                      </div>
                    </div>
                    <div>
                      <div className="row spread">
                        <h3>Shipment journey</h3>
                        <span className={"status-pill " + shipment.status}>
                          {statusLabels[shipment.status]}
                        </span>
                      </div>
                      {journey.length === 0 ? (
                        <p className="text-sm muted">
                          No journey updates have been recorded yet.
                        </p>
                      ) : (
                        <>
                          <p className="timeline-hint">
                            Select an update to see where it was reported.
                          </p>
                          {chosen && (
                            <div className="focus-bar" role="status">
                              <span>
                                <strong>
                                  {statusLabels[chosen.status]}{" "}
                                  {displayDate(chosen.createdAt, true)}
                                </strong>
                                {chosen.location}
                              </span>
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => setSelected(null)}
                              >
                                Back to live position
                              </button>
                            </div>
                          )}
                          <ol className="timeline">
                            {journey.map((e, i) => {
                              const active = chosen?.id === e.id;
                              return (
                                <li
                                  key={e.id}
                                  className={
                                    [
                                      i === journey.length - 1
                                        ? "is-current"
                                        : "",
                                      active ? "is-selected" : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || undefined
                                  }
                                >
                                  <button
                                    type="button"
                                    className="timeline-hit"
                                    aria-pressed={active}
                                    onClick={() =>
                                      setSelected(
                                        active
                                          ? null
                                          : { code: shipment.code, id: e.id },
                                      )
                                    }
                                  >
                                    <strong>{statusLabels[e.status]}</strong>
                                    <span className="tl-line">
                                      {e.location}
                                    </span>
                                    {e.note && (
                                      <span className="tl-line">{e.note}</span>
                                    )}
                                    <span className="timeline-meta">
                                      <time dateTime={e.createdAt}>
                                        {displayDate(e.createdAt, true)}
                                      </time>
                                      <span className={"src " + e.source}>
                                        {sourceLabel(e.source)}
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ol>
                        </>
                      )}
                    </div>
                  </section>
                  <div className="panel help-panel">
                    <Headphones size={25} />
                    <div>
                      Need a hand with your shipment?
                      <br />
                      <a
                        href="https://wa.me/15625216164"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Chat with us on WhatsApp ↗
                      </a>
                      <br />
                      <a href="/request">Or send a message ↗</a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
