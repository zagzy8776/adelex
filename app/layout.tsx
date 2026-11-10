import type { Metadata } from "next";
import "./globals.css";
import "./upgrade.css";

export const metadata: Metadata = {
  title: {
    default: "ADEXEC Logistics — Every shipment. A promise delivered.",
    template: "%s | ADEXEC Logistics",
  },
  description:
    "Shipping with clarity. Request a delivery, follow your shipment on the map, and stay informed at every milestone with ADEXEC Logistics.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
