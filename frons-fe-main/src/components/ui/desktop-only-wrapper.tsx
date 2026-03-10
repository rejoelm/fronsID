"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

interface DesktopOnlyWrapperProps {
  children: React.ReactNode;
}

export function DesktopOnlyWrapper({ children }: DesktopOnlyWrapperProps) {
  const [isDesktop, setIsDesktop] = useState(true); // Default to desktop to prevent flash
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // During SSR, always render children to prevent hydration issues
  if (!isClient) {
    return <>{children}</>;
  }

  // Client-side: show appropriate content based on screen size
  if (isDesktop) {
    return <>{children}</>;
  }

  // Mobile view
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center mb-8">
          <Image
            src="/headerlogo.svg"
            alt="Fronsciers Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-primary">
            Desktop Experience Required
          </h1>
          <p className="text-black">
            Fronsciers is optimized for desktop and laptop devices to provide
            the best academic publishing experience.
          </p>
        </div>
      </div>
    </div>
  );
}
