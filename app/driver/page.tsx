"use client";
import { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, Info, Square, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/app/components/Shell";
export default function Driver() {
  const [info, setInfo] = useState<{
      code: string;
      origin: string;
      destination: string;
    } | null>(null),
    [error, setError] = useState(""),
    [active, setActive] = useState(false),
    [last, setLast] = useState(""),
    [loading, setLoading] = useState(true);
  const watcher = useRef<number | null>(null),
    lastSent = useRef(0),
    credentials = useRef({ id: "", token: "" }),
    abort = useRef<AbortController | null>(null),
    running = useRef(false),
    pending = useRef(false);
  const stop = () => {
    running.current = false;
    pending.current = false;
    if (watcher.current !== null)
      navigator.geolocation.clearWatch(watcher.current);
    watcher.current = null;
    abort.current?.abort();
    setActive(false);
  };
  useEffect(() => {
    credentials.current = {
      id: new URLSearchParams(location.search).get("shipment") || "",
      token: location.hash.slice(1),
    };
    if (!credentials.current.id || !credentials.current.token) {
      setError("Open the complete driver link provided by dispatch.");
      setLoading(false);
      return;
    }
    fetch("/api/driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials.current, action: "inspect" }),
    })
      .then(async (r) => {
        const d = (await r.json()) as {
          error: string;
          code: string;
          origin: string;
          destination: string;
        };
        if (!r.ok) throw new Error(d.error);
        setInfo(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      running.current = false;
      if (watcher.current !== null)
        navigator.geolocation.clearWatch(watcher.current);
      abort.current?.abort();
    };
  }, []);
  function start() {
    if (!navigator.geolocation) {
      setError("This browser does not support GPS location sharing.");
      return;
    }
    setError("");
    setActive(true);
    running.current = true;
    lastSent.current = 0;
    watcher.current = navigator.geolocation.watchPosition(
      async (position) => {
        if (
          !running.current ||
          pending.current ||
          Date.now() - lastSent.current < 15000
        )
          return;
        if (position.coords.accuracy > 2000) {
          setError(
            "GPS accuracy is too low. Move to an area with a better signal.",
          );
          return;
        }
        lastSent.current = Date.now();
        pending.current = true;
        abort.current = new AbortController();
        try {
          const r = await fetch("/api/driver", {
            method: "POST",
            signal: abort.current.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...credentials.current,
              action: "position",
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
            }),
          });
          const d = (await r.json()) as {
            error: string;
            code: string;
            origin: string;
            destination: string;
          };
          if (!r.ok) {
            if ([403, 409].includes(r.status)) stop();
            throw new Error(d.error);
          }
          if (running.current) {
            setLast(new Date().toLocaleTimeString());
            setError("");
          }
        } catch (e) {
          if (e instanceof Error && e.name !== "AbortError")
            setError(e.message);
        } finally {
          pending.current = false;
        }
      },
      (e) => {
        setError(
          e.code === 1
            ? "Location permission was denied. Enable location access in your browser settings to share GPS."
            : e.message,
        );
        if (e.code === 1) stop();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }
  return (
    <>
      <Header />
      <main className="panel driver-card">
        <Navigation size={30} color="#b37333" />
        <h2 style={{ marginTop: 15 }}>Driver location sharing</h2>
        <p>
          Share this device’s location with dispatch and the shipment recipient.
        </p>
        {loading && <p>Checking driver link…</p>}
        {error && (
          <div className="notice error" role="alert">
            <Info size={16} />
            {error}
          </div>
        )}
        {info && (
          <>
            <div className="divider" />
            <strong className="text-sm">{info.code}</strong>
            <p>
              {info.origin} → {info.destination}
            </p>
            <div className="driver-status" role="status">
              <strong>
                {active ? "Location sharing is on" : "Location sharing is off"}
              </strong>
              <span>
                {last
                  ? `Last sent at ${last}`
                  : "No location sent from this session."}
              </span>
            </div>
            <button
              className={"button " + (active ? "outline" : "orange")}
              onClick={active ? stop : start}
            >
              {active ? <Square size={16} /> : <MapPin size={17} />}{" "}
              {active ? "Stop sharing location" : "Start sharing location"}
            </button>
            <p className="privacy-note">
              Keep this page open and your device awake. Browsers may pause GPS
              in the background. Only share location while carrying out the
              delivery. This link is private and expires automatically.
            </p>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
