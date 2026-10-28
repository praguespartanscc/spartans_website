'use client';

import { useEffect } from 'react';
import type { Lang } from '@/lib/i18n';

// Keeps <html lang> right when moving between the English and Czech sections without a reload.
export default function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
