import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "react-hot-toast";


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Intrusafe - Advanced Network Monitoring",
  description: "Monitor and protect your network with AI-powered threat detection",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans`}>
      <body>


        <main>
          <Header />
          {children}</main>
        <Toaster />

      </body>
    </html>
  );
}
