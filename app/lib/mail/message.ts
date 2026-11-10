import { statusLabels } from "../domain";
export const website = "https://adexeclogistics.org";
export interface MailDetails {
  reference: string;
  status?: string;
  location?: string;
  note?: string;
  reported?: string;
  origin?: string;
  destination?: string;
  eta?: string;
}
const titles: Record<string, string> = {
  request: "Shipping request received",
  booking: "Your shipment is booked",
  replacement: "Your new tracking link",
  estimate: "Delivery estimate updated",
  correction: "Shipment update corrected",
};
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const moment = (s: string) =>
  new Date(s).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
export function emailMessage(kind: string, d: MailDetails) {
  const heading =
    titles[kind] || statusLabels[d.status || ""] || "Shipment update";
  const subject = "ADEXEC Logistics · " + heading + " · " + d.reference;
  const intro =
    kind === "request"
      ? "Our shipping team has received your request and will contact you to confirm availability and pricing. This is a request receipt."
      : kind === "replacement"
        ? "Dispatch issued a replacement tracking link. Use the link below for future updates."
        : kind === "booking"
          ? "Your shipment is ready to track. Use your private link to follow its journey."
          : kind === "correction"
            ? "Dispatch corrected an earlier milestone. Open tracking for the latest position and the complete timeline."
            : "Dispatch has updated your shipment.";
  const rows = [
    ["Reference", d.reference],
    [
      "Route",
      d.origin && d.destination ? d.origin + " → " + d.destination : "",
    ],
    ["Reported location", d.location],
    ["Reported at", d.reported && moment(d.reported)],
    ["Estimated delivery", d.eta && moment(d.eta)],
    ["Dispatch note", d.note],
  ].filter((p): p is [string, string] => !!p[1]);
  const link =
    kind === "request"
      ? null
      : website + "/track?code=" + encodeURIComponent(d.reference);
  const footer = link
    ? "This tracking link is private. Share it only with someone who should see this shipment."
    : "Keep your request reference for follow-up with dispatch.";
  const text = [
    heading,
    intro,
    ...rows.map(([k, v]) => k + ": " + v),
    link ? "Track shipment: " + link : "",
    footer,
    website,
  ]
    .filter(Boolean)
    .join("\n\n");
  const html =
    '<!doctype html><html><body style="margin:0;background:#f4f6f8;font:15px/1.6 Arial,sans-serif;color:#132840"><div style="max-width:560px;margin:24px auto;background:white"><div style="padding:20px 28px;background:#06182e;color:#fff0dc;font-weight:bold">ADEXEC LOGISTICS</div><div style="padding:28px"><h1 style="font-size:23px">' +
    escape(heading) +
    "</h1><p>" +
    escape(intro) +
    "</p>" +
    rows
      .map(
        ([k, v]) =>
          "<p><strong>" + escape(k) + "</strong><br>" + escape(v) + "</p>",
      )
      .join("") +
    (link
      ? '<p><a href="' +
        escape(link) +
        '" style="display:inline-block;padding:12px 18px;background:#ef8b2c;color:#06182e;text-decoration:none">Track your shipment</a></p>'
      : "") +
    '<p style="font-size:12px;color:#58687a">' +
    escape(footer) +
    "</p></div></div></body></html>";
  return { subject, text, html };
}
