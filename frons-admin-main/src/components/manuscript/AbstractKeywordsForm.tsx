"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { XIcon } from "lucide-react";

interface AbstractKeywordsFormProps {
  formData: {
    abstract: string;
    keywords: string;
  };
  keywords: string[];
  submitting: boolean;
  onInputChange: (field: string, value: string) => void;
  onRemoveItem: (field: string, itemToRemove: string) => void;
}

export function AbstractKeywordsForm({
  formData,
  keywords,
  submitting,
  onInputChange,
  onRemoveItem,
}: AbstractKeywordsFormProps) {
  return (
    <>
      <div className="border-b border-gray-100/50 pb-6 p-6">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-2xl text-primary font-semibold">
              Abstract & Keywords
            </h2>
            <p className="text-muted-foreground mt-1">
              Describe your research and key terms
            </p>
          </div>
        </div>
        <Separator className="mt-6" />
      </div>
      <div className="space-y-6 px-6">
        <div className="space-y-3">
          <Label
            htmlFor="abstract"
            className="text-base font-semibold text-primary"
          >
            Abstract *
          </Label>
          <Textarea
            id="abstract"
            value={formData.abstract}
            onChange={(e) => onInputChange("abstract", e.target.value)}
            placeholder="Enter your manuscript abstract"
            disabled={submitting}
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="keywords"
            className="text-base font-semibold text-primary flex items-center"
          >
            Keywords *
          </Label>
          <Input
            id="keywords"
            value={formData.keywords}
            onChange={(e) => onInputChange("keywords", e.target.value)}
            placeholder="Enter keywords separated by commas"
            disabled={submitting}
          />
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {keywords.map((keyword, index) => (
                <Badge
                  key={`${keyword}-${index}`}
                  variant="secondary"
                  className="pl-3 pr-2 py-1 flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {keyword}
                  <button
                    onClick={() => onRemoveItem("keywords", keyword)}
                    className="hover:text-red-600 transition-colors focus:outline-none"
                    type="button"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Separate multiple keywords with commas (e.g., machine learning,
            artificial intelligence, data science)
          </p>
        </div>
      </div>
    </>
  );
}
