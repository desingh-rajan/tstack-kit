/**
 * RelationshipSelect Island
 * Client-side searchable dropdown for BelongsTo relationships
 * Fetches options from API and supports search/autocomplete
 */

import { useEffect, useRef, useState } from "preact/hooks";

export interface RelationshipOption {
  value: string;
  label: string;
}

export interface RelationshipSelectProps {
  /** Field name for form submission */
  name: string;
  /** Display label */
  label: string;
  /** API endpoint to fetch options (e.g., "/ts-admin/brands") */
  endpoint: string;
  /** Field to use as label (e.g., "name") */
  labelField: string;
  /** Field to use as value (defaults to "id") */
  valueField?: string;
  /** Current selected value */
  value?: string | null;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Help text to display below input */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Enable search filtering */
  searchable?: boolean;
}

export default function RelationshipSelect({
  name,
  label,
  endpoint,
  labelField,
  valueField = "id",
  value,
  placeholder = "Select...",
  required = false,
  helpText,
  error,
  searchable = true,
}: RelationshipSelectProps) {
  const [options, setOptions] = useState<RelationshipOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<RelationshipOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValue, setSelectedValue] = useState<string>(value || "");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        // Fetch from the admin API endpoint with a large page size
        const response = await fetch(`${endpoint}?pageSize=100`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const result = await response.json();

        // Handle both direct array and paginated response
        const data = Array.isArray(result) ? result : (result.data || []);

        const mappedOptions: RelationshipOption[] = data.map(
          (item: Record<string, unknown>) => ({
            value: String(item[valueField] || ""),
            label: String(item[labelField] || ""),
          }),
        );

        setOptions(mappedOptions);
        setFilteredOptions(mappedOptions);

        // Set initial selected label if value exists
        if (value) {
          const selected = mappedOptions.find((opt) => opt.value === value);
          if (selected) {
            setSelectedLabel(selected.label);
          }
        }
      } catch (err) {
        console.error("Error fetching relationship options:", err);
        setFetchError(
          err instanceof Error ? err.message : "Failed to load options",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [endpoint, labelField, valueField, value]);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: RelationshipOption) => {
    setSelectedValue(option.value);
    setSelectedLabel(option.label);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: Event) => {
    e.stopPropagation();
    setSelectedValue("");
    setSelectedLabel("");
    setSearchTerm("");
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (searchable && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasError = !!error || !!fetchError;
  const displayError = error || fetchError;

  const inputClasses =
    `w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 
    placeholder:text-gray-500 transition-all outline-none cursor-pointer
    ${
      hasError
        ? "border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
    }`;

  return (
    <div ref={containerRef} class="relative">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span class="text-red-500 ml-1">*</span>}
      </label>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedValue} />

      {/* Display input */}
      <div class="relative" onClick={handleInputClick}>
        <div class={inputClasses}>
          {isOpen && searchable
            ? (
              <input
                ref={inputRef}
                type="text"
                class="w-full bg-transparent outline-none"
                placeholder={placeholder}
                value={searchTerm}
                onInput={(e) =>
                  setSearchTerm((e.target as HTMLInputElement).value)}
                onClick={(e) => e.stopPropagation()}
              />
            )
            : (
              <span class={selectedLabel ? "text-gray-900" : "text-gray-500"}>
                {selectedLabel || placeholder}
              </span>
            )}
        </div>

        {/* Loading/Clear/Dropdown icons */}
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <span class="loading loading-spinner loading-sm text-gray-400">
            </span>
          )}
          {!isLoading && selectedValue && (
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              onClick={handleClear}
              title="Clear selection"
            >
              <svg
                class="w-4 h-4"
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
          <svg
            class={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !isLoading && (
        <div class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0
            ? (
              <div class="px-4 py-3 text-gray-500 text-sm">
                {searchTerm ? "No matches found" : "No options available"}
              </div>
            )
            : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  class={`px-4 py-2.5 cursor-pointer transition-colors
                  ${
                    option.value === selectedValue
                      ? "bg-violet-50 text-violet-700"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </div>
              ))
            )}
        </div>
      )}

      {/* Error message */}
      {displayError && <p class="text-xs text-red-500 mt-1.5">{displayError}
      </p>}

      {/* Help text */}
      {helpText && !displayError && (
        <p class="text-xs text-gray-500 mt-1.5">{helpText}</p>
      )}
    </div>
  );
}
