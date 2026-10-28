import { Metadata } from "next";
import { getCommittee, getMatches, getPractices, getSponsors, pragueToday } from "@/lib/data";
import HeroSection from "@/components/HeroSection";
import NextMatchBar from "@/components/NextMatchBar";
import LiveBar from "@/components/LiveBar";
import { getLiveStatus } from "@/lib/youtube";
import ValuesBand from "@/components/ValuesBand";
import QuoteBand from "@/components/QuoteBand";
import SquadsSection from "@/components/SquadsSection";
import EventsSection from "@/components/EventsSection";
import PracticeSection from "@/components/PracticeSection";
import StorySection from "@/components/StorySection";
import CommitteeSection from "@/components/CommitteeSection";
import SponsorsSection from "@/components/SponsorsSection";
import JoinCta from "@/components/JoinCta";
import GallerySection from "@/components/GallerySection";
import { latestPhotos } from "@/lib/drive";

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: 'Prague Spartans Cricket Club · Cricket in Prague',
  },
  description:
    'Prague Spartans Cricket Club: three squads, league and tournament cricket in Prague since 2019. Fixtures, results, practice sessions and how to join. Beginners welcome.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Prague Spartans Cricket Club · Cricket in Prague',
    url: '/',
  },
};

export default async function Home() {
  const today = pragueToday();
  const [matches, practices, committee, sponsors, live, gallery] = await Promise.all([
    getMatches(),
    getPractices(),
    getCommittee(),
    getSponsors(),
    getLiveStatus(),
    latestPhotos(8),
  ]);

  const upcoming = matches.filter((m) => m.result === 'will be played' && m.date >= today);
  const next = upcoming[0] ?? null;
  const latest = [...matches].reverse().find((m) => m.result !== 'will be played' && m.date <= today) ?? null;

  return (
    <>
      <LiveBar live={live.live} />
      <HeroSection />
      <NextMatchBar match={next} live={!!next && next.date === today && !!next.stream_url} />
      <ValuesBand />
      <SquadsSection />
      <EventsSection upcoming={upcoming.slice(0, 4)} latest={latest} today={today} />
      <SponsorsSection sponsors={sponsors} />
      <QuoteBand />
      <PracticeSection practices={practices.filter((p) => p.date >= today).slice(0, 3)} />
      <StorySection />
      <GallerySection photos={gallery.map(({ photo, album }) => ({ photo, href: `/gallery/${album.path.join('/')}` }))} />
      <CommitteeSection members={committee} />
      <JoinCta />
    </>
  );
}
