import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GraveGuide",
  description: "Search cemetery records, graves, and memorial locations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
