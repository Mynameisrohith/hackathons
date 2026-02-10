
"use client";

import React, { CSSProperties } from "react";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: string[];
}

export default function ShineBorder({
  children,
  className,
  color = ["#A07CFE", "#FE8A71", "#FED7AA"],
}: ShineBorderProps) {
  const borderStyle: CSSProperties = {
    "--shine-color-1": color[0],
    "--shine-color-2": color[1],
    "--shine-color-3": color[2],
    background:
      "linear-gradient(115deg, transparent 20%, var(--shine-color-1), var(--shine-color-2), var(--shine-color-3), transparent 80%)",
    backgroundSize: "200% 100%",
  };

  return (
    <div
      className={`group relative w-full rounded-2xl border border-border/50 bg-secondary ${className}`}
    >
      <div
        className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={borderStyle}
      />
      {children}
    </div>
  );
}
