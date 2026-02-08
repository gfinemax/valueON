"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResultDropdown } from "@/components/search-result-dropdown";
import { SearchResult } from "@/hooks/useSearchIndex";
import { useRouter } from "next/navigation";

interface SearchHeaderProps {
    title: string;
    leftSlot?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    searchResults?: {
        categories: SearchResult[];
        costItems: SearchResult[];
        unitTypes: SearchResult[];
        pricing: SearchResult[];
        total: number;
    };
    onSearch?: (query: string) => void;
}

export function SearchHeader({ title, leftSlot, actions, className, searchResults, onSearch }: SearchHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    setIsOpen(false);
                    setQuery("");
                    onSearch?.("");
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onSearch]);

    const handleSearchClick = () => {
        setIsOpen(true);
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        setQuery("");
        onSearch?.("");
    };

    const handleSelect = useCallback(() => {
        setIsOpen(false);
        setQuery("");
        onSearch?.("");
    }, [onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!searchResults || searchResults.total === 0) {
            if (e.key === "Escape") {
                setIsOpen(false);
                setQuery("");
                onSearch?.("");
            }
            return;
        }

        const allResults = [
            ...searchResults.categories,
            ...searchResults.costItems,
            ...searchResults.unitTypes,
            ...searchResults.pricing,
        ];

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                if (allResults[selectedIndex]) {
                    const result = allResults[selectedIndex];
                    const url = result.anchor ? `${result.route}#${result.anchor}` : result.route;
                    router.push(url);
                    handleSelect();
                }
                break;
            case "Escape":
                setIsOpen(false);
                setQuery("");
                onSearch?.("");
                break;
        }
    };

    const showDropdown = isOpen && query.length > 0 && searchResults && searchResults.total > 0;

    return (
        <div
            ref={containerRef}
            className={cn(
                "sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur px-6 h-14 flex items-center justify-between transition-all duration-300",
                className
            )}
        >
            <div className="flex items-center gap-4 flex-1 relative overflow-visible h-full">
                {/* Left Slot (e.g. Back Button) */}
                <div className={cn(
                    "transition-all duration-300 ease-in-out flex items-center gap-4 min-w-0 mr-4",
                )}>
                    {leftSlot}
                    <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap truncate">
                        {title}
                    </h1>
                </div>

                {/* Search Input Area */}
                <div className={cn(
                    "flex items-center justify-end transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ml-auto relative",
                    isOpen ? "flex-1 opacity-100 min-w-0" : "w-auto opacity-100"
                )}>
                    {/* Additional Actions (Always visible) */}
                    {actions && (
                        <div className="mr-2 flex items-center flex-shrink-0">
                            {actions}
                        </div>
                    )}

                    {/* Search Icon (Trigger) */}
                    {!isOpen && (
                        <button
                            onClick={handleSearchClick}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900 flex-shrink-0"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    )}

                    {/* Animated Input Container */}
                    <div className={cn(
                        "flex items-center gap-2 overflow-visible transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] bg-slate-50 rounded-full border border-transparent focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-sm relative",
                        isOpen ? "flex-1 pl-4 pr-2 py-1" : "w-0 border-0 p-0"
                    )}>
                        <Search className="w-4 h-4 text-slate-400 min-w-[16px]" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                onSearch?.(e.target.value);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="검색..."
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm h-8 w-full min-w-0"
                        />
                        <button
                            onClick={handleCloseClick}
                            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Search Results Dropdown */}
                        {showDropdown && (
                            <SearchResultDropdown
                                results={searchResults}
                                onSelect={handleSelect}
                                selectedIndex={selectedIndex}
                                query={query}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

