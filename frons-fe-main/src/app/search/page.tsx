"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  ExternalLinkIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from "lucide-react";
import { Header } from "@/components/header";
import { apiClient } from "@/lib/api";

const FIELDS_OF_STUDY = [
  "All Fields",
  "Medicine",
  "Biology",
  "Chemistry",
  "Physics",
  "Computer Science",
  "Engineering",
  "Mathematics",
  "Environmental Science",
  "Psychology",
  "Neuroscience",
  "Genetics",
  "Pharmacology",
  "Public Health",
  "Social Sciences",
];

interface SearchResult {
  id: string;
  title: string;
  abstract?: string;
  author: string;
  category: string[];
  publishedDate: string;
  cid?: string;
  ipfsUrls?: { manuscript?: string };
  doci?: string;
  citationCount?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("All Fields");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // Use existing API client to search manuscripts
      const manuscripts = await apiClient.getManuscriptsByStatus(
        "published",
        50
      );

      // Client-side filtering (will use Supabase search_articles when available)
      const filtered = manuscripts.filter((m: any) => {
        const matchesQuery =
          m.title?.toLowerCase().includes(query.toLowerCase()) ||
          m.abstract?.toLowerCase().includes(query.toLowerCase()) ||
          m.author?.toLowerCase().includes(query.toLowerCase());
        const matchesField =
          field === "All Fields" ||
          m.category?.some((c: string) =>
            c.toLowerCase().includes(field.toLowerCase())
          );
        return matchesQuery && matchesField;
      });

      setResults(
        filtered.map((m: any) => ({
          id: m.id,
          title: m.title,
          abstract: m.abstract,
          author: m.author,
          category: m.category || [],
          publishedDate: m.publishedDate || m.submittedAt,
          cid: m.cid,
          ipfsUrls: m.ipfsUrls,
          doci: m.doci,
          citationCount: m.citationCount || 0,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Header />
      <main className="pt-24 pb-16">
        {/* Search Header */}
        <div className="bg-gradient-to-b from-navy to-navy-600 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Search Research
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Discover peer-reviewed papers published on Fronsciers
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by title, author, abstract, or DOCI..."
                  className="pl-11 h-12 bg-white border-white/20 text-navy text-sm rounded-xl"
                />
              </div>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-white/10 border-white/10 text-white rounded-xl">
                  <SlidersHorizontalIcon className="w-3.5 h-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS_OF_STUDY.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="h-12 px-8 bg-orange-accent hover:bg-orange-accent-dark text-white rounded-xl font-semibold"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
          {searched && (
            <p className="text-sm text-navy/40 mb-4">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
          )}

          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-6 bg-white rounded-2xl border border-navy/5 animate-pulse"
                >
                  <div className="h-5 w-3/4 bg-navy/5 rounded mb-3" />
                  <div className="h-3 w-1/3 bg-navy/5 rounded mb-4" />
                  <div className="h-3 w-full bg-navy/5 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-navy/5 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => {
                    const url =
                      result.ipfsUrls?.manuscript ||
                      (result.cid
                        ? `https://ipfs.io/ipfs/${result.cid}`
                        : "#");
                    window.open(url, "_blank");
                  }}
                  className="cursor-pointer"
                >
                <Card
                  className="bg-white border-navy/5 hover:shadow-md transition-all duration-300 group overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {result.category.slice(0, 2).map((cat) => (
                            <Badge
                              key={cat}
                              variant="secondary"
                              className="text-xs bg-lavender text-navy border-0"
                            >
                              {cat}
                            </Badge>
                          ))}
                          {result.doci && (
                            <Badge
                              variant="outline"
                              className="text-xs text-orange-accent border-orange-accent/20 bg-orange-accent/5"
                            >
                              <SparklesIcon className="w-3 h-3 mr-1" />
                              DOCI
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-navy group-hover:text-orange-accent transition-colors line-clamp-2">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-navy/40">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {result.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(result.publishedDate)}
                          </span>
                          {result.citationCount !== undefined &&
                            result.citationCount > 0 && (
                              <span className="flex items-center gap-1">
                                <BookOpenIcon className="w-3 h-3" />
                                {result.citationCount} citations
                              </span>
                            )}
                        </div>
                        {result.abstract && (
                          <p className="mt-3 text-sm text-navy/50 line-clamp-3 leading-relaxed">
                            {result.abstract}
                          </p>
                        )}
                      </div>
                      <ExternalLinkIcon className="w-4 h-4 text-navy/20 group-hover:text-orange-accent flex-shrink-0 ml-4 mt-1 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
                </div>
              ))}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-16">
              <SearchIcon className="w-12 h-12 text-navy/10 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-navy mb-2">
                No results found
              </h3>
              <p className="text-sm text-navy/40 max-w-md mx-auto">
                Try different keywords or broaden your field filter. Papers must
                be published and peer-reviewed to appear in search.
              </p>
            </div>
          )}

          {!searched && (
            <div className="text-center py-16">
              <BookOpenIcon className="w-12 h-12 text-navy/10 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-navy mb-2">
                Discover Research
              </h3>
              <p className="text-sm text-navy/40 max-w-md mx-auto">
                Search peer-reviewed papers by title, author, abstract, or DOCI
                identifier.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
