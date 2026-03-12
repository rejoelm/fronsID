"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SubmissionProgressProps {
  submitProgress: number;
}

export function SubmissionProgress({ submitProgress }: SubmissionProgressProps) {
  return (
    <Card className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200">
      <CardContent className="pt-8 pb-8">
        <div className="space-y-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/10">
          <div className="flex justify-between text-base font-medium">
            <span className="text-primary">Submitting your manuscript...</span>
            <span className="text-primary">{submitProgress}%</span>
          </div>
          <Progress
            value={submitProgress}
            className="w-full h-3 rounded-full bg-primary/10"
          />
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we process and submit your manuscript
          </p>
        </div>
      </CardContent>
    </Card>
  );
}