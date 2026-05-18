import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MapboxConfigProvider } from "@/components/providers/mapbox-config-provider";
import { PushRegistrationMount } from "@/components/providers/push-registration-mount";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulsar — La ciudad ya sabe a dónde vas",
  description: "Movilidad predictiva y mapa vivo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <MapboxConfigProvider token={mapboxToken}>
          <SessionProvider>
            <PushRegistrationMount />
            {children}
          </SessionProvider>
        </MapboxConfigProvider>
      </body>
    </html>
  );
}
