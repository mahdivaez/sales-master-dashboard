import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ range, onRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Select date range';
    if (!range.to) return format(range.from, 'LLL dd, y');
    return `${format(range.from, 'LLL dd, y')} - ${format(range.to, 'LLL dd, y')}`;
  };

  const presets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last Year', days: 365 },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
      >
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        <span className="min-w-[180px] text-left">{formatDateRange(range)}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1 border-r border-gray-100 pr-4 min-w-[140px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Presets</p>
            {presets.map((preset) => (
              <button
                key={preset.days}
                onClick={() => {
                  onRangeChange({
                    from: subDays(new Date(), preset.days),
                    to: new Date(),
                  });
                  setIsOpen(false);
                }}
                className="text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  onRangeChange(undefined);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
              >
                <X className="w-4 h-4" />
                Clear Range
              </button>
            </div>
          </div>
          <div className="calendar-container">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={onRangeChange}
              numberOfMonths={1}
              className="!m-0"
              classNames={{
                day_selected: "bg-blue-700 text-white hover:bg-blue-800",
                day_today: "font-black text-blue-700 underline",
                day: "text-gray-950 font-bold hover:bg-blue-100 rounded-lg transition-colors",
                head_cell: "text-gray-800 font-black text-xs uppercase tracking-wider pb-4",
                nav_button: "hover:bg-gray-200 rounded-lg transition-colors text-gray-900",
                caption: "text-gray-900 font-black flex justify-between items-center px-2",
              }}
            />
          </div>
        </div>
      )}
      <style jsx global>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #1d4ed8; /* blue-700 */
          --rdp-background-color: #dbeafe; /* blue-100 */
          margin: 0;
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          background-color: var(--rdp-accent-color) !important;
          color: white !important;
        }
        .rdp-day {
          color: #030712 !important; /* text-gray-950 */
          opacity: 1 !important;
        }
        .rdp-head_cell {
          color: #1f2937 !important; /* text-gray-800 */
          font-weight: 900 !important;
        }
        .rdp-day_outside {
          color: #6b7280 !important; /* text-gray-500 */
          opacity: 0.5 !important;
        }
        .rdp-day_range_middle {
          background-color: #bfdbfe !important; /* blue-200 */
          color: #1e3a8a !important; /* blue-900 */
        }
        .rdp-nav_button {
          color: #111827 !important;
        }
        .rdp-caption_label {
          color: #111827 !important;
          font-weight: 900 !important;
          font-size: 1rem !important;
        }
      `}</style>
    </div>
  );
};
