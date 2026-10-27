import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Inter } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Script from "next/script"; // 1. Import the Script component
import DeferredToaster from "./components/DeferredToaster";
import JsonLd from "./components/JsonLd";

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
      </head>
      <body className="flex min-h-screen flex-col">
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
