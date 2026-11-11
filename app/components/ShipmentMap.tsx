"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { LocateFixed, Map as MapIcon } from "lucide-react";
import { displayDate, type PublicShipment } from "@/app/lib/domain";
import {
  bearing,
  easeInOut,
  normaliseRoute,
  routePoints,
  splitRoute,
  trailLimits,
  trailRuns,
  transitionFor,
  type Point,
  type TrailReport,
} from "@/app/lib/geo";
import { TileFailover, tileUrl } from "@/app/lib/tiles";

/**
 * A historical update to show on the map, used by the journey timeline.
 * The title and detail are pre-formatted by the caller so this component needs
 * to know nothing about status or date wording.
 */
export type MapFocus = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  detail: string;
};

/**
 * Key-free basemap. Provider health, cooldowns and per-tile fallback live in
 * `app/lib/tiles.ts` so they can be tested without a browser.
 */

/**
 * The live marker's glyph: a solid airplane, nose up, on a 24×24 grid.
 *
 * Nose up is the whole point of the shape: the travel bearing is applied with
 * `rotate()`, where 0° is north, so the silhouette follows the same convention
 * as a compass needle and needs no offset. The outline is symmetric about the
 * vertical axis and spans 2–22 in both directions, so its centre is exactly
 * (12, 12) — that is what keeps it dead centre inside the circular badge
 * without nudging it with margins. It is filled rather than stroked because a
 * solid silhouette stays crisp at the 20 px rendered size on 1× and 2× screens,
 * where a hairline stroke would alias.
 */
const MARKER_PLANE =
  '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>';

/** Legend wording for the part of the route not yet travelled. */
function guideLabel(service: string, planned: boolean) {
  if (planned) return "Planned route";
  if (service === "Air freight") return "Flight path";
  if (service === "Ocean freight") return "Sea leg";
  return "Direct guide";
}

/** Legend hover text: says plainly what the dashed line is, and is not. */
function guideHint(service: string, planned: boolean) {
  if (planned) return "Route geometry supplied by dispatch.";
  if (service === "Air freight")
    return "Great-circle flight path between the two airports. Not an airway or radar track.";
  if (service === "Ocean freight")
    return "Indicative sea leg. Not a navigable maritime route.";
  return "Straight guide between positions. No road routing data available.";
}

/** Stroke for the remaining part of the route, by transport mode. */
function guideStyle(service: string, planned: boolean): Leaflet.PathOptions {
  if (planned)
    return {
      color: "#93a3b5",
      weight: 3,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    };
  if (service === "Air freight")
    return {
      color: "#8d9ec4",
      weight: 2.5,
      opacity: 0.95,
      dashArray: "1 9",
      lineCap: "round",
    };
  if (service === "Ocean freight")
    return {
      color: "#6f93a3",
      weight: 3,
      opacity: 0.95,
      dashArray: "7 8",
      lineCap: "round",
    };
  return {
    color: "#9aabbd",
    weight: 2.5,
    opacity: 0.95,
    dashArray: "1 8",
    lineCap: "round",
  };
}

/** A text node as an element, so no user-supplied string is parsed as HTML. */
const text = (value: string) => {
  const span = document.createElement("span");
  span.textContent = value;
  return span;
};

/** Tooltip body: what happened, then the detail (place and time). */
const tip = (title: string, detail: string) => {
  const box = document.createElement("span");
  box.className = "map-tip";
  const strong = document.createElement("b");
  strong.textContent = title;
  const small = document.createElement("i");
  small.textContent = detail;
  box.appendChild(strong);
  box.appendChild(small);
  return box;
};

export default function ShipmentMap({
  shipment,
  onPick,
  focus = null,
}: {
  shipment: PublicShipment;
  onPick?: (lat: number, lng: number) => void;
  focus?: MapFocus | null;
}) {
  const root = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    lib = useRef<typeof Leaflet | null>(null),
    marker = useRef<Leaflet.Marker | null>(null),
    rotor = useRef<HTMLElement | null>(null),
    badge = useRef<HTMLElement | null>(null),
    group = useRef<Leaflet.LayerGroup | null>(null),
    focusLayer = useRef<Leaflet.LayerGroup | null>(null),
    focusSig = useRef(""),
    focusOn = useRef(false),
    frame = useRef(0),
    pulse = useRef<ReturnType<typeof setTimeout> | null>(null),
    pick = useRef(onPick),
    current = useRef<Point>([shipment.currentLat, shipment.currentLng]),
    heading = useRef(0),
    health = useRef<TileFailover | null>(null),
    active = useRef(""),
    trackedCode = useRef(""),
    markerService = useRef(""),
    loads = useRef(0),
    misses = useRef(0);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [tilesMissing, setTilesMissing] = useState(false);

  /**
   * Observed travel, split into runs that can honestly be drawn as one line.
   *
   * The pickup point and the latest reported position bracket the recorded
   * events, so a jump between *any* two consecutive reports is judged by the
   * same rule. A jump becomes a dashed join rather than a solid path.
   */
  const trail = useMemo(() => {
    const events = [...(shipment.events ?? [])]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .filter(
        (event) => Number.isFinite(event.lat) && Number.isFinite(event.lng),
      );
    const newest = events[events.length - 1];
    // The latest position may have been reported after the last event.
    const latest = Math.max(
      Date.parse(shipment.locationUpdatedAt) || 0,
      newest ? Date.parse(newest.createdAt) || 0 : 0,
    );
    const reports: TrailReport[] = [
      {
        point: [shipment.originLat, shipment.originLng],
        at: Date.parse(shipment.createdAt) || 0,
      },
      ...events.map(
        (event): TrailReport => ({
          point: [event.lat, event.lng],
          at: Date.parse(event.createdAt) || 0,
        }),
      ),
      { point: [shipment.currentLat, shipment.currentLng], at: latest },
    ];
    const runs = trailRuns(reports, trailLimits(shipment.service));
    const solid: Point[][] = [];
    const joins: [Point, Point][] = [];
    runs.forEach((run, i) => {
      if (run.gap && i > 0) {
        const previous = runs[i - 1].points;
        joins.push([previous[previous.length - 1], run.points[0]]);
      }
      if (run.points.length > 1) solid.push(run.points);
    });
    return { solid, joins };
  }, [shipment]);

  // Keep the click handler current without rebuilding the map.
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const disposers: (() => void)[] = [];
    import("leaflet")
      .then((L) => {
        if (cancelled || !root.current) return;
        lib.current = L;
        const m = L.map(root.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView(current.current, 7);
        map.current = m;

        const failover = new TileFailover();
        health.current = failover;
        const first = failover.order()[0];
        active.current = first.id;
        const tiles = L.tileLayer(first.url, {
          subdomains: first.subdomains || "abc",
          attribution: first.attribution,
          minZoom: 2,
          maxZoom: 19,
        }).addTo(m);

        /**
         * When the provider behind the map trips its cooldown, only the template
         * for *new* tiles changes. `setUrl(url, true)` keeps every tile that has
         * already rendered, so a swap never blanks a working basemap.
         */
        const promote = () => {
          const now = Date.now();
          if (!failover.isBenched(active.current, now)) return;
          const next = failover.order(now)[0];
          if (!next || next.id === active.current) return;
          active.current = next.id;
          tiles.options.subdomains = next.subdomains || "abc";
          tiles.options.attribution = next.attribution;
          tiles.setUrl(next.url, true);
        };

        tiles.on("tileload", (event: Leaflet.TileEvent) => {
          const tile = event.tile as HTMLImageElement;
          failover.report(tile.dataset.pid || active.current, true);
          loads.current += 1;
          // A few good tiles mean the basemap works. Isolated gaps elsewhere are
          // not worth alarming the customer about.
          if (loads.current >= 3) setTilesMissing(false);
          promote();
        });

        tiles.on("tileerror", (event: Leaflet.TileErrorEvent) => {
          const tile = event.tile as HTMLImageElement | undefined;
          if (!tile) return;
          const served = tile.dataset.pid || active.current;
          failover.report(served, false);
          promote();
          // Retry this one tile on the next healthy provider. Everything that
          // already loaded stays exactly where it is, and the tile is never
          // retried on a provider that has already failed it.
          const tried = (tile.dataset.tried || "").split(",").filter(Boolean);
          if (!tried.includes(served)) tried.push(served);
          const next = failover.order().find((p) => !tried.includes(p.id));
          if (next) {
            tile.dataset.tried = [...tried, next.id].join(",");
            tile.dataset.pid = next.id;
            tile.src = tileUrl(next, event.coords.z, event.coords.x, event.coords.y);
            return;
          }
          misses.current += 1;
          tile.style.visibility = "hidden";
          // Warn only when nothing at all has rendered.
          if (loads.current === 0 && misses.current >= 3) setTilesMissing(true);
        });

        m.on("click", (event: Leaflet.LeafletMouseEvent) =>
          pick.current?.(
            Number(event.latlng.lat.toFixed(6)),
            Number(event.latlng.lng.toFixed(6)),
          ),
        );

        // Route, pins and marker live in one group, so a report update redraws
        // them without touching the basemap or its loaded tiles.
        group.current = L.layerGroup().addTo(m);
        // Selected historical updates get their own group: the timeline can move
        // the focus without the route redraw clearing it.
        focusLayer.current = L.layerGroup().addTo(m);

        // Leaflet measures its container once. Re-measure when a modal opens or
        // a responsive column changes width.
        const refresh = () => m.invalidateSize();
        if (typeof ResizeObserver !== "undefined" && root.current) {
          observer = new ResizeObserver(refresh);
          observer.observe(root.current);
        }
        const late = setTimeout(refresh, 0);
        disposers.push(() => clearTimeout(late));

        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame.current);
      if (pulse.current) clearTimeout(pulse.current);
      disposers.forEach((dispose) => dispose());
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
      rotor.current = null;
      badge.current = null;
      group.current = null;
      focusLayer.current = null;
      focusSig.current = "";
      focusOn.current = false;
      lib.current = null;
      health.current = null;
      trackedCode.current = "";
      markerService.current = "";
      loads.current = 0;
      misses.current = 0;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const L = lib.current,
      m = map.current,
      g = group.current;
    if (!ready || !L || !m || !g) return;
    g.clearLayers();

    const start: Point = [shipment.originLat, shipment.originLng],
      end: Point = [shipment.destinationLat, shipment.destinationLng],
      here: Point = [shipment.currentLat, shipment.currentLng];

    const planned = normaliseRoute(shipment.routeGeometry);
    const path = routePoints(shipment.service, start, end, planned);
    const { remaining } = splitRoute(path, here);

    // Gaps between reports are joins, not observed travel: drawn dashed so the
    // map never claims a route the vehicle was not seen to take.
    for (const [from, to] of trail.joins)
      L.polyline([from, to], {
        color: "#9aa6b4",
        weight: 2,
        opacity: 0.9,
        dashArray: "2 7",
        lineCap: "round",
        interactive: false,
      }).addTo(g);

    // What is left of the route, shaped and styled for the transport mode.
    L.polyline(remaining, {
      ...guideStyle(shipment.service, !!planned),
      interactive: false,
    }).addTo(g);

    for (const run of trail.solid) {
      // White casing gives the travelled path a clean cartographic edge.
      L.polyline(run, {
        color: "#ffffff",
        weight: 8,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(g);
      L.polyline(run, {
        color: "#e1852d",
        weight: 4,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      }).addTo(g);
    }

    const pin = (point: Point, name: string, kind: "origin" | "destination") =>
      L.marker(point, {
        icon: L.divIcon({
          className: "map-pin " + kind,
          html: `<span class="pin-card"><b>${
            kind === "origin" ? "A" : "B"
          }</b></span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 31],
        }),
        zIndexOffset: kind === "origin" ? 200 : 210,
      })
        .bindTooltip(text(name), { direction: "top", offset: [0, -34] })
        .addTo(g);
    pin(start, shipment.origin, "origin");
    pin(end, shipment.destination, "destination");

    // A different shipment in the same map instance needs a fresh marker and a
    // fitted view. The glyph is now mode-independent, so a mode switch no longer
    // *has* to rebuild it, but it still does: the route is redrawn for the new
    // mode and the view is refitted to it below.
    const switched = trackedCode.current !== shipment.code;
    trackedCode.current = shipment.code;
    if (
      marker.current &&
      (switched || markerService.current !== shipment.service)
    ) {
      marker.current.remove();
      marker.current = null;
      rotor.current = null;
      badge.current = null;
    }

    if (!marker.current) {
      const vehicle = L.marker(here, {
        icon: L.divIcon({
          className: "shipment-marker",
          // The plane turns with the reported bearing, so it *is* the direction
          // indicator; a separate fixed needle would point a second, conflicting
          // way. Only the rotor carries a transform, leaving the badge free for
          // the pulse and jump animations.
          html: `<span class="marker-pulse"></span>
                 <span class="marker-badge">
                   <span class="marker-rotor"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" shape-rendering="geometricPrecision">${MARKER_PLANE}</svg></span>
                 </span>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        }),
        zIndexOffset: 1000,
      }).addTo(m);
      marker.current = vehicle;
      markerService.current = shipment.service;
      rotor.current =
        (vehicle
          .getElement()
          ?.querySelector(".marker-rotor") as HTMLElement | null) ?? null;
      badge.current =
        (vehicle
          .getElement()
          ?.querySelector(".marker-badge") as HTMLElement | null) ?? null;
      current.current = here;
      m.fitBounds(
        L.latLngBounds([
          start,
          end,
          here,
          ...trail.solid.flat(),
          ...trail.joins.flat(),
        ]),
        {
          padding: [48, 56],
          maxZoom: 11,
        },
      );
    }

    marker.current.unbindTooltip();
    marker.current.bindTooltip(
      tip(
        shipment.currentLocation,
        "Reported " + displayDate(shipment.locationUpdatedAt, true),
      ),
      { direction: "top", offset: [0, -30] },
    );
    const from = current.current;
    const targetHeading = bearing(from, here);
    let turn = targetHeading - heading.current;
    if (turn > 180) turn -= 360;
    if (turn < -180) turn += 360;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const { mode, duration } = transitionFor(from, here, reduced);
    cancelAnimationFrame(frame.current);

    // `glide` while the per-frame animation is running: a CSS transition on the
    // rotor would be restarted on every frame (60×/s), smoothing each 1 px step
    // and leaving the plane visibly trailing its own heading. Discrete moves keep
    // the transition, so a single jump still turns with an eased 0.45 s swing.
    const place = (point: Point, degrees: number, glide = false) => {
      current.current = point;
      heading.current = degrees;
      marker.current?.setLatLng(point);
      const node = rotor.current;
      if (node) {
        node.style.transition = glide ? "none" : "";
        node.style.transform = `rotate(${degrees}deg)`;
      }
    };

    if (mode === "relocate") {
      // Two reports far apart: move straight there and pulse once. Animating a
      // 400 km gap over a second would imply the vehicle physically drove it,
      // which is exactly the misleading effect to avoid. The tooltip and the
      // report strip carry the timestamp, so the marker always shows the latest
      // *reported* position rather than an invented position in between.
      place(here, heading.current + turn);
      if (!focusOn.current)
        m.panInside(here, { padding: [80, 80], animate: false });
      const node = badge.current;
      if (node && duration) {
        node.classList.remove("is-jumped");
        node.getBoundingClientRect(); // replay the one-shot animation
        node.classList.add("is-jumped");
        if (pulse.current) clearTimeout(pulse.current);
        pulse.current = setTimeout(
          () => node.classList.remove("is-jumped"),
          duration + 200,
        );
      }
      return;
    }

    // A short glide for a genuinely small move between two reports.
    const startHeading = heading.current;
    const began = performance.now();
    const move = (time: number) => {
      const t = duration ? Math.min(1, (time - began) / duration) : 1;
      const eased = easeInOut(t);
      place(
        [
          from[0] + (here[0] - from[0]) * eased,
          from[1] + (here[1] - from[1]) * eased,
        ],
        startHeading + turn * eased,
        true,
      );
      // Keep the vehicle comfortably on screen without animating every frame.
      // While a historical update is focused the camera belongs to that update.
      if (t > 0.25 && !focusOn.current)
        m.panInside(current.current, { padding: [80, 80], animate: false });
      if (t < 1) frame.current = requestAnimationFrame(move);
    };
    frame.current = requestAnimationFrame(move);
  }, [shipment, ready, trail]);

  /**
   * A historical update selected in the journey timeline.
   *
   * Kept in its own effect and layer group: selecting an update must not redraw
   * the route or animate the live marker, and a new report must not steal the
   * camera from the update the customer is reading.
   */
  useEffect(() => {
    const L = lib.current,
      m = map.current,
      layer = focusLayer.current;
    if (!ready || !L || !m || !layer) return;
    // A plain signature, not object identity: the caller re-renders regularly
    // and must not redraw (or re-open) the same selection every time.
    const signature = focus
      ? [focus.id, focus.lat, focus.lng, focus.title, focus.detail].join("|")
      : "";
    if (signature === focusSig.current) return;
    focusSig.current = signature;
    layer.clearLayers();
    focusOn.current = !!focus;
    if (!focus) return;
    const point: Point = [focus.lat, focus.lng];
    const marker = L.marker(point, {
      icon: L.divIcon({
        className: "map-focus",
        html: '<span class="focus-ring"></span><span class="focus-dot"></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
      zIndexOffset: 1500,
      keyboard: false,
    })
      .bindTooltip(tip(focus.title, focus.detail), {
        direction: "top",
        offset: [0, -18],
      })
      .addTo(layer);
    marker.openTooltip();

    // Only move the camera when the selection actually changes: a new report
    // must not yank the view away from the update being read.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const zoom = Math.max(m.getZoom(), 8);
    if (reduced) m.setView(point, zoom);
    else m.flyTo(point, zoom, { duration: 0.7 });
  }, [focus, ready]);

  const recenter = () => {
    const L = lib.current;
    if (!L || !map.current) return;
    const path = routePoints(
      shipment.service,
      [shipment.originLat, shipment.originLng],
      [shipment.destinationLat, shipment.destinationLng],
      normaliseRoute(shipment.routeGeometry),
    );
    map.current.fitBounds(
      L.latLngBounds([...path, [shipment.currentLat, shipment.currentLng]]),
      { padding: [48, 56], maxZoom: 11 },
    );
  };

  const planned = !!normaliseRoute(shipment.routeGeometry);
  return (
    <div className={onPick ? "map-shell picker" : "map-shell"}>
      <div
        ref={root}
        className="shipment-map"
        role="region"
        aria-label="Shipment location map"
      />
      {!ready && (
        <div className="map-loading">
          <MapIcon />
          <span>
            {failed
              ? "Map unavailable. Shipment details remain available below."
              : "Loading shipment map…"}
          </span>
        </div>
      )}
      <button
        className="map-center"
        onClick={recenter}
        aria-label="Fit shipment route"
        title="Fit shipment route"
      >
        <LocateFixed size={18} />
      </button>
      <div className="map-key">
        <span className="key-item">
          <i className="key-line" />
          Travelled
        </span>
        {trail.joins.length > 0 && (
          <span
            className="key-item"
            title="No reports between these two points: the dashed join is a gap in the record, not a claimed route."
          >
            <i className="key-line gap" />
            Gap in reports
          </span>
        )}
        <span
          className="key-item"
          title={guideHint(shipment.service, planned)}
        >
          <i className="key-line dotted" />
          {guideLabel(shipment.service, planned)}
        </span>
        <span className="key-item">
          <i className="key-dot" />
          {onPick ? "Click map to set the position" : "Reported position"}
        </span>
      </div>
      {ready && tilesMissing && (
        <div className="map-warning">
          Basemap tiles are unavailable right now. The route and reported
          coordinates still work.
        </div>
      )}
    </div>
  );
}



