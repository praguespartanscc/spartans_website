import AchievementsView, { achievementsMeta } from '@/views/AchievementsView';

export const revalidate = 60;
export const metadata = achievementsMeta('cs');

export default function Page() {
  return <AchievementsView lang="cs" />;
}
