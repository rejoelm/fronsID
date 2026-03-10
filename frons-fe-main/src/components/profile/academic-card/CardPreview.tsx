"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { IconFlipVertical } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  fullName: string;
  institution: string;
  title: string;
  field: string;
  email: string;
  walletAddress: string;
  profileUrl?: string;
}

interface CardPreviewProps {
  profileData: ProfileData;
  className?: string;
}

export function CardPreview({ profileData, className }: CardPreviewProps) {
  const [showBack, setShowBack] = useState(false);

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="mb-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBack(!showBack)}
          className="flex items-center gap-2"
        >
          <IconFlipVertical className="h-4 w-4" />
          {showBack ? "Show Front" : "Show Back"}
        </Button>
      </div>

      <div className="relative">
        <div
          className={cn(
            "transition-transform duration-700 transform-style-3d",
            showBack && "rotate-y-180"
          )}
        >
          <div className={cn("backface-hidden", showBack && "hidden")}>
            <CardFront profileData={profileData} />
          </div>

          <div
            className={cn(
              "backface-hidden rotate-y-180",
              !showBack && "hidden"
            )}
          >
            <CardBack />
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Badge variant="outline" className="text-xs">
          {showBack ? "Card Back Side" : "Card Front Side"}
        </Badge>
      </div>
    </div>
  );
}

function CardFront({ profileData }: { profileData: ProfileData }) {
  return (
    <Card className="w-full h-64 border-orange-300 border-2 rounded-xl overflow-hidden relative">
      <CardContent className="h-full p-0 text-white relative">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/academic-card/card-front-side.svg')`,
          }}
        />

        <div className="absolute top-8 left-8 w-20 h-20 p-2 rounded-lg bg-white ">
          <QRCodeDisplay profileData={profileData} size={64} level="M" />
        </div>

        <div className="absolute bottom-8 left-8   right-8">
          <h2 className="text-xl font-bold mb-1 text-white">
            {profileData.fullName}
          </h2>
          <p className="text-orange-200 text-sm mb-2">
            {profileData.institution}
          </p>
          <div className="flex items-center gap-2 text-xs text-orange-100">
            <Badge
              variant="secondary"
              className="bg-orange-900/30 text-orange-200 border-orange-400/30"
            >
              {profileData.title}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-orange-900/30 text-orange-200 border-orange-400/30"
            >
              {profileData.field}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CardBack() {
  return (
    <Card className="w-full h-64 border-orange-300 border-2 rounded-xl overflow-hidden relative">
      <CardContent className="h-full p-0 text-white relative flex flex-col items-center justify-center">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/academic-card/card-back-side.svg')`,
          }}
        />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold text-white mb-2">Fronsciers</h1>
          <p className="text-orange-200 text-sm italic">
            On-Chain Research Library
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
