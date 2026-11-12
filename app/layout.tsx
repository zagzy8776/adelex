import type { Metadata } from "next";
import "./globals.css";
import "./upgrade.css";
import { LanguageProvider } from "./components/LanguageProvider";
// deploy-trigger: force vercel rebuild for i18n

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
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
