"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, TagIcon, XIcon } from "lucide-react";

interface Author {
  name: string;
  email?: string;
  institution?: string;
}

interface AuthorsKeywordsSectionProps {
  authorsInput: string;
  keywordsInput: string;
  authors: Author[];
  keywords: string[];
  onAuthorsInputChange: (value: string) => void;
  onKeywordsInputChange: (value: string) => void;
  onAuthorsBlur: () => void;
  onKeywordsBlur: () => void;
}

export function AuthorsKeywordsSection({
  authorsInput,
  keywordsInput,
  authors,
  keywords,
  onAuthorsInputChange,
  onKeywordsInputChange,
  onAuthorsBlur,
  onKeywordsBlur,
}: AuthorsKeywordsSectionProps) {
  const removeAuthor = (index: number) => {
    const newAuthors = authors.filter((_, i) => i !== index);
    onAuthorsInputChange(newAuthors.map((a) => a.name).join(", "));
  };

  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    onKeywordsInputChange(newKeywords.join(", "));
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <UsersIcon className="h-5 w-5" />
          <span>Authors & Keywords</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authors Section */}
        <div className="space-y-3">
          <Label htmlFor="authors" className="text-sm font-medium">
            Authors *
          </Label>
          <input
            id="authors"
            type="text"
            value={authorsInput}
            onChange={(e) => onAuthorsInputChange(e.target.value)}
            onBlur={onAuthorsBlur}
            placeholder="Enter author names separated by commas (e.g., John Doe, Jane Smith)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500">
            Separate multiple authors with commas
          </p>

          {/* Display parsed authors */}
          {authors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Parsed Authors ({authors.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {authors.map((author, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {author.name}
                    <button
                      onClick={() => removeAuthor(index)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Keywords Section */}
        <div className="space-y-3">
          <Label htmlFor="keywords" className="text-sm font-medium">
            Keywords *
          </Label>
          <input
            id="keywords"
            type="text"
            value={keywordsInput}
            onChange={(e) => onKeywordsInputChange(e.target.value)}
            onBlur={onKeywordsBlur}
            placeholder="Enter keywords separated by commas (e.g., machine learning, AI, healthcare)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500">
            Separate multiple keywords with commas (3-8 keywords recommended)
          </p>

          {/* Display parsed keywords */}
          {keywords.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Parsed Keywords ({keywords.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <TagIcon className="h-3 w-3" />
                    {keyword}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
