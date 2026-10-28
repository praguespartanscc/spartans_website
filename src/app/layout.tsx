import type { Metadata } from "next";
import type { Viewport } from "next";
import { Barlow_Condensed, Graduate, Open_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SupabaseProviderWrapper } from "@/components/ClientProviders";
import { Analytics } from "@vercel/analytics/next";

// Brand Manual v1.1 type system, using open-licence web equivalents:
// Graduate for Varsity Team / College (display), Barlow Condensed italic
// for Abolition Oblique (secondary), and Open Sans for body copy.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const graduate = Graduate({
  variable: "--font-graduate",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Italic only: the secondary typeface is always oblique.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  style: ["italic"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | Prague Spartans Cricket Club',
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
        url: '/spartan_team.PNG',
        width: 1369,
        height: 751,
        alt: 'The Prague Spartans Cricket Club squad',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prague Spartans Cricket Club',
    description: 'Official website of the Prague Spartans Cricket Club',
    images: ['/spartan_team.PNG'],
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
    <html lang="en" className={`${openSans.variable} ${graduate.variable} ${barlowCondensed.variable}`} suppressHydrationWarning>
      <head>
        {/* Lets CSS know scripts run, so scroll-reveal content is only hidden when it can be revealed. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-screen flex-col bg-ink text-cream antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <SupabaseProviderWrapper>
          <Header />
          <main id="main" className="flex-grow">
            {children}
          </main>
          <Footer />
        </SupabaseProviderWrapper>
        <Analytics />
      </body>
    </html>
  );
}
