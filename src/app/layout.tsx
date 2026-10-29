import type { Metadata } from "next";
import type { Viewport } from "next";
import { Barlow_Condensed, Graduate, Open_Sans } from "next/font/google";
import "./globals.css";
import { CLUB_NAME, SITE_URL } from "@/lib/club";
import { OG_IMAGE } from "@/lib/seo";
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

// Defaults for every page. Pages set their own title, description, canonical URL and
// share image through pageMeta() (src/lib/seo.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${CLUB_NAME}`,
    default: CLUB_NAME,
  },
  description: `${CLUB_NAME} is a cricket club in Prague, Czech Republic, playing in the Czech Cricket Union leagues. Beginners welcome.`,
  applicationName: CLUB_NAME,
  authors: [{ name: CLUB_NAME }],
  category: 'Sports',
  creator: CLUB_NAME,
  publisher: CLUB_NAME,
  formatDetection: { email: false, telephone: false },
  openGraph: { type: 'website', siteName: CLUB_NAME, locale: 'en_GB', images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  // Search engine ownership checks: paste each code into Vercel (Production) and redeploy.
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
    other: Object.fromEntries(
      Object.entries({
        'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION,
        'seznam-wmt': process.env.NEXT_PUBLIC_SEZNAM_VERIFICATION,
      }).filter(([, v]) => !!v),
    ) as Record<string, string>,
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
        {/* Header, main and footer come from the English (site) and Czech (cs) layouts. */}
        <SupabaseProviderWrapper>{children}</SupabaseProviderWrapper>
        <Analytics />
      </body>
    </html>
  );
}
