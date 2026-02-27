import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { InstallPrompt } from "@/components/shared/install-prompt";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "OMLEB",
  title: { default: "OMLEB", template: "%s | OMLEB" },
  description: "Reportes diarios de mantenimiento HVAC",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OMLEB",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#111113",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" dir="ltr">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
