"use client";

import { useState } from "react";
import { SummaryDashboard } from "@/components/summary-dashboard";
import { SearchHeader } from "@/components/search-header";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    inputs,
    result,
  } = useCalculator();

  const { groupedSearch } = useSearchIndex({ inputs, result });
  const searchResults = groupedSearch(searchQuery);

  return (
    <main className="min-h-screen bg-background pt-14">
      <SearchHeader
        title="대시보드"
        searchResults={searchResults}
        onSearch={setSearchQuery}
      />

      <div className="px-6 pt-6 md:pt-2 pb-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <SummaryDashboard result={result} />
          </div>
        </div>
      </div>
    </main>
  );
}

