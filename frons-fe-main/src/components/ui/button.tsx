import React from "react";

export const buttonVariants = (props?: { variant?: string; size?: string }) => {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    default:
      "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md",
    outline:
      "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
  };

  const variant = props?.variant || "default";
  const size = props?.size || "default";

  return `${base} ${
    variants[variant as keyof typeof variants] || variants.default
  } ${sizes[size as keyof typeof sizes] || sizes.default}`;
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg";
    asChild?: boolean;
  }
>(
  (
    {
      children,
      className = "",
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    const variants = {
      default:
        "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md",
      outline:
        "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
      ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-6 text-base",
    };

    const buttonClasses = `${base} ${variants[variant] || ""} ${
      sizes[size] || ""
    } ${className}`;

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: buttonClasses,
        ref,
        ...props,
      } as any);
    }

    return (
      <button ref={ref} className={buttonClasses} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
