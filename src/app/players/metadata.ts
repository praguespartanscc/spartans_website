import { Metadata } from "next";

const metadata: Metadata = {
  title: 'Team Players',
  description: 'Meet the Prague Spartans Cricket Club team - our captain, vice-captain, and all players. View our team structure and player information.',
  alternates: {
    canonical: '/players',
  },
  openGraph: {
    title: 'Prague Spartans Cricket Club - Team Players',
    description: 'Meet the Prague Spartans Cricket Club team - our captain, vice-captain, and all players. View our team structure and player information.',
    url: 'https://praguespartanscc.com/players',
    images: [
      {
        url: '/images/team-photo.jpg',
        width: 1200,
        height: 630,
        alt: 'Prague Spartans Cricket Club Team Players',
      }
    ],
  }
};

export default metadata; 