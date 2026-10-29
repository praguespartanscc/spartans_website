import AchievementsView, { achievementsMeta } from '@/views/AchievementsView';

export const revalidate = 60;
export const metadata = achievementsMeta('en');

export default function Page() {
  return <AchievementsView lang="en" />;
}
