import React, { useState, useRef, useEffect } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options?: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function Select({
  options = [],
  value,
  onValueChange,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  children,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onValueChange?.(optionValue);
    setIsOpen(false);
  };

  // If children are provided, render compound pattern
  if (children) {
    return (
      <div ref={selectRef} className={`relative ${className}`}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              isOpen,
              setIsOpen,
              selectedValue,
              onValueChange,
              disabled,
            } as any);
          }
          return child;
        })}
      </div>
    );
  }

  // Otherwise render options pattern
  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""
        }`}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <ul className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    option.value === selectedValue
                      ? "bg-blue-50 text-blue-900"
                      : "text-gray-900"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Individual components for compound pattern
export function SelectTrigger({
  children,
  className = "",
  disabled = false,
  isOpen,
  setIsOpen,
  selectedValue,
  onValueChange,
}: SelectTriggerProps & {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && setIsOpen?.(!isOpen)}
      disabled={disabled}
      className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
        isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""
      } ${className}`}
    >
      {children}
      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </button>
  );
}

export function SelectContent({
  children,
  className = "",
  isOpen,
}: SelectContentProps & { isOpen?: boolean }) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${className}`}
    >
      <ul className="py-1 max-h-60 overflow-auto">{children}</ul>
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className = "",
  onClick,
  selectedValue,
  onValueChange,
  setIsOpen,
}: SelectItemProps & {
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
}) {
  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen?.(false);
    onClick?.();
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
          value === selectedValue ? "bg-blue-50 text-blue-900" : "text-gray-900"
        } ${className}`}
      >
        {children}
      </button>
    </li>
  );
}

export function SelectValue({ placeholder, className = "" }: SelectValueProps) {
  return <span className={`text-gray-500 ${className}`}>{placeholder}</span>;
}
