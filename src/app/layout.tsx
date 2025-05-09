import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SupabaseProviderWrapper } from "@/components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: 'Prague Spartans Cricket Club',
    default: 'Prague Spartans Cricket Club'
  },
  description: "Official website of the Prague Spartans Cricket Club - Join us for matches, practices, and cricket events in Prague, Czech Republic",
  keywords: ["cricket", "Prague", "sports", "cricket club", "Czech Republic", "Spartans", "cricket team"],
  authors: [{ name: "Prague Spartans Cricket Club" }],
  category: 'Sports',
  creator: "Prague Spartans Cricket Club",
  publisher: "Prague Spartans Cricket Club",
  formatDetection: {
    email: false,
    telephone: false,
  },
  metadataBase: new URL('https://praguespartanscc.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Prague Spartans Cricket Club',
    description: 'Official website of the Prague Spartans Cricket Club - Join us for matches, practices, and cricket events in Prague, Czech Republic',
    url: 'https://praguespartanscc.com',
    siteName: 'Prague Spartans Cricket Club',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/prague-spartans-logo.png',
        width: 800,
        height: 600,
        alt: 'Prague Spartans Cricket Club Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prague Spartans Cricket Club',
    description: 'Official website of the Prague Spartans Cricket Club',
    images: ['/images/prague-spartans-logo.png'],
    creator: '@praguespartans',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SupabaseProviderWrapper>
          <Header />
          <main className="flex-grow bg-white min-h-screen">
          {children}
          </main>
          <Footer />
        </SupabaseProviderWrapper>
      </body>
    </html>
  );
}
