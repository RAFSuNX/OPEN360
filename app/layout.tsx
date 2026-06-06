import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "OPEN360",
  description: "360-degree employee review system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#ffffff' }}>
      <body style={{ minHeight: '100vh', background: '#ffffff' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
