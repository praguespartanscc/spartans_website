import type { Metadata } from 'next';
import pageMetadata from './metadata';

export const metadata: Metadata = pageMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
