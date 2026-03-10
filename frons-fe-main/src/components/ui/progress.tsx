import React from "react";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  animated?: boolean;
  gradient?: boolean;
}

export function Progress({
  value,
  max = 100,
  className = "",
  animated = false,
  gradient = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const progressClasses = [
    "h-2 rounded-full transition-all duration-300 ease-out",
    animated ? "animate-pulse" : "",
    gradient ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-blue-600",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div className={progressClasses} style={{ width: `${percentage}%` }} />
    </div>
  );
}
