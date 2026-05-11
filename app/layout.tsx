import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESL Worksheet Generator",
  description: "Internal tool for esllaboratory.com — generate classroom-ready ESL vocabulary worksheets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
