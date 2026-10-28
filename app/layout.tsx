import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Inter } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Script from "next/script"; // 1. Import the Script component
import DeferredToaster from "./components/DeferredToaster";
import JsonLd from "./components/JsonLd";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  metadataBase: new URL("https://revotracker.dvcklab.com"),
  title: {
    default: "Revo Tracker: live gym crowd levels",
    template: "%s | Revo Tracker",
  },
  description:
    "Live member counts for every Revo Fitness gym, with peak times, squat rack availability and weekly averages so you can train when it is quiet.",
  applicationName: "Revo Tracker",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Revo Tracker",
    locale: "en_AU",
    url: "/",
    title: "Revo Tracker: live gym crowd levels",
    description:
      "Live member counts for every Revo Fitness gym. Find the quiet hours before you leave the house.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revo Tracker: live gym crowd levels",
    description:
      "Live member counts for every Revo Fitness gym. Find the quiet hours before you leave the house.",
  },
  robots: { index: true, follow: true },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${inter.className}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="RevoTracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Launch images: without these iOS shows a blank screen while the
            shell loads, which is most of the perceived "slow open". */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ServiceWorkerRegistrar />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://revotracker.dvcklab.com/#website",
                url: "https://revotracker.dvcklab.com",
                name: "Revo Tracker",
                description:
                  "Live member counts for every Revo Fitness gym, with peak times and weekly averages.",
                inLanguage: "en-AU",
                publisher: { "@id": "https://dvcklab.com/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate:
                      "https://revotracker.dvcklab.com/gyms?query={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://dvcklab.com/#organization",
                name: "Dvcklab",
                url: "https://dvcklab.com",
                email: "contact@dvcklab.com",
              },
            ],
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <DeferredToaster />
        </ThemeProvider>

        {/* --- Google Analytics Section --- */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K1LEB4FNGE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-K1LEB4FNGE');
          `}
        </Script>
      </body>
    </html>
  );
}
