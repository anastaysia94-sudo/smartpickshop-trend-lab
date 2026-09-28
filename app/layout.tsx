import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trend Lab · SmartPickShop",
  description: "Compare niche opportunities with transparent, editable scoring.",
  manifest: "/manifest.webmanifest",
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
