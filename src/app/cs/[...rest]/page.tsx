import { notFound } from 'next/navigation';

// Unknown /cs/... addresses show the Czech 404 page (src/app/cs/not-found.tsx).
export default function CzechCatchAll() {
  notFound();
}
