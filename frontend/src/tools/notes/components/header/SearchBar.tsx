import { useIsMobile } from "@notes/hooks/use-is-mobile";
import Button from "@notes/ui/button";
import { cn } from "@notes/utils/css-utils";
import { Search, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@notes/context/ThemeContext";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search notes...",
  className,
  autoFocus = false,
  debounceMs = 300,
}) => {
  useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Debounce the search to prevent too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch, debounceMs]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    // Call onSearch immediately when clearing
    onSearch("");
    setIsFocused(false);
    setIsExpanded(false);
  }, [onSearch]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsExpanded(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Only collapse if there's no search query
    if (!searchQuery) {
      setIsExpanded(false);
    }
  }, [searchQuery]);

  const handleIconClick = useCallback(() => {
    setIsExpanded(true);
    // Focus the input after expansion
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [handleClear]
  );

  return (
    <div className={cn("relative", className)}>
      {!isExpanded && isMobile ? (
        // Collapsed state - only show search icon
        <Button icon={Search} iconSize="4" className="p-0" onClick={handleIconClick} />
      ) : (
        // Expanded state - show full search bar
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-[var(--text-tertiary)]" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              "pl-10 pr-10 py-[6px] w-full",
              "border border-[var(--border-primary)] rounded-l-full rounded-r-full",
              "transition-all duration-200",
              "text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
              isFocused && "shadow-sm"
            )}
          />

          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:opacity-70 rounded-r-md transition-opacity"
              title="Clear search"
            >
              <X className="size-4 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
