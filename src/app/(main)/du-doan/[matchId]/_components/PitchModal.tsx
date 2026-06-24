import { X } from 'lucide-react';
import PitchLineup from './PitchLineup';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lineups: any[];
  events: any[];
  formationsData: any;
}

export default function PitchModal({ isOpen, onClose, lineups, events, formationsData }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-[600px] bg-slate-950 sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-800 flex flex-col max-h-[100vh] sm:max-h-[90vh]">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 relative z-10 flex-shrink-0">
          <h3 className="text-white font-black uppercase tracking-widest text-[12px] sm:text-[14px] flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-green-500 rounded-sm" />
            Sơ đồ chiến thuật
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-950 p-2 sm:p-4">
          <PitchLineup team1={lineups[0]} team2={lineups[1]} formationsData={formationsData} events={events} />
        </div>
      </div>
    </div>
  );
}
