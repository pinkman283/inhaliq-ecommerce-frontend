"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

interface AdminCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  title?: string;
  ariaLabel?: string;
  className?: string;
}

export function AdminCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  id,
  name,
  title,
  ariaLabel,
  className = "",
}: AdminCheckboxProps) {
  return (
    <label
      className={`relative inline-flex items-center justify-center select-none group ${
        disabled ? "opacity-35 cursor-not-allowed pointer-events-none" : "cursor-pointer"
      } ${className}`}
      title={title}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
      }}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only peer"
        aria-label={ariaLabel || title}
      />
      <div
        className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-150 border ${
          checked || indeterminate
            ? "bg-[#A78BFA] border-[#B9A3FF] text-[#090B10] shadow-sm shadow-[#A78BFA]/20"
            : "bg-[#11141D] border-[#272B35] hover:border-[#A78BFA]/50 hover:bg-[#171B26] peer-focus-visible:ring-2 peer-focus-visible:ring-[#A78BFA]/40"
        }`}
      >
        {checked && !indeterminate && (
          <Check className="w-3 h-3 stroke-[3] text-[#090B10]" />
        )}
        {indeterminate && (
          <Minus className="w-3 h-3 stroke-[3] text-[#090B10]" />
        )}
      </div>
    </label>
  );
}

