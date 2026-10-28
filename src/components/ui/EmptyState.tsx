import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-start gap-3 border-dashed p-8 sm:p-10">
      <p className="font-display text-2xl font-semibold uppercase">{title}</p>
      {children && <div className="max-w-xl text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
