import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteLayout from "./global/components/SiteLayout";  // SiteLayout Path (This for the NavBar)
import "./global/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScheduleLSU",
  description: "LSU Class Scheduler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteLayout>  {/* Display the SiteLayout */}
          {children}
        </SiteLayout>
      </body>
    </html>
  );
}
