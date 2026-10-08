import type { Metadata } from "next";
import "./globals.css";
import ProtectedLayout from "./ProtectedLayout";

export const metadata: Metadata = {
  title: "Legal Desk",
  description: "Modern legal case management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProtectedLayout>{children}</ProtectedLayout>
      </body>
    </html>
  );
}