import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Inter } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Script from "next/script"; // 1. Import the Script component
import DeferredToaster from "./components/DeferredToaster";

export const metadata: Metadata = {
  title: "Revo Member Tracker",
  description: "Find the right time to gym",
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
