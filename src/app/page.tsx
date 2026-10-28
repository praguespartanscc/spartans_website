import { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import NextMatchBar from "@/components/NextMatchBar";
import Ticker from "@/components/ui/Ticker";
import SquadsSection from "@/components/SquadsSection";
import EventsSection from "@/components/EventsSection";
import PracticeSection from "@/components/PracticeSection";
import StorySection from "@/components/StorySection";
import CommitteeSection from "@/components/CommitteeSection";
import SponsorsSection from "@/components/SponsorsSection";
import JoinCta from "@/components/JoinCta";

export const metadata: Metadata = {
  title: {
    absolute: 'Prague Spartans Cricket Club · Cricket in Prague',
  },
  description: 'Welcome to Prague Spartans Cricket Club - Join our vibrant community of cricket enthusiasts in Prague. Find upcoming matches, practice sessions, and club events.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Prague Spartans Cricket Club - Official Website',
    description: 'Welcome to Prague Spartans Cricket Club - Join our vibrant community of cricket enthusiasts in Prague. Find upcoming matches, practice sessions, and club events.',
    url: 'https://praguespartanscc.com/',
    images: [
      {
        url: '/spartan_team.PNG',
        width: 1369,
        height: 751,
        alt: 'Prague Spartans Cricket Club Team',
      }
    ],
  }
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <NextMatchBar />
      <Ticker />
      <SquadsSection />
      <EventsSection />
      <PracticeSection />
      <StorySection />
      <CommitteeSection />
      <SponsorsSection />
      <JoinCta />
    </>
  );
}
