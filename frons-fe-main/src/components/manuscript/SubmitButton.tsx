"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SendIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
} from "lucide-react";
import { useLoading } from "@/context/LoadingContext";

interface SubmitButtonProps {
  loading: boolean;
  connected: boolean;
  isFormValid: boolean;
  cvVerified: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function SubmitButton({
  loading,
  connected,
  isFormValid,
  cvVerified,
  onSubmit,
}: SubmitButtonProps) {
  const { isLoading } = useLoading();
  const getValidationMessage = () => {
    if (!connected) {
      return "Please connect your wallet to submit a manuscript";
    }
    if (!cvVerified) {
      return "Please register your CV before submitting a manuscript";
    }
    if (!isFormValid) {
      return "Please fill in all required fields";
    }
    return null;
  };

  const validationMessage = getValidationMessage();
  const canSubmit = connected && cvVerified && isFormValid && !loading;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {validationMessage && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircleIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                {validationMessage}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Submit Status */}
      {canSubmit && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                All requirements met. Ready to submit manuscript for peer
                review.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-12 text-lg font-medium"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
              Submitting Manuscript...
            </>
          ) : (
            <>
              <SendIcon className="h-5 w-5 mr-2" />
              Submit Manuscript for Review
            </>
          )}
        </Button>

        {/* Submission Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Your manuscript will be submitted for peer review by 3+ expert
            reviewers
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Review process typically takes 2-4 weeks
          </p>
        </div>
      </form>
    </div>
  );
}
