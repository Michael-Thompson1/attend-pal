import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attend Pal",
  description: "Attendance verification for university lectures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
