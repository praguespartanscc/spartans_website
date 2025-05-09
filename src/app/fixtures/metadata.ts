import { Metadata } from "next";

const metadata: Metadata = {
  title: 'Fixtures & Upcoming Matches',
  description: 'View all upcoming cricket matches and fixtures for Prague Spartans Cricket Club. Find match details, venues, dates, and times.',
  alternates: {
    canonical: '/fixtures',
  },
  openGraph: {
    title: 'Prague Spartans Cricket Club - Fixtures & Upcoming Matches',
    description: 'View all upcoming cricket matches and fixtures for Prague Spartans Cricket Club. Find match details, venues, dates, and times.',
    url: 'https://praguespartanscc.com/fixtures',
    images: [
      {
        url: '/images/match-action.jpg',
        width: 1200,
        height: 630,
        alt: 'Prague Spartans Cricket Club Match',
      }
    ],
  }
};

export default metadata; 