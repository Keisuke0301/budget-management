import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Osawa Family Hub",
  description: "Efficiently manage your weekly budget and chores.",
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
