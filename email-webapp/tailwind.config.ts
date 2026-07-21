import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // base terminal surfaces
        base: "#0A0E14",
        panel: "#0F1620",
        "panel-alt": "#131C28",
        line: "#1E2A38",
        "line-strong": "#2A3B4D",
        // alias so existing paper-* classnames (from the old case-file theme) still resolve
        paper: {
          DEFAULT: "#0A0E14",
          deep: "#0F1620",
          line: "#1E2A38",
        },
        // text
        ink: {
          DEFAULT: "#E3E8ED",
          soft: "#8494A6",
        },
        muted: "#5A6B7D",
        // accents
        green: {
          DEFAULT: "#39D97A",
          deep: "#26A85C",
          dim: "rgba(57,217,122,0.1)",
        },
        amber: {
          DEFAULT: "#E0A83E",
          deep: "#B9832A",
          dim: "rgba(224,168,62,0.1)",
        },
        danger: {
          DEFAULT: "#E5484D",
          deep: "#B23A3A",
          dim: "rgba(229,72,77,0.1)",
        },
        // legacy alias so existing teal-deep classes still resolve to green
        teal: {
          DEFAULT: "#39D97A",
          deep: "#26A85C",
        },
        // sender avatar swatches
        avatar: {
          red: "#7C2A2A",
          green: "#2F5F3F",
          rust: "#8A4A1E",
          blue: "#2A4A6E",
        },
        // kept for the inbox reading surface (still slightly lighter than panel)
        inbox: {
          bg: "#0D131C",
          line: "#212D3B",
          text: "#E3E8ED",
          muted: "#6B7A8C",
        },
        // alias so existing terminal-* classnames keep working
        terminal: {
          bg: "#0A0E14",
          line: "#1E2A38",
          text: "#B9C7C4",
          dim: "#5A6B7D",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
        sans: ["var(--font-mono)"],
        serif: ["var(--font-mono)"],
        stamp: ["var(--font-mono)"],
      },
      backgroundImage: {
        "paper-dots": "none",
      },
      backgroundSize: {
        "paper-grid": "auto",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(-3px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "pulse-dot": "pulseDot 2.4s infinite",
        reveal: "reveal 0.35s ease",
      },
    },
  },
  plugins: [],
};
export default config;
