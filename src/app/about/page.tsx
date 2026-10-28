import { Metadata } from "next";
import Image from 'next/image';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import Ticker from '@/components/ui/Ticker';
import JoinCta from '@/components/JoinCta';
import { Bolt, Glass, Users } from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Prague Spartans Cricket Club - our history, mission, and community. Founded in 2019, we welcome cricket players of all skill levels in Prague.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Prague Spartans Cricket Club',
    description: 'Learn about Prague Spartans Cricket Club - our history, mission, and community. Founded in 2019, we welcome cricket players of all skill levels in Prague.',
    url: 'https://praguespartanscc.com/about',
    images: [
      {
        url: '/story1.jpeg',
        width: 1200,
        height: 630,
        alt: 'Prague Spartans Cricket Club Team Photo',
      }
    ],
  }
};

const offers = [
  {
    icon: Users,
    title: 'Inclusive community',
    text: 'A welcoming club for players of every skill level, background and age.',
  },
  {
    icon: Bolt,
    title: 'Regular training',
    text: 'Weekly practice sessions focused on improving your game and enjoying it.',
  },
  {
    icon: Glass,
    title: 'Social events',
    text: 'Team dinners, awards nights and get-togethers that build friendships beyond the field.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About the club"
        title={
          <>
            United by <span className="text-gold">cricket</span>
          </>
        }
        intro="A community of friends, teammates and rivals who love the game, playing in the heart of Prague since 2019."
        image="/home_carousel1.jpeg"
      />

      <section className="py-20 sm:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-3">01 · Our story</p>
            <h2 className="h-section">Born from a simple idea</h2>
            <p className="mt-6 text-[17px] leading-relaxed text-sand">
              Founded in 2019, the Prague Spartans Cricket Club was born from a simple idea: to bring people together through the
              love of cricket. What began as a small group of friends sharing a passion for the sport has grown into a vibrant and
              diverse community.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              At our core, we are a social club, welcoming players of all backgrounds and skill levels. Whether you&apos;re a
              seasoned cricketer or picking up the bat for the first time, the Prague Spartans offer a supportive and inclusive
              environment to enjoy the game.
            </p>
          </Reveal>
          <Reveal delay={120} className="zoom-frame relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image src="/story1.jpeg" alt="Prague Spartans members together in Prague" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[center_60%]" />
          </Reveal>
        </div>
      </section>

      <Ticker />

      <section className="bg-ink-2 py-20 sm:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={120} className="zoom-frame relative order-2 aspect-[4/3] overflow-hidden rounded-lg lg:order-1">
            <Image src="/home_carouse2.jpeg" alt="Prague Spartans award trophies" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="eyebrow mb-3">02 · Our mission</p>
            <h2 className="h-section">Spirit of the game first</h2>
            <p className="mt-6 text-[17px] leading-relaxed text-sand">
              Our mission is to promote camaraderie, sportsmanship, and a deep appreciation for cricket while having fun both on
              and off the field.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              We strive to create a community where players can develop their skills, forge lasting friendships, and share their
              passion for cricket. Through regular practice sessions, matches, and social events, we foster a sense of belonging
              and team spirit.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-x">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">03 · What we offer</p>
            <h2 className="h-section">Why players join</h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {offers.map((offer, i) => (
              <Reveal key={offer.title} delay={i * 90}>
                <div className="card card-hover h-full p-7">
                  <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-ink">
                    <offer.icon size={22} />
                  </span>
                  <h3 className="font-display text-2xl font-semibold uppercase">{offer.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{offer.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <JoinCta
        title="Join us today"
        text="Be part of a team where friendship and the spirit of the game come first. Whether you want competitive cricket or a friendly game, there's a place for you."
      />
    </>
  );
}
