'use client';

import React from 'react';
import SupabaseProvider from './SupabaseProvider';

type Props = {
  children: React.ReactNode;
};

// This component ensures that client components are properly initialized
export function SupabaseProviderWrapper({ children }: Props) {
  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  );
} 