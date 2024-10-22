import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
	title: "Revo Member Tracker",
	description: "Find the right time to gym",
};

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
