/**
 * Platform detection utilities for determining device type and capabilities
 */

export interface PlatformInfo {
  isMobile: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsWebShare: boolean;
  supportsFileSharing: boolean;
}

/**
 * Detect if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
    "mobile",
    "tablet",
  ];

  const hasMobileKeyword = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword)
  );

  // Check for touch capability and screen size
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasSmallScreen = window.innerWidth <= 768;

  return hasMobileKeyword || (hasTouchScreen && hasSmallScreen);
}

/**
 * Detect if the current device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Detect if the current device is Android
 */
export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * Check if Web Share API is available and functional
 */
export function canUseWebShare(): boolean {
  if (typeof window === "undefined") return false;

  return (
    "navigator" in window &&
    "share" in navigator &&
    typeof navigator.share === "function"
  );
}

/**
 * Check if Web Share API can share files
 */
export function canShareFiles(): boolean {
  if (!canUseWebShare()) return false;

  try {
    // Create a dummy file to test file sharing capability
    const testFile = new File(["test"], "test.txt", { type: "text/plain" });

    return (
      "canShare" in navigator &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [testFile] })
    );
  } catch (error) {
    // If any error occurs during testing, assume file sharing is not supported
    return false;
  }
}

/**
 * Get comprehensive platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const isMobile = isMobileDevice();
  const isDesktop = !isMobile;
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  const supportsWebShare = canUseWebShare();
  const supportsFileSharing = canShareFiles();

  return {
    isMobile,
    isDesktop,
    isIOS,
    isAndroid,
    supportsWebShare,
    supportsFileSharing,
  };
}

/**
 * Get the best sharing strategy based on platform capabilities
 */
export function getBestSharingStrategy(): "web-share" | "download" {
  const platform = getPlatformInfo();

  // Use Web Share API if available and on mobile with file sharing support
  if (
    platform.isMobile &&
    platform.supportsWebShare &&
    platform.supportsFileSharing
  ) {
    return "web-share";
  }

  // Fallback to download for desktop or when Web Share API is not fully supported
  return "download";
}

/**
 * Get platform-appropriate button text
 */
export function getSharingButtonText(
  strategy: "web-share" | "download"
): string {
  switch (strategy) {
    case "web-share":
      return "Share to Contacts";
    case "download":
      return "Save Contact";
    default:
      return "Share Contact";
  }
}

/**
 * Get platform-appropriate success message
 */
export function getSharingSuccessMessage(
  strategy: "web-share" | "download"
): string {
  switch (strategy) {
    case "web-share":
      return "Contact shared successfully!";
    case "download":
      return "Contact file downloaded! You can import it to your contacts app.";
    default:
      return "Contact information saved successfully!";
  }
}
