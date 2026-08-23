import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NyaySetu",
  description: "Your AI Legal Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          /* Comprehensive Google Translate Hider */
          html { top: 0 !important; margin-top: 0 !important; }
          body { top: 0 !important; position: static !important; min-height: 100vh !important; margin-top: 0 !important; }
          .skiptranslate iframe,
          .goog-te-banner-frame,
          .goog-te-balloon-frame,
          #goog-gt-tt,
          .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
          .VIpgJd-ZVi9od-ORHb-OEVmcd,
          #google_translate_element {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
          }
          .goog-text-highlight {
            background-color: transparent !important;
            box-shadow: none !important;
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleOAuthProvider clientId="611241590650-in5gn85q6nmn1g7kctd6vp08udgume1b.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
