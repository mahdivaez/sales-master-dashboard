'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isWithinInterval } from 'date-fns';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

interface DateRangePickerProps {
  range: DayPickerDateRange | undefined;
  onRangeChange: (range: DayPickerDateRange | undefined) => void;
}

const PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Yesterday', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'This month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Last month', getValue: () => ({ from: startOfMonth(subDays(startOfMonth(new Date()), 1)), to: endOfMonth(subDays(startOfMonth(new Date()), 1)) }) },
];

export function DateRangePicker({ range, onRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectingRange, setSelectingRange] = useState<'from' | 'to'>('from');
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

  const handleDateClick = (date: Date) => {
    if (selectingRange === 'from') {
      if (range?.to && date > range.to) {
        onRangeChange({ from: date, to: date });
        setSelectingRange('to');
      } else {
        onRangeChange({ from: date, to: range?.to });
        if (!range?.to) setSelectingRange('to');
      }
    } else {
      if (range?.from && date < range.from) {
        onRangeChange({ from: date, to: date });
      } else {
        onRangeChange({ from: range?.from, to: date });
        setIsOpen(false);
      }
    }
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const value = preset.getValue();
    onRangeChange(value);
    setIsOpen(false);
  };

  const clearRange = () => {
    onRangeChange(undefined);
    setSelectingRange('from');
  };

  const formatRange = () => {
    if (!range?.from) return 'Select date range';
    if (!range.to) return `${format(range.from, 'MMM d, yyyy')} - Select end date`;
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  const renderCalendar = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isSelected = range?.from && isSameDay(currentDay, range.from) || 
                          range?.to && isSameDay(currentDay, range.to);
        const isInRange = range?.from && range?.to && 
                         isWithinInterval(currentDay, { start: range.from, end: range.to });
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isToday = isSameDay(currentDay, new Date());

        days.push(
          <button
            key={currentDay.toISOString()}
            onClick={() => handleDateClick(currentDay)}
            className={`
              w-10 h-10 rounded-lg text-sm font-medium transition-all
              ${!isCurrentMonth ? 'text-gray-300' : ''}
              ${isSelected ? 'bg-indigo-600 text-white shadow-md' : ''}
              ${isInRange && !isSelected ? 'bg-indigo-50 text-indigo-600' : ''}
              ${isToday && !isSelected ? 'border-2 border-indigo-300' : ''}
              hover:bg-indigo-100 hover:text-indigo-600
              ${!isCurrentMonth ? 'hover:bg-gray-50' : ''}
            `}
          >
            {format(currentDay, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toISOString()} className="flex justify-center gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return rows;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 border rounded-xl font-medium text-sm transition-all
          ${range?.from ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}
        `}
      >
        <Calendar className="w-4 h-4" />
        <span className="truncate max-w-[200px]">{formatRange()}</span>
        {range?.from && (
          <button
            onClick={(e) => { e.stopPropagation(); clearRange(); }}
            className="p-1 hover:bg-indigo-100 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[320px]">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewDate(addDays(viewDate, -30))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <span className="font-semibold text-gray-900">{format(viewDate, 'MMMM yyyy')}</span>
                <button
                  onClick={() => setViewDate(addDays(viewDate, 30))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {renderCalendar(viewDate)}
              </div>
            </div>
            <div className="w-32 border-l border-gray-100 pl-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Quick select</p>
              <div className="space-y-1">
                {PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
