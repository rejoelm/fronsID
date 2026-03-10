import React from "react";

export function Separator({
  orientation = "horizontal",
  className = "",
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      className={
        orientation === "vertical"
          ? `w-px h-6 bg-gray-200 ${className}`
          : `h-px w-full bg-gray-200 ${className}`
      }
      role="separator"
      aria-orientation={orientation}
    />
  );
}
