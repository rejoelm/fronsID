"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UploadIcon, FileTextIcon } from "lucide-react";

interface FileUploadFormProps {
  selectedFile: File | null;
  submitting: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

export function FileUploadForm({
  selectedFile,
  submitting,
  onFileChange,
  onRemoveFile,
}: FileUploadFormProps) {
  return (
    <>
      <div className="border-b border-gray-100/50 pb-6 p-6">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-2xl text-primary font-semibold">
              Manuscript File
            </h2>
            <p className="text-muted-foreground mt-1">
              Upload your research document
            </p>
          </div>
        </div>
        <Separator className="mt-6" />
      </div>
      <div className="space-y-6 px-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-primary">
            Upload Manuscript (PDF) *
          </Label>
          <p className="text-muted-foreground">
            Upload your manuscript in PDF format. Maximum file size is 10MB.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300/80 rounded-xl p-8 text-center hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
          <input
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="hidden"
            id="manuscript-upload"
            disabled={submitting}
          />
          <label
            htmlFor="manuscript-upload"
            className="cursor-pointer flex flex-col items-center space-y-4"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UploadIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <span className="text-lg text-foreground font-medium">
                {selectedFile
                  ? selectedFile.name
                  : "Click to select your manuscript file"}
              </span>
              <span className="text-sm text-muted-foreground block">
                PDF format only (max 10MB)
              </span>
            </div>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <FileTextIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-base text-primary font-medium block">
                  {selectedFile.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveFile}
              disabled={submitting}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </>
  );
}