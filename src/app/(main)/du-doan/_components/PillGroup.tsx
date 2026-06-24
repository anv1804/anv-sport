interface PillOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function PillGroup({ options, value, onChange, className = '' }: Props) {
  return (
    <div className={`flex bg-slate-100 p-0.5 rounded-full border border-slate-200/40 shadow-inner ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          disabled={opt.disabled}
          className={[
            'flex-1 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide transition-all duration-205',
            value === opt.value ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800',
            opt.disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : '',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
