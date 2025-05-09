import { Metadata } from "next";

const metadata: Metadata = {
  title: 'Practice Sessions',
  description: 'Find upcoming cricket practice sessions for Prague Spartans Cricket Club. View practice schedules, venues, and training information.',
  alternates: {
    canonical: '/practices',
  },
  openGraph: {
    title: 'Prague Spartans Cricket Club - Practice Sessions',
    description: 'Find upcoming cricket practice sessions for Prague Spartans Cricket Club. View practice schedules, venues, and training information.',
    url: 'https://praguespartanscc.com/practices',
    images: [
      {
        url: '/images/practice-session.jpg',
        width: 1200,
        height: 630,
        alt: 'Prague Spartans Cricket Club Practice Session',
      }
    ],
  }
};

export default metadata; 