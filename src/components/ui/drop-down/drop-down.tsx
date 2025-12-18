import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  label: string;
  value: string;
  setValue: (val: string) => void;
  options: string[];
}

const Dropdown = ({ label, value, setValue, options }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((file) => {
    const isVisionLabel = label.toLowerCase().includes("vision") || label.toLowerCase().includes("projector");
    const isMmprojFile = file.toLowerCase().includes("mmproj");

    if (isVisionLabel) {
      return isMmprojFile;
    } else {
      return !isMmprojFile;
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col mt-3 relative" ref={containerRef}>
      <label className="text-[11px] font-bold text-slate-300 mb-1.5 ml-1 uppercase tracking-widest">
        {label}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          glass p-2.5 text-xs text-white rounded-[10px] cursor-pointer 
          flex justify-between items-center transition-all duration-200
          border border-white/5 hover:border-white/10
          ${isOpen ? 'bg-white/10' : ''}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">
            {value || <span className="text-white font-medium">Select File...</span>}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-white/80'} `} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 bg-[#222222] border border-white/10 rounded-[12px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            <div
              onClick={() => { setValue(''); setIsOpen(false); }}
              className="px-3 py-2 text-[11px] text-slate-400 hover:bg-white/5 cursor-pointer uppercase tracking-tight"
            >
              -- Clear Selection --
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-600 text-center italic">
                {label.toLowerCase().includes("vision")
                  ? "No projector (mmproj) files found"
                  : "No .gguf models found"}
              </div>
            ) : (
              filteredOptions.map((file) => (
                <div
                  key={file}
                  onClick={() => {
                    setValue(file);
                    setIsOpen(false);
                  }}
                  className={`
                    px-3 py-2.5 text-xs cursor-pointer transition-all border-l-2
                    ${value === file
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                      : 'text-slate-300 border-transparent hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {file}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { Dropdown };