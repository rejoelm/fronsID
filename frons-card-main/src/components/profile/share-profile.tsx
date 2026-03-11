"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Share2, Link as LinkIcon, Check, QrCode } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface ShareProfileProps {
  slug: string;
  name: string;
}

export default function ShareProfile({ slug, name }: ShareProfileProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`https://frons.id/p/${slug}`);
  }, [slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-[#2C337A] hover:bg-[#E5E0FE]/30 font-semibold py-2.5 px-6 rounded-full shadow-sm transition-colors cursor-pointer">
          <QrCode className="w-5 h-5" />
          <span>Share Profile</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 max-w-sm w-[90vw] shadow-2xl z-50 animate-in zoom-in-95">
          <Dialog.Title className="text-2xl font-bold text-[#2C337A] text-center mb-2">
            Share Researcher
          </Dialog.Title>
          <Dialog.Description className="text-gray-500 text-center mb-8">
            Scan the QR code to view {name}'s verified portfolio.
          </Dialog.Description>

          <div className="flex justify-center bg-white border-4 border-[#E5E0FE] p-4 rounded-3xl shadow-sm mb-6 mx-auto w-fit">
            <QRCode
              value={url}
              size={200}
              level="H"
              bgColor="#ffffff"
              fgColor="#2C337A"
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-3 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="bg-[#2C337A] hover:bg-[#1E245A] text-white p-3 rounded-xl transition-colors shrink-0"
              title="Copy Link"
            >
              {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            </button>
          </div>
          
          <Dialog.Close asChild>
            <button className="w-full text-center text-sm text-gray-500 hover:text-gray-800 py-2 mt-2">
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
