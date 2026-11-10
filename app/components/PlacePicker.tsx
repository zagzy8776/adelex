"use client";
import { useEffect, useId, useState } from "react";

type City = [
  id: string,
  name: string,
  region: string,
  latitude: number,
  longitude: number,
];
type Places = { regions: Record<string, string>; cities: City[] };
type Props = {
  label: string;
  name?: string;
  value: string;
  onChange: (name: string) => void;
  onPosition: (lat: number, lng: number) => void;
};

export default function PlacePicker({
  label,
  name,
  value,
  onChange,
  onPosition,
}: Props) {
  const fieldId = useId();
  const [countries, setCountries] = useState<[string, string][]>([]);
  const [country, setCountry] = useState(""),
    [region, setRegion] = useState(""),
    [city, setCity] = useState(""),
    [county, setCounty] = useState("");
  const [places, setPlaces] = useState<Places | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    fetch("/places/countries.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<[string, string][]>;
      })
      .then(setCountries)
      .catch(() => {
        if (!abort.signal.aborted)
          setError("Location list unavailable. Enter a location below.");
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    setPlaces(null);
    if (!country) return;
    const abort = new AbortController();
    setError("");
    fetch("/places/" + country[0] + ".json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<Record<string, Places>>;
      })
      .then((d) => {
        if (!abort.signal.aborted) setPlaces(d[country]);
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError("Region list unavailable. Enter a location below.");
      });
    return () => abort.abort();
  }, [country]);
  function apply(cityId: string, countyName: string) {
    const item = places?.cities.find((c) => c[0] === cityId);
    if (!item) return;
    const countryName = countries.find((c) => c[0] === country)?.[1];
    onChange(
      [item[1], countyName.trim(), places?.regions[item[2]], countryName]
        .filter(Boolean)
        .join(", "),
    );
    onPosition(item[3], item[4]);
  }
  return (
    <fieldset className="place-picker full">
      <legend>{label}</legend>
      <div className="form-grid">
        <label>
          Country or territory
          <select
            value={country}
            onChange={(e) => {
              onChange("");
              setCountry(e.target.value);
              setRegion("");
              setCity("");
              setCounty("");
              setPlaces(null);
            }}
          >
            <option value="">Choose country</option>
            {countries.map(([iso, n]) => (
              <option key={iso} value={iso}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          State, province or region
          <select
            disabled={!places}
            value={region}
            onChange={(e) => {
              onChange("");
              setRegion(e.target.value);
              setCity("");
            }}
          >
            <option value="">All regions</option>
            {Object.entries(places?.regions || {})
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([code, n]) => (
                <option key={code} value={code}>
                  {n}
                </option>
              ))}
          </select>
        </label>
        <label>
          City
          <select
            disabled={!places}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              apply(e.target.value, county);
            }}
          >
            <option value="">Choose city</option>
            {places?.cities
              .filter((c) => !region || c[2] === region)
              .map((c) => (
                <option key={c[0]} value={c[0]}>
                  {c[1]}
                  {!region && places.regions[c[2]]
                    ? " · " + places.regions[c[2]]
                    : ""}
                </option>
              ))}
          </select>
        </label>
        <label>
          County or district (optional)
          <input
            value={county}
            maxLength={60}
            onChange={(e) => {
              setCounty(e.target.value);
              apply(city, e.target.value);
            }}
          />
        </label>
      </div>
      <label htmlFor={fieldId}>
        Location to publish
        <input
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={2}
          maxLength={160}
          placeholder="City, region, country"
        />
      </label>
      <small>
        {error ||
          "Choose a city to set approximate coordinates, or enter an unlisted location and place its pin on the map."}{" "}
        <a
          href="https://www.geonames.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          GeoNames
        </a>
      </small>
    </fieldset>
  );
}
