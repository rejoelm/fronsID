"use client";

import React, { useMemo } from "react";
import QRCode from "react-qr-code";

interface ProfileData {
  fullName: string;
  institution: string;
  title: string;
  field: string;
  email: string;
  walletAddress: string;
  profileUrl?: string;
}

interface QRCodeDisplayProps {
  profileData: ProfileData;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
}

export function QRCodeDisplay({
  profileData,
  size = 128,
  level = "M",
}: QRCodeDisplayProps) {
  const qrData = useMemo(() => {
    // Create structured data for QR code
    const qrPayload = {
      type: "fronsciers_profile",
      name: profileData.fullName,
      institution: profileData.institution,
      title: profileData.title,
      field: profileData.field,
      email: profileData.email,
      profileUrl: profileData.profileUrl || `https://fronsciers.com/profile/${profileData.walletAddress}`,
      walletAddress: profileData.walletAddress,
      generated: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };

    // Return as JSON string for QR code
    return JSON.stringify(qrPayload);
  }, [profileData]);

  return (
    <div className="flex items-center justify-center">
      <QRCode
        value={qrData}
        size={size}
        level={level}
        style={{
          height: "auto",
          maxWidth: "100%",
          width: "100%",
        }}
      />
    </div>
  );
}

// Utility function to extract QR data for external use
export function generateQRData(profileData: ProfileData): string {
  const qrPayload = {
    type: "fronsciers_profile",
    name: profileData.fullName,
    institution: profileData.institution,
    title: profileData.title,
    field: profileData.field,
    email: profileData.email,
    profileUrl: profileData.profileUrl || `https://fronsciers.com/profile/${profileData.walletAddress}`,
    walletAddress: profileData.walletAddress,
    generated: new Date().toISOString().split('T')[0],
  };

  return JSON.stringify(qrPayload);
}

// vCard format for better compatibility with contact apps
export function generateVCardData(profileData: ProfileData): string {
  const vCard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profileData.fullName}`,
    `ORG:${profileData.institution}`,
    `TITLE:${profileData.title}`,
    `EMAIL:${profileData.email}`,
    `URL:${profileData.profileUrl || `https://fronsciers.com/profile/${profileData.walletAddress}`}`,
    `NOTE:Field: ${profileData.field}`,
    `X-FRONSCIERS-WALLET:${profileData.walletAddress}`,
    "END:VCARD"
  ].join("\r\n");

  return vCard;
}