"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";

interface IPFSInfoDisplayProps {
  ipfsData: {
    cid: string;
    ipfsUrl: string;
  };
}

export function IPFSInfoDisplay({ ipfsData }: IPFSInfoDisplayProps) {
  return (
    <Card className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200">
      <CardHeader className="border-b border-gray-100/50 pb-6">
        <div className="flex items-center space-x-3">
          <div>
            <CardTitle className="text-2xl text-primary font-bold">
              IPFS Information
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Your manuscript has been stored on IPFS
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-8">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">CID</span>
              <span className="text-base text-primary font-medium">
                {ipfsData.cid}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(ipfsData.ipfsUrl, "_blank")}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            View on IPFS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}