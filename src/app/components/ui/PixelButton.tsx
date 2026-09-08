import { useState } from "react";

export function PixelBtn({
  children,
  onClick,
  color = "#00ff88",
  textColor = "#0a0e1a",
  size = "md",
  full = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  full?: boolean;
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const pad = size === "lg" ? "px-6 py-4" : size === "sm" ? "px-3 py-2" : "px-4 py-3";
  const txt = size === "lg" ? "text-[12px]" : size === "sm" ? "text-[9px]" : "text-[10px]";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        backgroundColor: disabled ? "#2a3a5c" : color,
        color: disabled ? "#6b8ba4" : textColor,
        border: `4px solid ${disabled ? "#1a2340" : "#0a0e1a"}`,
        boxShadow: pressed || disabled ? "none" : `4px 4px 0px #0a0e1a`,
        transform: pressed ? "translate(4px, 4px)" : "translate(0,0)",
        fontFamily: "'Share Tech Mono', monospace",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.05s, box-shadow 0.05s",
        imageRendering: "pixelated",
      }}
      className={`${pad} ${txt} ${full ? "w-full" : ""} select-none outline-none`}
    >
      {children}
    </button>
  );
}