import TeamSelection from '@/components/admin/TeamSelection';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <TeamSelection matchId={Number((await params).id)} />;
}
