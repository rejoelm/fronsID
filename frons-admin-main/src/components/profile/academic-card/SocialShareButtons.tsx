"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/sonner";
import {
  LinkedinIcon,
  TwitterIcon,
  MailIcon,
  LinkIcon,
  MessageCircleIcon,
  FacebookIcon,
} from "lucide-react";

interface ProfileData {
  fullName: string;
  institution: string;
  title: string;
  field: string;
  email: string;
  walletAddress: string;
  profileUrl?: string;
}

interface SocialShareButtonsProps {
  profileData: ProfileData;
}

export function SocialShareButtons({ profileData }: SocialShareButtonsProps) {
  const { toast } = useToast();

  const shareText = `Check out my academic profile: ${profileData.fullName}, ${profileData.title} at ${profileData.institution}. Field: ${profileData.field}`;
  const profileUrl = profileData.profileUrl || `https://fronsciers.com/profile/${profileData.walletAddress}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareOptions = [
    {
      name: "LinkedIn",
      icon: LinkedinIcon,
      action: () => {
        const linkedInText = `🎓 ${shareText}\n\n🔗 Connect with me on Fronsciers: ${profileUrl}\n\n#AcademicNetworking #Research #Blockchain #Fronsciers`;
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(`${profileData.fullName} - Academic Profile`)}&summary=${encodeURIComponent(linkedInText)}`;
        window.open(url, '_blank');
      },
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      name: "Twitter",
      icon: TwitterIcon,
      action: () => {
        const twitterText = `🎓 ${shareText}\n\n🔗 ${profileUrl}\n\n#AcademicNetworking #Research #Blockchain #Fronsciers`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
        window.open(url, '_blank');
      },
      color: "bg-blue-400 hover:bg-blue-500 text-white",
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
      },
      color: "bg-blue-800 hover:bg-blue-900 text-white",
    },
    {
      name: "WhatsApp",
      icon: MessageCircleIcon,
      action: () => {
        const whatsappText = `${shareText}\n\n${profileUrl}`;
        const url = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        window.open(url, '_blank');
      },
      color: "bg-green-600 hover:bg-green-700 text-white",
    },
    {
      name: "Email",
      icon: MailIcon,
      action: () => {
        const subject = `Academic Profile: ${profileData.fullName}`;
        const body = `Hi,\n\nI'd like to share my academic profile with you:\n\n${shareText}\n\nYou can view my full profile and research work here:\n${profileUrl}\n\nBest regards,\n${profileData.fullName}`;
        const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(url);
      },
      color: "bg-gray-600 hover:bg-gray-700 text-white",
    },
    {
      name: "Copy Link",
      icon: LinkIcon,
      action: () => copyToClipboard(profileUrl),
      color: "bg-orange-600 hover:bg-orange-700 text-white",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {shareOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Button
              key={option.name}
              variant="outline"
              size="sm"
              onClick={option.action}
              className={`justify-start ${option.color} border-0`}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {option.name}
            </Button>
          );
        })}
      </div>

      {/* Email Signature Generator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-xs font-medium text-gray-700 mb-2">📧 Email Signature</h5>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            const signature = generateEmailSignature(profileData);
            copyToClipboard(signature);
          }}
        >
          Copy Email Signature HTML
        </Button>
      </div>

      {/* Business Card Data */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="text-xs font-medium text-blue-700 mb-2">📱 Contact Info</h5>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            const vCardData = generateVCard(profileData);
            copyToClipboard(vCardData);
          }}
        >
          Copy vCard Contact Data
        </Button>
      </div>
    </div>
  );
}

// Generate HTML email signature
function generateEmailSignature(profileData: ProfileData): string {
  return `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.4;">
  <div style="border-left: 3px solid #f97316; padding-left: 15px;">
    <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${profileData.fullName}</div>
    <div style="font-size: 14px; color: #6b7280;">${profileData.title}</div>
    <div style="font-size: 14px; color: #6b7280;">${profileData.institution}</div>
    <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
      Field: ${profileData.field} | 
      <a href="${profileData.profileUrl || `https://fronsciers.com/profile/${profileData.walletAddress}`}" style="color: #f97316; text-decoration: none;">Fronsciers Profile</a>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
      <em>Powered by Fronsciers - On-Chain Research Library</em>
    </div>
  </div>
</div>
  `.trim();
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