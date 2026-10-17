import type { Metadata, Viewport } from "next";
import { DotGothic16 } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const retro = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-retro",
});

export const metadata: Metadata = {
  title: "Heather 가계부",
  description: "Heather의 개인 가계부",
  appleWebApp: { capable: true, title: "Heather 가계부", statusBarStyle: "default" },
  icons: { apple: "/pwa-icon/180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f0e1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={retro.variable}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
