import { type ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
}

export default function EmptyStateCard({ icon, title, description }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
      <div className="mb-4">{icon}</div>
      <p className="text-slate-800 font-black text-lg mb-2 text-center">{title}</p>
      {description && <p className="text-slate-500 font-medium text-sm text-center">{description}</p>}
    </div>
  );
}
