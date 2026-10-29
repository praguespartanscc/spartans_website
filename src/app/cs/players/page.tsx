import PlayersView, { playersMeta } from '@/views/PlayersView';

export const revalidate = 60;
export const metadata = playersMeta('cs');

export default function Page() {
  return <PlayersView lang="cs" />;
}
