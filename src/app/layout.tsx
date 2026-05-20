import "@/lib/error-interceptor";
import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TitleUpdater } from "@/components/TitleUpdater";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "3DFlow",
  description: "3D Rendering Service Delivery Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", dmSans.variable, dmMono.variable)}>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <TitleUpdater />
        {children}
      </body>
    </html>
  );
}
