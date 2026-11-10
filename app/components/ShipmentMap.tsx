"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { LocateFixed, Map as MapIcon } from "lucide-react";
import type { PublicShipment } from "@/app/lib/domain";
type Point = [number, number];
export default function ShipmentMap({
  shipment,
  onPick,
}: {
  shipment: PublicShipment;
  onPick?: (lat: number, lng: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    lib = useRef<typeof Leaflet | null>(null),
    marker = useRef<Leaflet.Marker | null>(null),
    layer = useRef<Leaflet.LayerGroup | null>(null),
    completedRoute = useRef<Leaflet.Polyline | null>(null),
    frame = useRef(0),
    pick = useRef(onPick),
    current = useRef<Point>([shipment.currentLat, shipment.currentLng]),
    rotation = useRef(45);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  pick.current = onPick;
  
  // Calculate angle between two points
  const calculateBearing = (from: Point, to: Point): number => {
    const lat1 = (from[0] * Math.PI) / 180;
    const lat2 = (to[0] * Math.PI) / 180;
    const dLng = ((to[1] - from[1]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };
  useEffect(() => {
    let cancelled = false;
    import("leaflet")
      .then((L) => {
        if (cancelled || !root.current) return;
        lib.current = L;
        const m = L.map(root.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView(current.current, 7);
        map.current = m;
        
        // Primary tile layer (OpenStreetMap)
        const primaryTiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        });
        
        // Backup tile layer (CartoDB Positron - light theme)
        const backupTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd',
        });
        
        // Try primary first, fallback to backup on error
        let usingBackup = false;
        primaryTiles
          .on("tileerror", () => {
            if (!usingBackup) {
              usingBackup = true;
              primaryTiles.remove();
              backupTiles.addTo(m);
            } else {
              setError(true);
            }
          })
          .on("tileload", () => setError(false))
          .addTo(m);
        
        backupTiles.on("tileerror", () => setError(true));
        backupTiles.on("tileload", () => setError(false));
        
        layer.current = L.layerGroup().addTo(m);
        m.on("click", (e: Leaflet.LeafletMouseEvent) =>
          pick.current?.(
            Number(e.latlng.lat.toFixed(6)),
            Number(e.latlng.lng.toFixed(6)),
          ),
        );
        setReady(true);
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame.current);
      map.current?.remove();
      map.current = null;
      setReady(false);
    };
  }, []);
  useEffect(() => {
    const L = lib.current,
      m = map.current,
      g = layer.current;
    if (!ready || !L || !m || !g) return;
    g.clearLayers();
    const start: Point = [shipment.originLat, shipment.originLng],
      end: Point = [shipment.destinationLat, shipment.destinationLng];
    const route: Point[] = [
      start,
      ...(shipment.events || [])
        .slice()
        .reverse()
        .map((e) => [e.lat, e.lng] as Point),
      [shipment.currentLat, shipment.currentLng],
      end,
    ];
    L.polyline(route, {
      color: "#e1852d",
      weight: 3,
      opacity: 0.8,
      dashArray: "7 9",
    }).addTo(g);
    const safeLabel = (name: string) => {
      const label = document.createElement("span");
      label.textContent = name;
      return label;
    };
    const point = (p: Point, name: string, cls: string) =>
      L.marker(p, {
        icon: L.divIcon({
          className: "map-stop " + cls,
          html: "<span></span>",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      })
        .bindTooltip(safeLabel(name), { direction: "top", offset: [0, -10] })
        .addTo(g);
    point(start, shipment.origin, "origin");
    point(end, shipment.destination, "destination");
    if (!marker.current) {
      marker.current = L.marker(current.current, {
        icon: L.divIcon({
          className: "shipment-marker",
          html: `<span class="marker-pulse"></span>
                 <span class="marker-box">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                   </svg>
                 </span>`,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        }),
      }).addTo(m);
      m.fitBounds(L.latLngBounds([start, end, ...route]), {
        padding: [45, 55],
        maxZoom: 11,
      });
    }
    marker.current.unbindTooltip();
    marker.current.bindTooltip(safeLabel(shipment.currentLocation), {
      direction: "top",
      offset: [0, -22],
    });
    const to: Point = [shipment.currentLat, shipment.currentLng],
      from = current.current;
    
    // Calculate rotation angle
    const targetRotation = calculateBearing(from, to);
    const startRotation = rotation.current;
    
    // Create completed route line (from origin to current position)
    if (completedRoute.current) {
      completedRoute.current.remove();
    }
    const completedPath: Point[] = [
      start,
      ...(shipment.events || [])
        .slice()
        .reverse()
        .map((e) => [e.lat, e.lng] as Point),
      to,
    ];
    completedRoute.current = L.polyline(completedPath, {
      color: "#e1852d",
      weight: 4,
      opacity: 1,
    }).addTo(g);
    completedRoute.current.bringToBack();

    const began = performance.now();
    cancelAnimationFrame(frame.current);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 1600;
    const move = (time: number) => {
      const t = duration ? Math.min(1, (time - began) / duration) : 1;
      const smooth = t * t * (3 - 2 * t);
      current.current = [
        from[0] + (to[0] - from[0]) * smooth,
        from[1] + (to[1] - from[1]) * smooth,
      ];
      
      // Smooth rotation interpolation
      let angleDiff = targetRotation - startRotation;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      rotation.current = startRotation + angleDiff * smooth;
      
      marker.current?.setLatLng(current.current);
      
      // Apply rotation to marker
      const markerElement = marker.current?.getElement();
      if (markerElement) {
        const markerBox = markerElement.querySelector('.marker-box') as HTMLElement;
        if (markerBox) {
          markerBox.style.transform = `rotate(${rotation.current}deg)`;
        }
      }
      
      // Smooth camera following
      if (map.current && t > 0.3) {
        map.current.panTo(current.current, { animate: true, duration: 0.5, noMoveStart: true });
      }
      
      if (t < 1) frame.current = requestAnimationFrame(move);
    };
    frame.current = requestAnimationFrame(move);
  }, [shipment, ready]);
  const center = () => {
    const L = lib.current;
    if (L && map.current)
      map.current.fitBounds(
        L.latLngBounds([
          [shipment.originLat, shipment.originLng],
          [shipment.currentLat, shipment.currentLng],
          [shipment.destinationLat, shipment.destinationLng],
        ]),
        { padding: [45, 55], maxZoom: 11 },
      );
  };
  return (
    <div className="map-shell">
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
            {error
              ? "Map unavailable. Shipment details remain available below."
              : "Loading shipment map…"}
          </span>
        </div>
      )}
      <button
        className="map-center"
        onClick={center}
        aria-label="Fit shipment route"
      >
        <LocateFixed size={18} />
      </button>
      <div className="map-key">
        <span className="orange-dot" />
        {onPick ? "Click map to choose reported position" : "Reported position"}
        <span className="key-dash" />
        Route guide
      </div>
      {error && ready && (
        <div className="map-warning">
          Map tiles unavailable. Showing reported coordinates.
        </div>
      )}
    </div>
  );
}
