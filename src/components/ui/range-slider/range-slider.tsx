const GRADIENT_DEFAULT = 'bg-gradient-to-br from-[#6ee7b7] to-[#10b981]';

interface RangeSliderProps {
  label: string;
  value: string | number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function RangeSlider({ label, value, min, max, step = 512, disabled, onChange }: RangeSliderProps) {
  const numericValue = Number(value);
  const percentage = ((numericValue - min) / (max - min)) * 100;

  return (
    <div className={`w-full mt-4 group transition-opacity duration-200 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="flex justify-between items-center ml-1">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">
          {label}
        </label>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute h-1.5 w-full glass overflow-hidden rounded-full">
          <div
            className={`h-full ${GRADIENT_DEFAULT} transition-all duration-150`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer z-10 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:glass
            [&::-webkit-slider-thumb]:active:scale-90
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:border border-white/10
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-slate-400
            [&::-moz-range-thumb]:border-none"
        />
      </div>

      <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase font-bold -mt-1 px-1">
        <span className="w-12 text-left">{min.toLocaleString()}</span>

        <span className="text-[11px] text-emerald-300 font-mono tracking-wider">
          {numericValue.toLocaleString()}
        </span>

        <span className="w-12 text-right">{max.toLocaleString()}</span>
      </div>
    </div>
  );
}