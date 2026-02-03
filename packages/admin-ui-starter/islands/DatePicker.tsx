/**
 * DatePicker Island
 * Reusable date picker with calendar modal and text input
 * Supports both click-to-select from calendar and direct typing
 */

import { useEffect, useRef, useState } from "preact/hooks";

export interface DatePickerProps {
  /** Field name for form submission */
  name: string;
  /** Display label */
  label?: string;
  /** Current value (ISO date string YYYY-MM-DD or full ISO datetime) */
  value?: string | null;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Minimum date (YYYY-MM-DD) */
  min?: string;
  /** Maximum date (YYYY-MM-DD) */
  max?: string;
  /** Help text to display below input */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Callback when date changes */
  onChange?: (value: string) => void;
  /** Include time picker */
  includeTime?: boolean;
  /** Size variant: 'sm' for compact (filters), 'md' for default (forms) */
  size?: "sm" | "md";
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Parse a date string to YYYY-MM-DD format
 */
function parseToDateString(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Parse a datetime string to YYYY-MM-DDTHH:MM format
 */
function parseToDateTimeString(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

/**
 * Format date for display (DD/MM/YYYY for en-IN locale)
 */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Parse user input (DD/MM/YYYY or YYYY-MM-DD) to YYYY-MM-DD
 */
function parseUserInput(input: string): string {
  if (!input) return "";

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // DD/MM/YYYY format
  const ddmmyyyy = input.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try parsing as-is
  try {
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch {
    // Invalid date
  }

  return "";
}

export default function DatePicker({
  name,
  label,
  value,
  placeholder = "DD/MM/YYYY",
  required = false,
  min,
  max,
  helpText,
  error,
  onChange,
  includeTime = false,
  size = "md",
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    includeTime ? parseToDateTimeString(value) : parseToDateString(value)
  );
  const [inputValue, setInputValue] = useState<string>(() => {
    if (includeTime) {
      const dt = parseToDateTimeString(value);
      if (!dt) return "";
      const [date, time] = dt.split("T");
      return `${formatDisplayDate(date)} ${time}`;
    }
    return formatDisplayDate(parseToDateString(value));
  });
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const initial = parseToDateString(value);
    return initial ? new Date(initial) : new Date();
  });
  const [time, setTime] = useState<string>(() => {
    if (includeTime && value) {
      const dt = parseToDateTimeString(value);
      return dt ? dt.split("T")[1] || "00:00" : "00:00";
    }
    return "00:00";
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update state when value prop changes
  useEffect(() => {
    const newDate = includeTime
      ? parseToDateTimeString(value)
      : parseToDateString(value);
    setSelectedDate(newDate);

    if (includeTime && newDate) {
      const [date, t] = newDate.split("T");
      setInputValue(`${formatDisplayDate(date)} ${t}`);
      setTime(t || "00:00");
    } else {
      setInputValue(formatDisplayDate(newDate));
    }

    if (newDate) {
      setViewDate(new Date(newDate.split("T")[0]));
    }
  }, [value, includeTime]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: Event) => {
    const newValue = (e.target as HTMLInputElement).value;
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      setSelectedDate("");
      onChange?.("");
      return;
    }

    if (includeTime) {
      // Parse datetime input like "25/01/2026 14:30"
      const parts = inputValue.split(" ");
      const datePart = parseUserInput(parts[0]);
      const timePart = parts[1] || time;

      if (datePart) {
        const fullValue = `${datePart}T${timePart}`;
        setSelectedDate(fullValue);
        setInputValue(`${formatDisplayDate(datePart)} ${timePart}`);
        setTime(timePart);
        setViewDate(new Date(datePart));
        onChange?.(fullValue);
      }
    } else {
      const parsed = parseUserInput(inputValue);
      if (parsed) {
        setSelectedDate(parsed);
        setInputValue(formatDisplayDate(parsed));
        setViewDate(new Date(parsed));
        onChange?.(parsed);
      } else {
        // Invalid input, reset to last valid value
        setInputValue(formatDisplayDate(selectedDate));
      }
    }
  };

  const handleDateSelect = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${
      String(day).padStart(2, "0")
    }`;

    if (includeTime) {
      const fullValue = `${dateStr}T${time}`;
      setSelectedDate(fullValue);
      setInputValue(`${formatDisplayDate(dateStr)} ${time}`);
      onChange?.(fullValue);
    } else {
      setSelectedDate(dateStr);
      setInputValue(formatDisplayDate(dateStr));
      setIsOpen(false);
      onChange?.(dateStr);
    }
  };

  const handleTimeChange = (e: Event) => {
    const newTime = (e.target as HTMLInputElement).value;
    setTime(newTime);

    if (selectedDate) {
      const datePart = selectedDate.split("T")[0];
      const fullValue = `${datePart}T${newTime}`;
      setSelectedDate(fullValue);
      setInputValue(`${formatDisplayDate(datePart)} ${newTime}`);
      onChange?.(fullValue);
    }
  };

  const handleClear = (e: Event) => {
    e.stopPropagation();
    setSelectedDate("");
    setInputValue("");
    setTime("00:00");
    onChange?.("");
  };

  const goToPrevMonth = () => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    const dateStr = today.toISOString().split("T")[0];

    if (includeTime) {
      const fullValue = `${dateStr}T${time}`;
      setSelectedDate(fullValue);
      setInputValue(`${formatDisplayDate(dateStr)} ${time}`);
      onChange?.(fullValue);
    } else {
      setSelectedDate(dateStr);
      setInputValue(formatDisplayDate(dateStr));
      onChange?.(dateStr);
    }
  };

  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const selectedDateStr = selectedDate?.split("T")[0] || "";

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <div class="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {DAYS.map((day) => (
          <div
            key={day}
            class="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} class="p-2" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${
            String(day).padStart(2, "0")
          }`;
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === todayStr;
          const isBeforeMin = min ? dateStr < min : false;
          const isAfterMax = max ? dateStr > max : false;
          const isDisabled = isBeforeMin || isAfterMax;

          let buttonClass = "p-2 text-sm rounded-lg transition-colors";
          if (isDisabled) {
            buttonClass += " text-gray-300 cursor-not-allowed";
          } else {
            buttonClass += " hover:bg-violet-50 cursor-pointer";
          }
          if (isSelected) {
            buttonClass += " bg-violet-500 text-white hover:bg-violet-600";
          }
          if (isToday && !isSelected) {
            buttonClass += " border border-violet-500 text-violet-600";
          }

          return (
            <button
              key={day}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateSelect(day)}
              class={buttonClass}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  const hasError = !!error;

  const inputClasses = size === "sm"
    ? `w-36 px-3 py-1.5 pr-8 bg-white border rounded-lg text-sm text-gray-900
    placeholder:text-gray-500 transition-all outline-none
    ${
      hasError
        ? "border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
    }`
    : `w-full px-4 py-2.5 pr-10 bg-white border rounded-lg text-gray-900
    placeholder:text-gray-500 transition-all outline-none
    ${
      hasError
        ? "border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
    }`;

  return (
    <div ref={containerRef} class="relative">
      {label && (
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span class="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedDate} />

      {/* Visible input for typing */}
      <div class="relative">
        <input
          ref={inputRef}
          type="text"
          class={inputClasses}
          placeholder={includeTime ? "DD/MM/YYYY HH:MM" : placeholder}
          value={inputValue}
          onInput={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
        />

        {/* Icons */}
        <div
          class={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${
            size === "sm" ? "right-2" : "right-3 gap-2"
          }`}
        >
          {selectedDate && (
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              onClick={handleClear}
              title="Clear"
            >
              <svg
                class={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            class="text-gray-400 hover:text-violet-500"
            onClick={() => setIsOpen(!isOpen)}
            title="Open calendar"
          >
            <svg
              class={size === "sm" ? "w-4 h-4" : "w-5 h-5"}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div class="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72">
          {/* Month/Year Header */}
          <div class="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPrevMonth}
              class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span class="text-sm font-semibold text-gray-700">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          {renderCalendar()}

          {/* Time Picker */}
          {includeTime && (
            <div class="mt-4 pt-4 border-t border-gray-200">
              <label class="block text-xs font-medium text-gray-500 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={handleTimeChange}
                class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={goToToday}
              class="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              class="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}

      {/* Help text */}
      {helpText && !error && (
        <p class="text-xs text-gray-500 mt-1.5">{helpText}</p>
      )}
    </div>
  );
}
