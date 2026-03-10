import { useEffect, useState, useCallback } from "react";

export interface PageReadyState {
  isClient: boolean;
  isHydrated: boolean;
  isImagesLoaded: boolean;
  isAnimationsReady: boolean;
  isDataLoaded: boolean;
  isFontsLoaded: boolean;
}

export interface PageReadyOptions {
  checkImages?: boolean;
  checkFonts?: boolean;
  checkData?: boolean;
  minLoadTime?: number;
  maxLoadTime?: number;
}

export function usePageReady(options: PageReadyOptions = {}) {
  const {
    checkImages = false,
    checkFonts = true,
    checkData = true,
    minLoadTime = 500,
    maxLoadTime = 5000,
  } = options;

  const [pageState, setPageState] = useState<PageReadyState>({
    isClient: false,
    isHydrated: false,
    isImagesLoaded: false,
    isAnimationsReady: false,
    isDataLoaded: false,
    isFontsLoaded: false,
  });

  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const updateProgress = useCallback(() => {
    const totalChecks = Object.keys(pageState).length;
    const completedChecks = Object.values(pageState).filter(Boolean).length;
    const newProgress = Math.round((completedChecks / totalChecks) * 100);
    setProgress(newProgress);
  }, [pageState]);

  useEffect(() => {
    updateProgress();
  }, [pageState, updateProgress]);

  useEffect(() => {
    const checkPageReadiness = async () => {
      const startTime = Date.now();

      setPageState((prev) => ({ ...prev, isClient: true }));

      await new Promise((resolve) => setTimeout(resolve, 100));
      setPageState((prev) => ({ ...prev, isHydrated: true }));

      if (checkImages) {
        try {
          const images = document.querySelectorAll("img");
          const imagePromises = Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          });
          await Promise.all(imagePromises);
          setPageState((prev) => ({ ...prev, isImagesLoaded: true }));
        } catch (error) {
          console.warn("Image loading check failed:", error);
          setPageState((prev) => ({ ...prev, isImagesLoaded: true }));
        }
      } else {
        setPageState((prev) => ({ ...prev, isImagesLoaded: true }));
      }

      if (checkFonts) {
        try {
          if ("fonts" in document) {
            await document.fonts.ready;
          }
          setPageState((prev) => ({ ...prev, isFontsLoaded: true }));
        } catch (error) {
          console.warn("Font loading check failed:", error);
          setPageState((prev) => ({ ...prev, isFontsLoaded: true }));
        }
      } else {
        setPageState((prev) => ({ ...prev, isFontsLoaded: true }));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      setPageState((prev) => ({ ...prev, isAnimationsReady: true }));

      if (checkData) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setPageState((prev) => ({ ...prev, isDataLoaded: true }));
      } else {
        setPageState((prev) => ({ ...prev, isDataLoaded: true }));
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (Date.now() - startTime > maxLoadTime) {
        console.warn("Page load exceeded maximum time, forcing ready state");
      }

      setIsReady(true);
    };

    checkPageReadiness();
  }, [checkImages, checkFonts, checkData, minLoadTime, maxLoadTime]);

  return {
    isReady,
    progress,
    pageState,
    setPageState,
  };
}
