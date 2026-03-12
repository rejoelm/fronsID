"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share, Phone, Download, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getBestSharingStrategy,
  getSharingButtonText,
  getSharingSuccessMessage
} from "@/utils/platformUtils";

interface ShareToContactButtonProps {
  profile: {
    fullName?: string;
    username: string;
    title?: string;
    institution?: string;
    publicContact: {
      email?: string;
      phone?: string;
      website?: string;
      linkedIn?: string;
      github?: string;
      orcid?: string;
      googleScholar?: string;
    };
    field?: string;
    location?: string;
  };
  className?: string;
}

export function ShareToContactButton({ profile, className }: ShareToContactButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<'success' | 'error' | null>(null);
  const [sharingStrategy, setSharingStrategy] = useState<'web-share' | 'download'>('download');
  useEffect(() => {
    // Determine the best sharing strategy on client side
    const strategy = getBestSharingStrategy();
    setSharingStrategy(strategy);
  }, []);

  const generateVCard = () => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.fullName || profile.username}`,
      `N:${profile.fullName ? profile.fullName.split(' ').slice(-1)[0] : profile.username};${profile.fullName ? profile.fullName.split(' ').slice(0, -1).join(' ') : ''};;;`,
      profile.title ? `TITLE:${profile.title}` : '',
      profile.institution ? `ORG:${profile.institution}` : '',
      profile.publicContact.email ? `EMAIL:${profile.publicContact.email}` : '',
      profile.publicContact.phone ? `TEL:${profile.publicContact.phone}` : '',
      profile.publicContact.website ? `URL:${profile.publicContact.website}` : '',
      profile.location ? `ADR:;;;;;;${profile.location}` : '',
      profile.field ? `NOTE:Field: ${profile.field}` : '',
      profile.publicContact.linkedIn ? `URL;TYPE=LinkedIn:${profile.publicContact.linkedIn}` : '',
      profile.publicContact.github ? `URL;TYPE=GitHub:${profile.publicContact.github}` : '',
      profile.publicContact.orcid ? `URL;TYPE=ORCID:${profile.publicContact.orcid}` : '',
      profile.publicContact.googleScholar ? `URL;TYPE=GoogleScholar:${profile.publicContact.googleScholar}` : '',
      'END:VCARD'
    ].filter(line => line && !line.endsWith(':')).join('\n');

    return vCard;
  };

  const downloadVCard = (vCardData: string, fileName: string) => {
    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareViaWebShare = async (vCardData: string, fileName: string) => {
    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const file = new File([blob], fileName, { type: 'text/vcard' });

    // Double-check Web Share API support with error handling
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
      throw new Error('File sharing not supported');
    }

    await navigator.share({
      title: `Contact: ${profile.fullName || profile.username}`,
      text: `Academic contact information for ${profile.fullName || profile.username}`,
      files: [file],
    });
  };

  const shareToContact = async () => {
    setIsSharing(true);
    setShareResult(null);

    try {
      const vCardData = generateVCard();
      const fileName = `${profile.fullName || profile.username}.vcf`;

      if (sharingStrategy === 'web-share') {
        try {
          await shareViaWebShare(vCardData, fileName);
        } catch (webShareError) {
          console.warn('Web Share failed, falling back to download:', webShareError);
          // Fallback to download if Web Share fails
          downloadVCard(vCardData, fileName);
        }
      } else {
        // Direct download for desktop or when Web Share is not supported
        downloadVCard(vCardData, fileName);
      }

      setShareResult('success');
    } catch (error) {
      console.error('Error sharing contact:', error);
      setShareResult('error');
    } finally {
      setIsSharing(false);
      setTimeout(() => setShareResult(null), 3000);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={shareToContact}
        disabled={isSharing}
        className={`flex items-center gap-2 ${className}`}
        variant="outline"
      >
        {isSharing ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : shareResult === 'success' ? (
          <Check className="w-4 h-4" />
        ) : (
          <>
            {sharingStrategy === 'web-share' ? (
              <>
                <Share className="w-4 h-4" />
                <Phone className="w-4 h-4" />
              </>
            ) : (
              <Download className="w-4 h-4" />
            )}
          </>
        )}
        {isSharing
          ? (sharingStrategy === 'web-share' ? 'Sharing...' : 'Downloading...')
          : shareResult === 'success'
            ? 'Success!'
            : getSharingButtonText(sharingStrategy)
        }
      </Button>

      {shareResult === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {getSharingSuccessMessage(sharingStrategy)}
          </AlertDescription>
        </Alert>
      )}

      {shareResult === 'error' && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {sharingStrategy === 'web-share'
              ? 'Failed to share contact. The contact file will be downloaded instead.'
              : 'Failed to download contact file. Please try again.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}