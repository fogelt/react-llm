const GRADIENT_DEFAULT = 'bg-gradient-to-br from-[#6ee7b7] to-[#10b981]';

interface ProgressBarProps {
  current: number;
  limit?: number; // If provided, shows "X / Y". If missing, shows "X%"
  label?: string;
}

export function ProgressBar({ current, limit, label }: ProgressBarProps) {
  const isContext = !!limit;
  const percentage = limit ? Math.min((current / limit) * 100, 100) : Math.min(current, 100);

  return (
    <div className="w-full">
      <div className="h-1.5 w-full glass rounded-full overflow-hidden border border-slate-700/30">
        <div
          className={`h-full ${GRADIENT_DEFAULT} transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-300/70 uppercase font-bold mt-1.5 tracking-wider">
        <span className="truncate max-w-[70%]">
          {label || (limit ? "Context Usage" : "Progress")}
        </span>
        <span className={isContext ? "text-slate-300/70" : "text-emerald-400"}>
          {limit ? `${current} / ${limit}` : `${Math.round(percentage)}%`}
        </span>
      </div>
    </div>
  );
}