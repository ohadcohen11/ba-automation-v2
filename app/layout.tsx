import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anomaly Detection - Ryze Beyond",
  description: "Daily Morning Routine Analysis for Performance Analysts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
