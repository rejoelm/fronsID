"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileTextIcon } from "lucide-react";

interface BasicInfoSectionProps {
  title: string;
  abstract: string;
  onChange: (field: string, value: string) => void;
}

export function BasicInfoSection({
  title,
  abstract,
  onChange,
}: BasicInfoSectionProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <FileTextIcon className="h-5 w-5" />
          <span>Basic Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Manuscript Title *
          </Label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="Enter the title of your research manuscript"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="abstract" className="text-sm font-medium">
            Abstract *
          </Label>
          <textarea
            id="abstract"
            value={abstract}
            onChange={(e) => onChange("abstract", e.target.value)}
            placeholder="Provide a brief summary of your research (150-300 words recommended)"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            required
          />
          <p className="text-xs text-gray-500">{abstract.length} characters</p>
        </div>
      </CardContent>
    </Card>
  );
}
