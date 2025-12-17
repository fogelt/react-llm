const GRADIENT_DEFAULT = 'bg-gradient-to-br from-[#67a1ff] to-[#962eff]';

export function ContextBar({ current, limit }: { current: number; limit: number }) {
  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <div className="w-full">
      <div className="h-1.5 w-full glass rounded-full overflow-hidden border border-slate-700/30">
        <div
          className={`h-full ${GRADIENT_DEFAULT} transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(103,161,255,0.3)]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-wider">
        <span>Context Usage</span>
        <span>{current} / {limit}</span>
      </div>
    </div>
  );
}