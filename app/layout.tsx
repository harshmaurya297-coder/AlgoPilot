import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlgoPilot AI | DSA Problem Manager",
  description:
    "Your personal DSA problem tracker, practice roadmap, and AI learning companion.",
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