import MatchBoard from '@/components/admin/MatchBoard';
import MatchesManagement from '@/components/admin/MatchesManagement';

export default function Page() {
  return (
    <div className="space-y-8">
      <MatchBoard />
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Add or edit matches</h2>
        <MatchesManagement />
      </div>
    </div>
  );
}
