import RsvpSummary from '@/components/admin/RsvpSummary';
import PracticesManagement from '@/components/admin/PracticesManagement';

export default function Page() {
  return (
    <div className="space-y-8">
      <RsvpSummary />
      <PracticesManagement />
    </div>
  );
}
