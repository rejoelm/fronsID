import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors";

  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-gray-100 text-gray-600 border border-gray-200",
    destructive: "bg-red-50 text-red-600 border border-red-200",
    outline: "border border-gray-300 text-gray-600 bg-white",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
