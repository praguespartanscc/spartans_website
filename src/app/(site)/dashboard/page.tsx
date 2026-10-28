import type { Metadata } from 'next';
import MemberDashboard from '@/components/dashboard/MemberDashboard';

export const metadata: Metadata = {
  title: 'Member dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <MemberDashboard />;
}
