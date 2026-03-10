"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/sonner";
import { DownloadIcon, ImageIcon, FileTextIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ProfileData {
  fullName: string;
  institution: string;
  title: string;
  field: string;
  email: string;
  walletAddress: string;
  profileUrl?: string;
}

interface CardExporterProps {
  profileData: ProfileData;
  hasAccess?: boolean;
}

export function CardExporter({ profileData, hasAccess = true }: CardExporterProps) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const exportAsImage = async (format: "png" | "jpeg") => {
    if (!hasAccess) {
      toast.error("Please purchase Academic Card access to export");
      return;
    }

    if (!cardRef.current) {
      toast.error("Card preview not found");
      return;
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `fronsciers-academic-card-${profileData.fullName.replace(/\s+/g, "-").toLowerCase()}.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();

      toast.success(`Card exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export card");
    }
  };

  const exportAsPDF = async () => {
    if (!cardRef.current) {
      toast.error("Card preview not found");
      return;
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54], // Standard credit card size
      });

      const imgWidth = 85.6;
      const imgHeight = 54;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`fronsciers-academic-card-${profileData.fullName.replace(/\s+/g, "-").toLowerCase()}.pdf`);

      toast.success("Card exported as PDF");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF");
    }
  };

  const exportVCard = () => {
    const vCard = generateVCard(profileData);
    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${profileData.fullName.replace(/\s+/g, "-").toLowerCase()}.vcf`;
    link.click();

    toast.success("vCard contact file downloaded");
  };

  return (
    <div className="space-y-2">
      {/* Hidden card reference for export */}
      <div ref={cardRef} className="absolute -left-[9999px] top-0">
        <div className="w-[400px] h-[250px]">
          {/* Card preview content will be rendered here during export */}
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAsImage("png")}
          className="w-full justify-start text-xs"
        >
          <ImageIcon className="h-3 w-3 mr-2" />
          PNG Image
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAsImage("jpeg")}
          className="w-full justify-start text-xs"
        >
          <ImageIcon className="h-3 w-3 mr-2" />
          JPEG Image
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={exportAsPDF}
          className="w-full justify-start text-xs"
        >
          <FileTextIcon className="h-3 w-3 mr-2" />
          PDF Card
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={exportVCard}
          className="w-full justify-start text-xs"
        >
          <DownloadIcon className="h-3 w-3 mr-2" />
          vCard File
        </Button>
      </div>

      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
        💡 <strong>Tip:</strong> PNG format preserves transparency, PDF is best for printing
      </div>
    </div>
  );
}

// Generate vCard contact data
function generateVCard(profileData: ProfileData): string {
  const vCard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profileData.fullName}`,
    `ORG:${profileData.institution}`,
    `TITLE:${profileData.title}`,
    `EMAIL:${profileData.email}`,
    `URL:${profileData.profileUrl || `https://fronsciers.com/profile/${profileData.walletAddress}`}`,
    `NOTE:Field: ${profileData.field} | Fronsciers Academic Profile`,
    `X-FRONSCIERS-WALLET:${profileData.walletAddress}`,
    "END:VCARD"
  ].join("\r\n");

  return vCard;
}