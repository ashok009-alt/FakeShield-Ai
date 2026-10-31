import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SiteBackdrop } from "@/components/site-backdrop";
import { SiteChrome } from "@/components/site-chrome";
import { PwaRegister } from "@/components/pwa-register";
import { ClipboardMonitor } from "@/components/clipboard-monitor";
import { providerStatus } from "@/lib/intel/threatIntel";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FakeShield AI — Spot scams before they catch you",
    template: "%s · FakeShield AI",
  },
  description:
    "Paste a suspicious message, email or link. FakeShield AI explains the warning signs, estimates the risk and tells you what to do next. Risk guidance, not a security verdict.",
  applicationName: "FakeShield AI",
  keywords: [
    "scam detection",
    "phishing analyzer",
    "suspicious message",
    "URL checker",
    "cyber safety",
    "fake KYC",
    "OTP fraud",
  ],
  authors: [{ name: "FakeShield AI" }],
  appleWebApp: {
    capable: true,
    title: "FakeShield",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0704",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        {/* Applies the saved brightness choice before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('fakeshield.bright.v1')==='on'){document.documentElement.dataset.bright='on'}}catch(e){}",
          }}
        />
        <SiteBackdrop />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="app-frame relative flex min-h-screen flex-col">
          <SiteChrome
            threatFeed={Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim())}
            providers={providerStatus()}
          >
            {children}
          </SiteChrome>
        </div>
        <Toaster
          theme="dark"
          position="top-right"
          closeButton
          toastOptions={{
            style: {
              background: "#150e08",
              border: "1px solid #342416",
              color: "#f5ecdf",
            },
          }}
        />
        <PwaRegister />
        {/* Global clipboard auto-monitor — works on every page */}
        <ClipboardMonitor />
      </body>
    </html>
  );
}
