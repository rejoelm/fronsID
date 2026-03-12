import { useState } from "react";

export type SectionName = "education" | "experience" | "publications" | "awards";

export function useCollapsibleSections() {
  // Initialize sections as closed by default for better UX
  const [openSections, setOpenSections] = useState<Record<SectionName, boolean>>({
    education: false,
    experience: false,
    publications: false,
    awards: false,
  });

  const toggleSection = (section: SectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const openSection = (section: SectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: true,
    }));
  };

  const closeSection = (section: SectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: false,
    }));
  };

  const openAllSections = () => {
    setOpenSections({
      education: true,
      experience: true,
      publications: true,
      awards: true,
    });
  };

  const closeAllSections = () => {
    setOpenSections({
      education: false,
      experience: false,
      publications: false,
      awards: false,
    });
  };

  return {
    openSections,
    toggleSection,
    openSection,
    closeSection,
    openAllSections,
    closeAllSections,
  };
}