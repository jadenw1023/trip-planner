import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Plan trips together in real time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}