"use client";

import { useState } from "react";
import { Search as SearchIcon, BookOpen, Users, TrendingUp, Filter, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface SearchResult {
  id: string;
  doci: string;
  title: string;
  abstract: string;
  authors: { name: string; wallet: string }[];
  citation_count: number;
  impact_score: number;
  rank: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [fieldFilter, setFieldFilter] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .rpc("search_articles", { search_query: query.trim(), max_results: 20 });

      if (!error && data) {
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
    setIsSearching(false);
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2C337A] tracking-tight mb-2">
            Search Research
          </h1>
          <p className="text-gray-500">
            Search across the Fronsciers library — every citation pays the author
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, keyword, DOCI, or topic..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#2C337A] shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#2C337A] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#1e2456] transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        {hasSearched && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#2C337A] mb-1 hover:underline">
                        <Link href={`/article/${result.doci}`}>
                          {result.title}
                        </Link>
                      </h3>
                      {result.doci && (
                        <code className="text-xs text-[#FB7720] bg-orange-50 px-2 py-0.5 rounded">
                          {result.doci}
                        </code>
                      )}
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                        {result.abstract}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {result.authors?.map((a) => a.name).join(", ") || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {result.citation_count} citations
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Impact: {parseFloat(String(result.impact_score)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-center py-12">
                  <SearchIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No results found. Try different keywords.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
