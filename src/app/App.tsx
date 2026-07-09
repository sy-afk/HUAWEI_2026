import { useState, useEffect, useRef } from "react";

// ─── Backend API helpers ──────────────────────────────────────────────────
// All fall back gracefully (null / no-op) so the prototype still runs offline
// with its mock data if the backend isn't up.
async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(path);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}
// Persist an in-app *practice* drill result (half XP). Fire-and-forget.
function reportOutcome(outcome: string) {
  fetch("/api/drills/practice-result", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ outcome }),
  }).catch(() => {});
}

// ── Types ──────────────────────────────────────────────────────────────────
type Screen =
  | "title"
  | "home"
  | "drill-select"
  | "incoming"
  | "call"
  | "result-win"
  | "result-lose"
  | "leaderboard"
  | "profile"
  | "sms-inbox"
  | "sms-thread"
  | "sms-browser"
  | "email-inbox"
  | "email-detail"
  | "email-browser"
  | "email-download";

type Tab = "home" | "leaderboard" | "profile";
type DrillType = "call" | "sms" | "email";
type SmsOutcome = "reported" | "asked-family" | "clicked-link" | "closed-page";
type EmailOutcome = "reported" | "asked-family" | "submitted-details" | "opened-attachment" | "cancelled-download";

// ─────────────────────────────────────────────────────────────────────────
// PIXEL ICONS — all SVG rects, no emoji
// ─────────────────────────────────────────────────────────────────────────

function IconCheck({ size = 16, color = "#00ff88" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={1} y={4} width={1} height={1} fill={color} />
      <rect x={2} y={5} width={1} height={1} fill={color} />
      <rect x={3} y={6} width={1} height={1} fill={color} />
      <rect x={4} y={5} width={1} height={1} fill={color} />
      <rect x={5} y={4} width={1} height={1} fill={color} />
      <rect x={6} y={3} width={1} height={1} fill={color} />
      <rect x={7} y={2} width={1} height={1} fill={color} />
    </svg>
  );
}

function IconX({ size = 16, color = "#ff2d55" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={1} y={1} width={1} height={1} fill={color} />
      <rect x={2} y={2} width={1} height={1} fill={color} />
      <rect x={3} y={3} width={1} height={1} fill={color} />
      <rect x={4} y={4} width={1} height={1} fill={color} />
      <rect x={5} y={5} width={1} height={1} fill={color} />
      <rect x={6} y={6} width={1} height={1} fill={color} />
      <rect x={6} y={1} width={1} height={1} fill={color} />
      <rect x={5} y={2} width={1} height={1} fill={color} />
      <rect x={3} y={4} width={1} height={1} fill={color} />
      <rect x={2} y={5} width={1} height={1} fill={color} />
      <rect x={1} y={6} width={1} height={1} fill={color} />
    </svg>
  );
}

function IconFlame({ size = 24, color = "#ff6b35" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={3} y={9} width={4} height={3} fill={color} />
      <rect x={2} y={8} width={6} height={2} fill={color} />
      <rect x={1} y={6} width={8} height={3} fill={color} />
      <rect x={2} y={4} width={6} height={3} fill={color} />
      <rect x={4} y={2} width={2} height={3} fill={color} />
      <rect x={3} y={1} width={4} height={2} fill={color} />
      <rect x={4} y={0} width={2} height={2} fill={color} />
      <rect x={3} y={7} width={4} height={2} fill="#ffe66d" />
      <rect x={4} y={5} width={2} height={3} fill="#ffe66d" />
    </svg>
  );
}

function IconShield({ size = 24, color = "#00ff88" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 14" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={2} y={0} width={8} height={2} fill={color} />
      <rect x={1} y={1} width={10} height={2} fill={color} />
      <rect x={0} y={2} width={12} height={6} fill={color} />
      <rect x={1} y={8} width={10} height={2} fill={color} />
      <rect x={2} y={9} width={8} height={2} fill={color} />
      <rect x={4} y={11} width={4} height={2} fill={color} />
      <rect x={5} y={12} width={2} height={2} fill={color} />
      <rect x={3} y={5} width={1} height={1} fill="#0a0e1a" />
      <rect x={4} y={6} width={1} height={1} fill="#0a0e1a" />
      <rect x={5} y={7} width={1} height={1} fill="#0a0e1a" />
      <rect x={6} y={6} width={1} height={1} fill="#0a0e1a" />
      <rect x={7} y={5} width={1} height={1} fill="#0a0e1a" />
      <rect x={8} y={4} width={1} height={1} fill="#0a0e1a" />
    </svg>
  );
}

function IconSkull({ size = 24, color = "#ff2d55" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 14" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={3} y={0} width={6} height={2} fill={color} />
      <rect x={1} y={1} width={10} height={2} fill={color} />
      <rect x={0} y={2} width={12} height={5} fill={color} />
      <rect x={1} y={7} width={10} height={2} fill={color} />
      <rect x={2} y={9} width={2} height={3} fill={color} />
      <rect x={5} y={9} width={2} height={3} fill={color} />
      <rect x={8} y={9} width={2} height={3} fill={color} />
      <rect x={2} y={3} width={3} height={3} fill="#0a0e1a" />
      <rect x={7} y={3} width={3} height={3} fill="#0a0e1a" />
      <rect x={3} y={4} width={1} height={1} fill={color} />
      <rect x={8} y={4} width={1} height={1} fill={color} />
    </svg>
  );
}

function IconTrophy({ size = 24, color = "#ffe66d" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 14" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={2} y={0} width={8} height={6} fill={color} />
      <rect x={1} y={1} width={10} height={4} fill={color} />
      <rect x={0} y={1} width={2} height={3} fill={color} />
      <rect x={10} y={1} width={2} height={3} fill={color} />
      <rect x={4} y={6} width={4} height={3} fill={color} />
      <rect x={2} y={9} width={8} height={2} fill={color} />
      <rect x={1} y={11} width={10} height={2} fill={color} />
      <rect x={3} y={1} width={1} height={3} fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

function IconStar({ size = 16, color = "#ffe66d" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={4} y={0} width={2} height={2} fill={color} />
      <rect x={3} y={2} width={4} height={2} fill={color} />
      <rect x={0} y={3} width={10} height={2} fill={color} />
      <rect x={1} y={5} width={8} height={1} fill={color} />
      <rect x={0} y={6} width={4} height={1} fill={color} />
      <rect x={6} y={6} width={4} height={1} fill={color} />
      <rect x={0} y={7} width={3} height={1} fill={color} />
      <rect x={7} y={7} width={3} height={1} fill={color} />
      <rect x={2} y={8} width={2} height={2} fill={color} />
      <rect x={6} y={8} width={2} height={2} fill={color} />
    </svg>
  );
}

function IconMedal({ rank = 1, size = 20 }: { rank: number; size?: number }) {
  const colors = ["#ffe66d", "#c0c0c0", "#cd7f32"];
  const c = colors[rank - 1] ?? "#6b8ba4";
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={3} y={0} width={4} height={4} fill={c} opacity="0.6" />
      <rect x={4} y={0} width={2} height={5} fill={c} opacity="0.8" />
      <rect x={1} y={4} width={8} height={8} fill={c} />
      <rect x={0} y={5} width={10} height={6} fill={c} />
      <rect x={2} y={4} width={6} height={8} fill={c} />
      <rect x={4} y={6} width={2} height={4} fill="#0a0e1a" />
      <rect x={3} y={7} width={4} height={2} fill="#0a0e1a" />
    </svg>
  );
}

function IconPerson({ size = 20, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={3} y={0} width={4} height={4} fill={color} />
      <rect x={2} y={1} width={6} height={3} fill={color} />
      <rect x={2} y={4} width={6} height={4} fill={color} />
      <rect x={1} y={5} width={8} height={2} fill={color} />
      <rect x={2} y={8} width={2} height={2} fill={color} />
      <rect x={6} y={8} width={2} height={2} fill={color} />
    </svg>
  );
}

function IconLock({ size = 16, color = "#6b8ba4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={2} y={0} width={4} height={1} fill={color} />
      <rect x={1} y={1} width={6} height={3} fill={color} />
      <rect x={0} y={4} width={8} height={6} fill={color} />
      <rect x={2} y={1} width={4} height={2} fill="#0a0e1a" />
      <rect x={3} y={6} width={2} height={2} fill="#0a0e1a" />
      <rect x={3} y={8} width={2} height={1} fill="#0a0e1a" />
    </svg>
  );
}

function IconBell({ size = 20, color = "#ffe66d" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={4} y={0} width={2} height={1} fill={color} />
      <rect x={3} y={1} width={4} height={2} fill={color} />
      <rect x={1} y={3} width={8} height={5} fill={color} />
      <rect x={0} y={5} width={10} height={3} fill={color} />
      <rect x={0} y={8} width={10} height={1} fill={color} />
      <rect x={3} y={9} width={4} height={2} fill={color} />
      <rect x={4} y={11} width={2} height={1} fill={color} />
    </svg>
  );
}

function IconWarning({ size = 16, color = "#ff6b35" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={4} y={0} width={2} height={1} fill={color} />
      <rect x={3} y={1} width={4} height={1} fill={color} />
      <rect x={2} y={2} width={6} height={1} fill={color} />
      <rect x={1} y={3} width={8} height={1} fill={color} />
      <rect x={0} y={4} width={10} height={5} fill={color} />
      <rect x={4} y={5} width={2} height={2} fill="#0a0e1a" />
      <rect x={4} y={8} width={2} height={1} fill="#0a0e1a" />
    </svg>
  );
}

function IconBulb({ size = 16, color = "#ffe66d" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={2} y={0} width={4} height={1} fill={color} />
      <rect x={1} y={1} width={6} height={4} fill={color} />
      <rect x={0} y={2} width={8} height={3} fill={color} />
      <rect x={1} y={5} width={6} height={2} fill={color} />
      <rect x={2} y={7} width={4} height={2} fill={color} />
      <rect x={3} y={9} width={2} height={1} fill={color} />
    </svg>
  );
}

function IconPhone({ size = 20, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={0} y={0} width={4} height={4} fill={color} />
      <rect x={1} y={1} width={2} height={2} fill="#0a0e1a" />
      <rect x={3} y={2} width={7} height={2} fill={color} />
      <rect x={7} y={2} width={3} height={8} fill={color} />
      <rect x={6} y={7} width={2} height={3} fill={color} />
      <rect x={4} y={8} width={4} height={2} fill={color} />
    </svg>
  );
}

function IconHouse({ size = 20, color = "#00ff88" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={5} y={0} width={2} height={1} fill={color} />
      <rect x={4} y={1} width={4} height={1} fill={color} />
      <rect x={3} y={2} width={6} height={1} fill={color} />
      <rect x={2} y={3} width={8} height={1} fill={color} />
      <rect x={1} y={4} width={10} height={1} fill={color} />
      <rect x={1} y={5} width={10} height={7} fill={color} />
      <rect x={4} y={8} width={4} height={4} fill="#0a0e1a" />
      <rect x={2} y={6} width={2} height={2} fill="#0a0e1a" />
      <rect x={8} y={6} width={2} height={2} fill="#0a0e1a" />
    </svg>
  );
}

function IconBadge({ size = 24, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={3} y={0} width={6} height={2} fill={color} />
      <rect x={1} y={1} width={10} height={2} fill={color} />
      <rect x={0} y={2} width={12} height={6} fill={color} />
      <rect x={1} y={8} width={10} height={2} fill={color} />
      <rect x={3} y={9} width={6} height={2} fill={color} />
      <rect x={5} y={3} width={2} height={1} fill="#0a0e1a" />
      <rect x={4} y={4} width={4} height={1} fill="#0a0e1a" />
      <rect x={3} y={5} width={6} height={1} fill="#0a0e1a" />
      <rect x={4} y={6} width={4} height={1} fill="#0a0e1a" />
      <rect x={5} y={7} width={2} height={1} fill="#0a0e1a" />
    </svg>
  );
}

// ── NEW ICONS ─────────────────────────────────────────────────────────────

function IconEnvelope({ size = 20, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={0} y={0} width={12} height={10} fill={color} />
      <rect x={1} y={1} width={10} height={8} fill="#111827" />
      <rect x={0} y={0} width={1} height={1} fill={color} />
      <rect x={1} y={1} width={1} height={1} fill={color} />
      <rect x={2} y={2} width={1} height={1} fill={color} />
      <rect x={3} y={3} width={1} height={1} fill={color} />
      <rect x={4} y={4} width={1} height={1} fill={color} />
      <rect x={5} y={5} width={2} height={1} fill={color} />
      <rect x={7} y={4} width={1} height={1} fill={color} />
      <rect x={8} y={3} width={1} height={1} fill={color} />
      <rect x={9} y={2} width={1} height={1} fill={color} />
      <rect x={10} y={1} width={1} height={1} fill={color} />
      <rect x={11} y={0} width={1} height={1} fill={color} />
      <rect x={1} y={8} width={10} height={1} fill={color} />
    </svg>
  );
}

function IconChatBubble({ size = 20, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={1} y={0} width={10} height={8} fill={color} />
      <rect x={0} y={1} width={12} height={6} fill={color} />
      <rect x={2} y={1} width={8} height={6} fill="#111827" />
      <rect x={2} y={8} width={2} height={1} fill={color} />
      <rect x={2} y={9} width={1} height={1} fill={color} />
      <rect x={2} y={10} width={1} height={1} fill={color} />
      <rect x={3} y={3} width={2} height={2} fill={color} />
      <rect x={6} y={3} width={2} height={2} fill={color} />
      <rect x={9} y={3} width={1} height={2} fill={color} />
    </svg>
  );
}

function IconLink({ size = 16, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={0} y={3} width={2} height={4} fill={color} />
      <rect x={1} y={2} width={2} height={1} fill={color} />
      <rect x={1} y={7} width={2} height={1} fill={color} />
      <rect x={2} y={4} width={1} height={2} fill="#111827" />
      <rect x={3} y={4} width={4} height={2} fill={color} />
      <rect x={8} y={3} width={2} height={4} fill={color} />
      <rect x={7} y={2} width={2} height={1} fill={color} />
      <rect x={7} y={7} width={2} height={1} fill={color} />
      <rect x={7} y={4} width={1} height={2} fill="#111827" />
    </svg>
  );
}

function IconAttachment({ size = 16, color = "#c77dff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={0} y={2} width={6} height={10} fill={color} />
      <rect x={2} y={0} width={6} height={10} fill={color} />
      <rect x={0} y={2} width={2} height={2} fill="#0a0e1a" opacity={0.5} />
      <rect x={3} y={4} width={4} height={1} fill="#0a0e1a" opacity={0.4} />
      <rect x={3} y={6} width={4} height={1} fill="#0a0e1a" opacity={0.4} />
      <rect x={3} y={8} width={3} height={1} fill="#0a0e1a" opacity={0.4} />
    </svg>
  );
}

function IconDownload({ size = 16, color = "#00ff88" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={4} y={0} width={2} height={6} fill={color} />
      <rect x={2} y={5} width={6} height={2} fill={color} />
      <rect x={3} y={6} width={4} height={2} fill={color} />
      <rect x={4} y={7} width={2} height={2} fill={color} />
      <rect x={0} y={10} width={10} height={2} fill={color} />
    </svg>
  );
}

function IconBrowserWindow({ size = 20, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={0} y={0} width={14} height={12} fill={color} />
      <rect x={1} y={3} width={12} height={8} fill="#111827" />
      <rect x={1} y={1} width={2} height={2} fill="#ff2d55" />
      <rect x={4} y={1} width={2} height={2} fill="#ffe66d" />
      <rect x={7} y={1} width={2} height={2} fill="#00ff88" />
      <rect x={10} y={1} width={3} height={2} fill="#0a0e1a" opacity={0.5} />
      <rect x={2} y={5} width={8} height={1} fill={color} opacity={0.3} />
      <rect x={2} y={7} width={10} height={1} fill={color} opacity={0.3} />
      <rect x={2} y={9} width={6} height={1} fill={color} opacity={0.3} />
    </svg>
  );
}

function IconReportFlag({ size = 16, color = "#ff6b35" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={0} y={0} width={2} height={12} fill={color} opacity={0.6} />
      <rect x={2} y={0} width={6} height={5} fill={color} />
      <rect x={2} y={2} width={4} height={1} fill="#0a0e1a" opacity={0.4} />
    </svg>
  );
}

function IconEyeInspect({ size = 16, color = "#4ecdc4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 8" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={2} y={1} width={8} height={1} fill={color} />
      <rect x={1} y={2} width={10} height={4} fill={color} />
      <rect x={2} y={6} width={8} height={1} fill={color} />
      <rect x={4} y={2} width={4} height={4} fill="#111827" />
      <rect x={5} y={3} width={2} height={2} fill={color} />
    </svg>
  );
}

function IconTrashBin({ size = 16, color = "#ff2d55" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x={3} y={0} width={4} height={2} fill={color} />
      <rect x={0} y={2} width={10} height={2} fill={color} />
      <rect x={1} y={4} width={8} height={8} fill={color} />
      <rect x={3} y={5} width={1} height={5} fill="#0a0e1a" />
      <rect x={5} y={5} width={1} height={5} fill="#0a0e1a" />
      <rect x={7} y={5} width={1} height={5} fill="#0a0e1a" />
    </svg>
  );
}

// ── Pixel Mascot ──────────────────────────────────────────────────────────
function PixelMascot({ size = 64, animate = false }: { size?: number; animate?: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % 2), 500);
    return () => clearInterval(t);
  }, [animate]);

  const s = size / 16;
  const px = (n: number) => n * s;
  const bodyY = frame === 0 ? 0 : s;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: "pixelated" }}>
      <rect x={px(4)} y={px(1)} width={px(8)} height={px(7)} fill="#4ecdc4" />
      <rect x={px(5)} y={px(3)} width={px(2)} height={px(2)} fill="#0a0e1a" />
      <rect x={px(9)} y={px(3)} width={px(2)} height={px(2)} fill="#0a0e1a" />
      <rect x={px(6)} y={px(3)} width={px(1)} height={px(1)} fill="#ffffff" />
      <rect x={px(10)} y={px(3)} width={px(1)} height={px(1)} fill="#ffffff" />
      <rect x={px(6)} y={px(6)} width={px(1)} height={px(1)} fill="#0a0e1a" />
      <rect x={px(7)} y={px(7)} width={px(2)} height={px(1)} fill="#0a0e1a" />
      <rect x={px(9)} y={px(6)} width={px(1)} height={px(1)} fill="#0a0e1a" />
      <rect x={px(4)} y={px(8) + bodyY} width={px(8)} height={px(6)} fill="#00ff88" />
      <rect x={px(5)} y={px(9) + bodyY} width={px(6)} height={px(4)} fill="#0a0e1a" />
      <rect x={px(6)} y={px(10) + bodyY} width={px(4)} height={px(2)} fill="#00ff88" />
      <rect x={px(1)} y={px(9) + bodyY} width={px(3)} height={px(2)} fill="#4ecdc4" />
      <rect x={px(12)} y={px(9) + bodyY} width={px(3)} height={px(2)} fill="#4ecdc4" />
      <rect x={px(5)} y={px(14) + bodyY} width={px(2)} height={px(2)} fill="#4ecdc4" />
      <rect x={px(9)} y={px(14) + bodyY} width={px(2)} height={px(2)} fill="#4ecdc4" />
    </svg>
  );
}

function PixelAvatar({ rank = 1, size = 40 }: { rank?: number; size?: number }) {
  const colors = ["#00ff88", "#ff6b35", "#4ecdc4", "#ffe66d", "#ff2d55", "#c77dff", "#4ecdc4", "#ff6b35", "#6b8ba4"];
  const c = colors[(rank - 1) % colors.length];
  const s = size / 16;
  const px = (n: number) => n * s;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: "pixelated" }}>
      <rect x={px(4)} y={px(1)} width={px(8)} height={px(7)} fill={c} />
      <rect x={px(5)} y={px(3)} width={px(2)} height={px(2)} fill="#0a0e1a" />
      <rect x={px(9)} y={px(3)} width={px(2)} height={px(2)} fill="#0a0e1a" />
      <rect x={px(6)} y={px(6)} width={px(4)} height={px(1)} fill="#0a0e1a" />
      <rect x={px(4)} y={px(8)} width={px(8)} height={px(5)} fill={c} />
      <rect x={px(2)} y={px(9)} width={px(2)} height={px(2)} fill={c} />
      <rect x={px(12)} y={px(9)} width={px(2)} height={px(2)} fill={c} />
      <rect x={px(5)} y={px(13)} width={px(2)} height={px(3)} fill={c} />
      <rect x={px(9)} y={px(13)} width={px(2)} height={px(3)} fill={c} />
    </svg>
  );
}

function PixelPhone({ ringing = false }: { ringing?: boolean }) {
  const [tilt, setTilt] = useState(0);
  useEffect(() => {
    if (!ringing) return;
    const t = setInterval(() => setTilt((v) => (v === 0 ? -4 : v === -4 ? 4 : 0)), 150);
    return () => clearInterval(t);
  }, [ringing]);
  return (
    <div style={{ transform: `rotate(${tilt}deg)`, transition: "transform 0.1s", display: "inline-block" }}>
      <svg width={80} height={80} viewBox="0 0 80 80" style={{ imageRendering: "pixelated" }}>
        <rect x={16} y={8} width={48} height={64} fill="#2a3a5c" />
        <rect x={20} y={12} width={40} height={56} fill="#111827" />
        <rect x={24} y={16} width={32} height={40} fill="#1a2340" />
        <rect x={28} y={60} width={24} height={4} fill="#2a3a5c" />
        <rect x={34} y={62} width={12} height={2} fill="#4ecdc4" />
        {ringing && (
          <>
            <rect x={8} y={24} width={4} height={4} fill="#ffe66d" />
            <rect x={68} y={24} width={4} height={4} fill="#ffe66d" />
            <rect x={8} y={32} width={4} height={4} fill="#ffe66d" />
            <rect x={68} y={32} width={4} height={4} fill="#ffe66d" />
          </>
        )}
      </svg>
    </div>
  );
}

function PixelBtn({
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
  const txt = size === "lg" ? "text-[10px]" : size === "sm" ? "text-[7px]" : "text-[8px]";
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
        fontFamily: "'Press Start 2P', monospace",
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

function PixelPanel({
  children,
  className = "",
  accent = "#2a3a5c",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        border: `4px solid ${accent}`,
        boxShadow: `4px 4px 0px ${accent}`,
      }}
      className={`p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function XPBar({ current, max, color = "#00ff88" }: { current: number; max: number; color?: string }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className="w-full" style={{ border: "3px solid #2a3a5c", backgroundColor: "#0a0e1a", height: 16 }}>
      <div style={{ width: `${pct}%`, backgroundColor: color, height: "100%", transition: "width 0.5s" }} />
    </div>
  );
}

function Blink({ children, ms = 600 }: { children: React.ReactNode; ms?: number }) {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVis((v) => !v), ms);
    return () => clearInterval(t);
  }, [ms]);
  return <span style={{ opacity: vis ? 1 : 0 }}>{children}</span>;
}

function Scanlines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      }}
    />
  );
}

function Stars() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: ((i * 137.5) % 100).toFixed(1),
    y: ((i * 73.1) % 100).toFixed(1),
    s: i % 3 === 0 ? 2 : 1,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            backgroundColor: "#ffffff",
            opacity: 0.3 + (i % 4) * 0.15,
            animation: `twinkle ${1.5 + (i % 3) * 0.7}s ease-in-out infinite`,
            animationDelay: `${(i % 7) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#05080f]">
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 390,
          height: 844,
          backgroundColor: "#0a0e1a",
          border: "6px solid #2a3a5c",
          boxShadow: "8px 8px 0px #000, 0 0 40px rgba(0,255,136,0.15)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FLAG DATA
// ─────────────────────────────────────────────────────────────────────────
type DrillFlag = { id: string; name: string; explanation: string };

const RED_FLAGS: DrillFlag[] = [
  { id: "impersonation", name: "IMPERSONATION", explanation: "The real IRS contacts you by postal mail first — never by surprise phone call claiming urgent fraud." },
  { id: "arrest_threat", name: "ARREST THREAT", explanation: "No government agency threatens arrest over the phone. Fake legal threats bypass rational thinking." },
  { id: "gift_card", name: "GIFT CARD DEMAND", explanation: "No legitimate agency accepts gift cards as payment. Gift cards are untraceable — perfect for scammers." },
  { id: "urgency", name: "FAKE URGENCY", explanation: "Pressure to act RIGHT NOW stops you verifying anything. Scammers need you panicked, not thinking." },
  { id: "escalation", name: "FAKE ESCALATION", explanation: "Threatening to send police is a scare tactic. Real law enforcement does not coordinate with phone callers." },
];

const SMS_FLAGS: DrillFlag[] = [
  { id: "sms_sender", name: "UNKNOWN SENDER", explanation: "Legitimate delivery companies use official sender IDs, not random numbers or unrecognised names." },
  { id: "sms_urgency", name: "FAKE URGENCY", explanation: "Deadlines pressure you to act without thinking. Real parcels give you more than a few hours." },
  { id: "sms_link", name: "SUSPICIOUS LINK", explanation: "Real organisations rarely ask you to update payment details through random shortened links." },
  { id: "sms_payment", name: "SMALL PAYMENT TRICK", explanation: "Scammers use tiny fees like $1.99 to make the request feel harmless — but they want your card details." },
  { id: "sms_card", name: "CARD DETAILS REQUEST", explanation: "Never enter card details on a page reached through an SMS link. Use the official website directly." },
];

const EMAIL_FLAGS: DrillFlag[] = [
  { id: "email_domain", name: "SUSPICIOUS DOMAIN", explanation: "The sender domain 'campus-secure.example' is not an official institution address. Always verify the full email." },
  { id: "email_reward", name: "TOO GOOD TO BE TRUE", explanation: "Unexpected cash rewards are a classic lure. Legitimate programmes do not contact you out of the blue." },
  { id: "email_urgency", name: "FAKE URGENCY", explanation: "Scammers create time pressure — '30 minutes only' — so you act before checking if it is real." },
  { id: "email_verify", name: "CREDENTIAL THEFT", explanation: "'Verify your account' often leads to fake login pages designed to steal your password and ID." },
  { id: "email_attachment", name: "DANGEROUS ATTACHMENT", explanation: "ZIP files can hide malware, ransomware, or fake forms. Never open unexpected attachments." },
  { id: "email_threat", name: "THREAT LANGUAGE", explanation: "Warnings like 'reward will be reassigned' are designed to scare you into acting without thinking." },
];

const FLAG_MAP: Record<string, DrillFlag> = Object.fromEntries(
  [...RED_FLAGS, ...SMS_FLAGS, ...EMAIL_FLAGS].map((f) => [f.id, f])
);

// ─────────────────────────────────────────────────────────────────────────
// LEADERBOARD DATA
// ─────────────────────────────────────────────────────────────────────────
const HALL_OF_FAME = [
  { rank: 1, name: "PIXEL_HERO", score: 9842, wins: 98, area: "Downtown" },
  { rank: 2, name: "SCAM_BSTR", score: 8710, wins: 87, area: "Midtown" },
  { rank: 3, name: "SAFE_KING", score: 7355, wins: 73, area: "Uptown" },
  { rank: 4, name: "SHIELD_UP", score: 6201, wins: 62, area: "Eastside" },
  { rank: 5, name: "NO_SCAM_4U", score: 5988, wins: 59, area: "Westside" },
  { rank: 6, name: "DEFENDER1", score: 4422, wins: 44, area: "Southside" },
  { rank: 7, name: "IRONWALL", score: 3981, wins: 39, area: "Northside" },
  { rank: 8, name: "GUARDIAN7", score: 3100, wins: 31, area: "Downtown" },
];

const HALL_OF_SHAME = [
  { rank: 1, name: "GULLIBLE_G", scammed: 47, loss: 12400, area: "Westside" },
  { rank: 2, name: "EASY_MARK", scammed: 38, loss: 9800, area: "Uptown" },
  { rank: 3, name: "CLK_ANYTHING", scammed: 31, loss: 7200, area: "Midtown" },
  { rank: 4, name: "OOPS_IDIDIT", scammed: 24, loss: 4100, area: "Eastside" },
  { rank: 5, name: "NOTSCAMPROOF", scammed: 18, loss: 3300, area: "Downtown" },
  { rank: 6, name: "TRYHRDR_NXT", scammed: 12, loss: 2100, area: "Southside" },
  { rank: 7, name: "DEFENDER1", scammed: 7, loss: 900, area: "Southside" },
  { rank: 8, name: "PLAYER_001", scammed: 3, loss: 400, area: "Downtown" },
];

// ─────────────────────────────────────────────────────────────────────────
// FLAG TOOLTIP (shared by all drill types)
// ─────────────────────────────────────────────────────────────────────────
function FlagTooltip({ flag, onClose }: { flag: DrillFlag; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: "rgba(10,14,26,0.95)",
        borderTop: "3px solid #ff2d55",
        padding: "12px 16px 16px",
        backdropFilter: "blur(4px)",
        animation: "slideUp 0.15s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <IconWarning size={16} color="#ff2d55" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ff2d55", marginBottom: 6, letterSpacing: 1 }}>
            {flag.name}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#e8f4f8", lineHeight: 1.5 }}>
            {flag.explanation}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 4 }}>
          <IconX size={12} color="#6b8ba4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ANNOTATED MESSAGE (shared by call, SMS, email)
// ─────────────────────────────────────────────────────────────────────────
type Highlight = { phrase: string; flagId: string };

function AnnotatedMessage({
  text,
  highlights = [],
  onFlagTap,
}: {
  text: string;
  highlights?: Highlight[];
  onFlagTap: (flagId: string) => void;
}) {
  if (highlights.length === 0) return <>{text}</>;
  const sorted = [...highlights].sort((a, b) => text.indexOf(a.phrase) - text.indexOf(b.phrase));
  const segments: { text: string; flagId?: string }[] = [];
  let cursor = 0;
  for (const h of sorted) {
    const idx = text.indexOf(h.phrase, cursor);
    if (idx === -1) continue;
    if (idx > cursor) segments.push({ text: text.slice(cursor, idx) });
    segments.push({ text: h.phrase, flagId: h.flagId });
    cursor = idx + h.phrase.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return (
    <>
      {segments.map((seg, i) =>
        seg.flagId ? (
          <span
            key={i}
            onClick={(e) => { e.stopPropagation(); onFlagTap(seg.flagId!); }}
            style={{
              color: "#ff2d55",
              backgroundColor: "rgba(255,45,85,0.18)",
              borderBottom: "2px solid #ff2d55",
              cursor: "pointer",
              padding: "0 2px",
              fontWeight: "bold",
            }}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 1: TITLE
// ─────────────────────────────────────────────────────────────────────────
function TitleScreen({ onNext }: { onNext: () => void }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-between h-full px-6 py-10 overflow-hidden">
      <Stars />
      <div className="relative z-10 flex flex-col items-center gap-2 mt-8">
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 28,
            color: "#00ff88",
            textShadow: glitch
              ? "4px 0 #ff2d55, -4px 0 #4ecdc4"
              : "4px 4px 0 #006633, 0 0 20px rgba(0,255,136,0.5)",
            letterSpacing: 2,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          DRILL<br />MODE
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#4ecdc4", letterSpacing: 3, marginTop: 4 }}>
          SCAM FIGHTER
        </div>
        <div className="flex gap-2 mt-2">
          {["#ff6b35", "#ffe66d", "#00ff88", "#4ecdc4", "#ff2d55"].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, backgroundColor: c }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <PixelMascot size={128} animate />
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: "#ffe66d", textAlign: "center" }}>
          DEFEND YOUR MIND.<br />DEFEAT THE SCAMMERS.
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 mb-4">
        <Blink ms={700}>
          <PixelBtn onClick={onNext} color="#00ff88" size="lg">[ PRESS START ]</PixelBtn>
        </Blink>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#2a3a5c" }}>
          v2.0.0 © 2024 DRILL MODE
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: DRILL SELECT
// ─────────────────────────────────────────────────────────────────────────
function DrillSelectScreen({
  onCall, onSms, onEmail, onBack,
}: {
  onCall: () => void; onSms: () => void; onEmail: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center justify-between px-4" style={{ borderBottom: "4px solid #2a3a5c", backgroundColor: "#0a0e1a", minHeight: 56, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>{"< BACK"}</div>
        </button>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#00ff88" }}>CHOOSE DRILL</div>
        <div style={{ width: 40 }} />
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 flex-1">
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: "#6b8ba4", textAlign: "center", lineHeight: 1.4 }}>
          Train against different scam attacks.
        </div>

        {/* Call Drill Card */}
        <div style={{ backgroundColor: "#111827", border: "4px solid #ff6b35", boxShadow: "4px 4px 0 #ff6b35", padding: "20px 16px" }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ filter: "drop-shadow(0 0 6px rgba(255,107,53,0.8))" }}>
              <IconPhone size={28} color="#ff6b35" />
            </div>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ff6b35" }}>PHONE CALL</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#2a3a5c", marginTop: 3 }}>CLASSIC SCAM DRILL</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#6b8ba4", marginBottom: 14, lineHeight: 1.5 }}>
            Listen carefully. Hang up before it is too late.
          </div>
          <PixelBtn onClick={onCall} color="#ff6b35" textColor="#0a0e1a" size="md" full>START CALL DRILL</PixelBtn>
        </div>

        {/* SMS Drill Card */}
        <div style={{ backgroundColor: "#111827", border: "4px solid #4ecdc4", boxShadow: "4px 4px 0 #4ecdc4", padding: "20px 16px" }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ filter: "drop-shadow(0 0 6px rgba(78,205,196,0.8))" }}>
              <IconChatBubble size={28} color="#4ecdc4" />
            </div>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#4ecdc4" }}>SMS MESSAGE</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#2a3a5c", marginTop: 3 }}>PARCEL SCAM</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#6b8ba4", marginBottom: 14, lineHeight: 1.5 }}>
            Spot suspicious links and fake urgency.
          </div>
          <PixelBtn onClick={onSms} color="#4ecdc4" textColor="#0a0e1a" size="md" full>START SMS DRILL</PixelBtn>
        </div>

        {/* Email Drill Card */}
        <div style={{ backgroundColor: "#111827", border: "4px solid #c77dff", boxShadow: "4px 4px 0 #c77dff", padding: "20px 16px" }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ filter: "drop-shadow(0 0 6px rgba(199,125,255,0.8))" }}>
              <IconEnvelope size={28} color="#c77dff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#c77dff" }}>EMAIL TRAP</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#2a3a5c", marginTop: 3 }}>PHISHING DRILL</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#6b8ba4", marginBottom: 14, lineHeight: 1.5 }}>
            Inspect the email before clicking.
          </div>
          <PixelBtn onClick={onEmail} color="#c77dff" textColor="#0a0e1a" size="md" full>START EMAIL DRILL</PixelBtn>
        </div>

        <PixelBtn onClick={onBack} color="#1a2340" textColor="#6b8ba4" size="sm" full>BACK HOME</PixelBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FAMILY HOME
// ─────────────────────────────────────────────────────────────────────────
type FamilyMember = {
  id: string; name: string; role: string;
  level: number; xp: number; xpMax: number;
  streak: number; timesSafe: number; timesScammed: number;
  safeThisWeek: boolean; recentDrillResult: "WON" | "LOST" | null;
  primaryColor: string; roomName: string; roomBg: string;
  badgeCount: number; badgeTotal: number;
};

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "grandma", name: "GRANDMA", role: "ELDER GUARDIAN", level: 12, xp: 3800, xpMax: 4000, streak: 24, timesSafe: 89, timesScammed: 1, safeThisWeek: true, recentDrillResult: "WON", primaryColor: "#c77dff", roomName: "GRANDMA'S ROOM", roomBg: "#100c20", badgeCount: 7, badgeTotal: 9 },
  { id: "mum", name: "MUM", role: "SHIELD BEARER", level: 9, xp: 2100, xpMax: 2500, streak: 16, timesSafe: 67, timesScammed: 2, safeThisWeek: true, recentDrillResult: "WON", primaryColor: "#00ff88", roomName: "MUM'S ROOM", roomBg: "#0c1a10", badgeCount: 5, badgeTotal: 9 },
  { id: "dad", name: "DAD", role: "ROOKIE", level: 4, xp: 890, xpMax: 1200, streak: 0, timesSafe: 23, timesScammed: 7, safeThisWeek: false, recentDrillResult: "LOST", primaryColor: "#4ecdc4", roomName: "DAD'S ROOM", roomBg: "#081420", badgeCount: 2, badgeTotal: 9 },
  { id: "kid", name: "KID", role: "TRAINEE", level: 3, xp: 450, xpMax: 800, streak: 5, timesSafe: 12, timesScammed: 3, safeThisWeek: true, recentDrillResult: "WON", primaryColor: "#ffe66d", roomName: "KID'S ROOM", roomBg: "#161408", badgeCount: 3, badgeTotal: 9 },
];

function useIdleFrame(fps = 2): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % 4), Math.floor(1000 / fps));
    return () => clearInterval(t);
  }, [fps]);
  return frame;
}

function CharGrandma({ size = 48, frame = 0 }: { size?: number; frame?: number }) {
  const u = size / 12;
  const yo = (frame === 1 || frame === 3) ? u * 0.5 : 0;
  const xo = (frame === 1 || frame === 2) ? u * 0.3 : -(u * 0.3);
  const H = size * 1.5;
  const r = (x: number, y: number, w: number, h: number, c: string, ox = 0, oy = 0) =>
    <rect key={`${x}${y}${c}`} x={(x + ox) * u} y={(y + oy) * u} width={w * u} height={h * u} fill={c} />;
  return (
    <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} style={{ imageRendering: "pixelated", overflow: "visible" }}>
      {r(4, 0, 4, 1, "#e0e0e0", xo, yo)}{r(3, 1, 6, 1, "#e0e0e0", xo, yo)}
      {r(3, 2, 6, 4, "#f4b880", xo, yo)}{r(2, 3, 8, 2, "#f4b880", xo, yo)}
      {r(4, 3, 1, 1, "#0a0e1a", xo, yo)}{r(7, 3, 1, 1, "#0a0e1a", xo, yo)}
      {r(4, 5, 1, 1, "#c8704a", xo, yo)}{r(5, 6, 2, 1, "#c8704a", xo, yo)}{r(7, 5, 1, 1, "#c8704a", xo, yo)}
      <rect x={(3 + xo) * u} y={(3 + yo) * u} width={2 * u} height={2 * u} fill="none" stroke="#2a3a5c" strokeWidth={u * 0.4} key="gl1" />
      <rect x={(7 + xo) * u} y={(3 + yo) * u} width={2 * u} height={2 * u} fill="none" stroke="#2a3a5c" strokeWidth={u * 0.4} key="gl2" />
      {r(3, 7, 6, 1, "#c77dff", xo, yo)}
      {r(2, 8, 8, 5, "#9b4dca", xo, yo)}{r(3, 8, 6, 5, "#c77dff", xo, yo)}
      {r(1, 11, 10, 3, "#9b4dca", xo, yo)}{r(2, 11, 8, 3, "#c77dff", xo, yo)}
      {r(1, 8, 2, 3, "#f4b880", xo, yo)}{r(9, 8, 2, 3, "#f4b880", xo, yo)}
      {r(10, 9, 1, 8, "#8b5e3c")}{r(9, 16, 3, 1, "#8b5e3c")}
      {r(4, 14, 2, 3, "#7a3a9a", xo, yo)}{r(7, 14, 2, 3, "#7a3a9a", xo, yo)}
      {r(3, 16, 3, 1, "#5a2a7a", xo, yo)}{r(6, 16, 3, 1, "#5a2a7a", xo, yo)}
    </svg>
  );
}

function CharMum({ size = 48, frame = 0 }: { size?: number; frame?: number }) {
  const u = size / 12;
  const yo = (frame === 1 || frame === 3) ? -u * 0.8 : 0;
  const H = size * 1.5;
  const r = (x: number, y: number, w: number, h: number, c: string) =>
    <rect key={`${x}${y}${c}`} x={x * u} y={(y * u) + yo} width={w * u} height={h * u} fill={c} />;
  return (
    <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} style={{ imageRendering: "pixelated", overflow: "visible" }}>
      {r(5, 0, 2, 1, "#3a2a1a")}{r(4, 1, 4, 1, "#3a2a1a")}
      {r(2, 3, 2, 3, "#3a2a1a")}{r(8, 3, 2, 3, "#3a2a1a")}
      {r(3, 2, 6, 5, "#f4b880")}{r(2, 3, 8, 3, "#f4b880")}
      {r(4, 4, 1, 1, "#0a0e1a")}{r(7, 4, 1, 1, "#0a0e1a")}
      {r(4, 6, 4, 1, "#c8704a")}{r(5, 7, 2, 1, "#c8704a")}
      {r(5, 7, 2, 1, "#f4b880")}
      {r(2, 8, 8, 4, "#006633")}{r(3, 8, 6, 4, "#00ff88")}
      {r(1, 8, 2, 4, "#f4b880")}{r(9, 8, 2, 4, "#f4b880")}
      {r(4, 9, 4, 2, "#00cc66")}
      {r(3, 12, 6, 3, "#1a3a2a")}
      {r(3, 15, 2, 2, "#1a3a2a")}{r(7, 15, 2, 2, "#1a3a2a")}
      {r(2, 16, 3, 1, "#0a1a12")}{r(6, 16, 3, 1, "#0a1a12")}
    </svg>
  );
}

function CharDad({ size = 52, frame = 0 }: { size?: number; frame?: number }) {
  const u = size / 12;
  const xo = frame < 2 ? u * 1 : -u * 1;
  const H = size * 1.55;
  const r = (x: number, y: number, w: number, h: number, c: string) =>
    <rect key={`${x}${y}${c}`} x={(x + xo) * u} y={y * u} width={w * u} height={h * u} fill={c} />;
  return (
    <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} style={{ imageRendering: "pixelated", overflow: "visible" }}>
      {r(3, 0, 6, 2, "#2a1a0a")}{r(2, 1, 8, 2, "#2a1a0a")}
      {r(2, 2, 8, 6, "#e8a060")}{r(1, 3, 10, 4, "#e8a060")}
      {r(3, 4, 2, 1, "#0a0e1a")}{r(7, 4, 2, 1, "#0a0e1a")}
      {r(2, 7, 8, 1, "#b06030")}
      {r(1, 8, 10, 5, "#1a4040")}{r(2, 8, 8, 5, "#4ecdc4")}
      {r(4, 8, 4, 1, "#ffffff")}
      {r(0, 8, 2, 5, "#e8a060")}{r(10, 8, 2, 5, "#e8a060")}
      {r(2, 13, 8, 1, "#0a0e1a")}
      {r(2, 14, 8, 3, "#2a3a4a")}
      {r(2, 16, 3, 1, "#2a3a4a")}{r(7, 16, 3, 1, "#2a3a4a")}
      {r(1, 17, 4, 1, "#1a2030")}{r(6, 17, 4, 1, "#1a2030")}
    </svg>
  );
}

function CharKid({ size = 40, frame = 0 }: { size?: number; frame?: number }) {
  const u = size / 10;
  const yo = (frame === 0 || frame === 2) ? -u * 1.2 : u * 0.4;
  const H = size * 1.6;
  const r = (x: number, y: number, w: number, h: number, c: string) =>
    <rect key={`${x}${y}${c}`} x={x * u} y={(y * u) + yo} width={w * u} height={h * u} fill={c} />;
  return (
    <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} style={{ imageRendering: "pixelated", overflow: "visible" }}>
      {r(2, 0, 1, 3, "#b8900a")}{r(4, 0, 1, 2, "#b8900a")}{r(6, 0, 1, 3, "#b8900a")}{r(8, 0, 1, 2, "#b8900a")}
      {r(1, 1, 8, 2, "#ffe66d")}
      {r(2, 2, 6, 5, "#f4c060")}{r(1, 3, 8, 3, "#f4c060")}
      {r(3, 4, 1, 2, "#0a0e1a")}{r(6, 4, 1, 2, "#0a0e1a")}
      {r(3, 4, 1, 1, "#ffffff")}{r(6, 4, 1, 1, "#ffffff")}
      {r(3, 6, 4, 1, "#c8704a")}{r(3, 7, 1, 1, "#c8704a")}{r(6, 7, 1, 1, "#c8704a")}
      {r(2, 7, 6, 4, "#aa9900")}{r(1, 8, 8, 3, "#ffe66d")}
      {r(4, 9, 2, 1, "#aa9900")}{r(3, 10, 4, 1, "#aa9900")}
      {r(0, 8, 2, 3, "#f4c060")}{r(8, 8, 2, 3, "#f4c060")}
      {r(2, 11, 6, 2, "#2a4aa4")}
      {r(2, 13, 2, 3, "#f4c060")}{r(6, 13, 2, 3, "#f4c060")}
      {r(1, 15, 3, 1, "#ffffff")}{r(5, 15, 3, 1, "#ffffff")}
      {r(1, 16, 4, 1, "#ff2d55")}{r(5, 16, 4, 1, "#ff2d55")}
    </svg>
  );
}

function FamilyChar({ id, size, frame }: { id: string; size?: number; frame?: number }) {
  if (id === "grandma") return <CharGrandma size={size} frame={frame} />;
  if (id === "mum") return <CharMum size={size} frame={frame} />;
  if (id === "dad") return <CharDad size={size} frame={frame} />;
  return <CharKid size={size} frame={frame} />;
}

function SafetyBadge({ safe, size = 20 }: { safe: boolean; size?: number }) {
  const color = safe ? "#00ff88" : "#ff2d55";
  const glow = safe ? "0 0 8px rgba(0,255,136,0.8)" : "0 0 8px rgba(255,45,85,0.8)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ filter: `drop-shadow(${glow})` }}>
        <IconShield size={size} color={color} />
      </div>
      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 4, color, letterSpacing: 0.5 }}>
        {safe ? "SAFE" : "SCAMMED"}
      </div>
    </div>
  );
}

function FurnitureGrandma() {
  return (
    <>
      <svg width={52} height={44} viewBox="0 0 13 11" style={{ imageRendering: "pixelated" }}>
        <rect x={0} y={4} width={13} height={2} fill="#5a2a7a" />
        <rect x={1} y={3} width={11} height={5} fill="#7a3a9a" />
        <rect x={2} y={5} width={9} height={4} fill="#9b4dca" />
        <rect x={0} y={3} width={2} height={8} fill="#5a2a7a" />
        <rect x={11} y={3} width={2} height={8} fill="#5a2a7a" />
        <rect x={2} y={9} width={3} height={2} fill="#3a1a5a" />
        <rect x={8} y={9} width={3} height={2} fill="#3a1a5a" />
      </svg>
      <svg width={44} height={56} viewBox="0 0 11 14" style={{ imageRendering: "pixelated" }}>
        <rect x={0} y={0} width={11} height={14} fill="#3a2a1a" />
        <rect x={1} y={1} width={9} height={2} fill="#c77dff" opacity={0.7} />
        <rect x={1} y={4} width={9} height={2} fill="#ffe66d" opacity={0.7} />
        <rect x={1} y={7} width={9} height={2} fill="#4ecdc4" opacity={0.7} />
        <rect x={1} y={10} width={9} height={2} fill="#ff6b35" opacity={0.7} />
      </svg>
    </>
  );
}

function FurnitureMum() {
  return (
    <>
      <svg width={28} height={44} viewBox="0 0 7 11" style={{ imageRendering: "pixelated" }}>
        <rect x={2} y={0} width={3} height={1} fill="#00ff88" />
        <rect x={1} y={1} width={5} height={1} fill="#00ff88" />
        <rect x={0} y={2} width={7} height={2} fill="#00cc66" />
        <rect x={2} y={5} width={3} height={1} fill="#8b5e3c" />
        <rect x={1} y={6} width={5} height={3} fill="#4a2a1a" />
        <rect x={2} y={9} width={3} height={2} fill="#4a2a1a" />
      </svg>
      <svg width={56} height={44} viewBox="0 0 14 11" style={{ imageRendering: "pixelated" }}>
        <rect x={0} y={4} width={14} height={2} fill="#2a3a2a" />
        <rect x={1} y={6} width={12} height={1} fill="#3a4a3a" />
        <rect x={1} y={7} width={2} height={4} fill="#1a2a1a" />
        <rect x={11} y={7} width={2} height={4} fill="#1a2a1a" />
        <rect x={4} y={0} width={7} height={5} fill="#0a0e1a" />
        <rect x={5} y={1} width={5} height={3} fill="#4ecdc4" opacity={0.3} />
        <rect x={6} y={2} width={3} height={1} fill="#00ff88" opacity={0.6} />
      </svg>
    </>
  );
}

function FurnitureDad() {
  return (
    <>
      <svg width={52} height={52} viewBox="0 0 13 13" style={{ imageRendering: "pixelated" }}>
        <rect x={1} y={0} width={11} height={7} fill="#0a0e1a" />
        <rect x={2} y={1} width={9} height={5} fill="#1a2340" />
        <rect x={3} y={2} width={3} height={2} fill="#4ecdc4" opacity={0.4} />
        <rect x={7} y={2} width={3} height={1} fill="#ff2d55" opacity={0.6} />
        <rect x={5} y={7} width={3} height={1} fill="#2a3a5c" />
        <rect x={2} y={8} width={9} height={2} fill="#2a3a5c" />
      </svg>
      <svg width={56} height={44} viewBox="0 0 14 11" style={{ imageRendering: "pixelated" }}>
        <rect x={0} y={3} width={14} height={2} fill="#1a2a3a" />
        <rect x={1} y={4} width={12} height={5} fill="#2a3a4a" />
        <rect x={2} y={5} width={10} height={4} fill="#3a4a5a" />
        <rect x={0} y={3} width={2} height={8} fill="#1a2a3a" />
        <rect x={12} y={3} width={2} height={8} fill="#1a2a3a" />
      </svg>
    </>
  );
}

function FurnitureKid() {
  return (
    <>
      <svg width={48} height={44} viewBox="0 0 12 11" style={{ imageRendering: "pixelated" }}>
        <rect x={0} y={2} width={12} height={2} fill="#ffe66d" />
        <rect x={0} y={4} width={12} height={5} fill="#2a4aa4" />
        <rect x={1} y={5} width={10} height={3} fill="#3a5ab4" />
        <rect x={0} y={9} width={12} height={2} fill="#1a2a7a" />
        <rect x={1} y={2} width={4} height={3} fill="#ffffff" opacity={0.8} />
      </svg>
      <svg width={36} height={32} viewBox="0 0 9 8" style={{ imageRendering: "pixelated" }}>
        <rect x={0} y={1} width={9} height={7} fill="#aa7700" />
        <rect x={1} y={2} width={7} height={5} fill="#cc9900" />
        <rect x={0} y={0} width={9} height={2} fill="#ffe66d" />
        <rect x={3} y={0} width={3} height={2} fill="#ff6b35" />
        <rect x={2} y={3} width={2} height={2} fill="#ff2d55" opacity={0.7} />
        <rect x={5} y={3} width={2} height={2} fill="#00ff88" opacity={0.7} />
      </svg>
    </>
  );
}

function DollhouseRoom({ member, onTap }: { member: FamilyMember; onTap: (m: FamilyMember) => void }) {
  const frame = useIdleFrame(member.id === "kid" ? 3 : 2);
  const charSize = member.id === "dad" ? 48 : member.id === "kid" ? 36 : 44;
  return (
    <button onClick={() => onTap(member)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "0", cursor: "pointer" }}>
      <div style={{ backgroundColor: member.roomBg, borderBottom: "4px solid #2a3a5c", position: "relative", height: 168, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 15px,rgba(255,255,255,0.015) 15px,rgba(255,255,255,0.015) 16px),repeating-linear-gradient(90deg,transparent,transparent 15px,rgba(255,255,255,0.015) 15px,rgba(255,255,255,0.015) 16px)` }} />
        <div style={{ position: "absolute", top: 10, right: 16 }}>
          <svg width={28} height={32} viewBox="0 0 7 8" style={{ imageRendering: "pixelated" }}>
            <rect x={0} y={0} width={7} height={8} fill="#2a3a5c" />
            <rect x={1} y={1} width={2} height={3} fill={member.primaryColor} opacity={0.12} />
            <rect x={4} y={1} width={2} height={3} fill={member.primaryColor} opacity={0.08} />
            <rect x={1} y={5} width={2} height={2} fill="#1a2a4a" />
            <rect x={4} y={5} width={2} height={2} fill="#1a2a4a" />
          </svg>
        </div>
        <div style={{ position: "absolute", top: 10, left: 12, fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: member.primaryColor, opacity: 0.8 }}>
          {member.roomName}
        </div>
        <div style={{ position: "absolute", top: 24, left: 12, fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: "#6b8ba4" }}>
          LVL {member.level}
        </div>
        <div style={{ position: "absolute", left: 8, bottom: 12, display: "flex", alignItems: "flex-end", gap: 4 }}>
          {member.id === "grandma" && <FurnitureGrandma />}
          {member.id === "mum" && <FurnitureMum />}
          {member.id === "dad" && <FurnitureDad />}
          {member.id === "kid" && <FurnitureKid />}
        </div>
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <SafetyBadge safe={member.safeThisWeek} size={18} />
          <FamilyChar id={member.id} size={charSize} frame={frame} />
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: member.primaryColor }}>{member.name}</div>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 12, fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: "#2a3a5c", lineHeight: 1.8 }}>
          TAP{"\n"}TO{"\n"}VIEW
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${member.primaryColor}22,${member.primaryColor}55,${member.primaryColor}22)`, borderTop: `2px solid ${member.primaryColor}44` }} />
      </div>
    </button>
  );
}

function HouseRoof() {
  return (
    <div style={{ position: "relative", height: 48, backgroundColor: "#0a0e1a", borderBottom: "4px solid #2a3a5c", overflow: "hidden" }}>
      <svg width="100%" height={48} viewBox="0 0 390 48" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, imageRendering: "pixelated" }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <rect key={i} x={i * 16} y={48 - ((12 - i) * 4)} width={(390 - i * 32)} height={(12 - i) * 4} fill="#1a2a3a" opacity={0.9} />
        ))}
        <polyline points="0,48 195,4 390,48" fill="none" stroke="#2a3a5c" strokeWidth={3} />
        <rect x={280} y={10} width={20} height={24} fill="#2a3a5c" />
        <rect x={278} y={8} width={24} height={6} fill="#3a4a6c" />
        <rect x={283} y={2} width={4} height={4} fill="#4a5a7c" opacity={0.5} />
      </svg>
      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: "#4ecdc4", letterSpacing: 2, whiteSpace: "nowrap" }}>
        FAMILY HOME
      </div>
    </div>
  );
}

function FamilySafetyBar() {
  const safeCount = FAMILY_MEMBERS.filter((m) => m.safeThisWeek).length;
  const allSafe = safeCount === FAMILY_MEMBERS.length;
  return (
    <div style={{ backgroundColor: "#111827", borderBottom: "4px solid #2a3a5c", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ filter: `drop-shadow(0 0 6px ${allSafe ? "#00ff88" : "#ff6b35"})`, flexShrink: 0 }}>
        <IconShield size={32} color={allSafe ? "#00ff88" : "#ff6b35"} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 7, color: allSafe ? "#00ff88" : "#ff6b35", marginBottom: 4 }}>FAMILY SAFETY</div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#6b8ba4", lineHeight: 1.4 }}>
          {safeCount}/{FAMILY_MEMBERS.length} members safe this week
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {FAMILY_MEMBERS.map((m) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ filter: `drop-shadow(0 0 3px ${m.safeThisWeek ? "#00ff88" : "#ff2d55"})` }}>
                <IconShield size={10} color={m.safeThisWeek ? "#00ff88" : "#ff2d55"} />
              </div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 4, color: "#6b8ba4" }}>{m.name.slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ backgroundColor: "#0a0e1a", border: "3px solid #2a3a5c", padding: "6px 10px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: "#ffe66d" }}>{safeCount * 25}%</div>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 4, color: "#6b8ba4" }}>SAFE</div>
      </div>
    </div>
  );
}

function MemberProfileOverlay({
  member, onClose, onDrillSelect,
}: { member: FamilyMember; onClose: () => void; onDrillSelect: () => void }) {
  const frame = useIdleFrame(member.id === "kid" ? 3 : 2);
  const charSize = member.id === "dad" ? 64 : member.id === "kid" ? 52 : 56;
  const badges = Array.from({ length: member.badgeTotal }, (_, i) => ({
    unlocked: i < member.badgeCount,
    color: ["#00ff88", "#ff6b35", "#4ecdc4", "#ffe66d", "#ff2d55", "#c77dff", "#4ecdc4", "#ff6b35", "#6b8ba4"][i],
  }));
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#0a0e1a", border: `4px solid ${member.primaryColor}`, boxShadow: `0 -6px 0 ${member.primaryColor}66`, maxHeight: "82%", overflowY: "auto", scrollbarWidth: "none", animation: "slideUp 0.2s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 40, height: 4, backgroundColor: "#2a3a5c" }} />
        </div>
        <div style={{ padding: "0 16px 12px", borderBottom: `3px solid ${member.primaryColor}33`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ filter: `drop-shadow(0 0 8px ${member.primaryColor})` }}>
            <FamilyChar id={member.id} size={charSize} frame={frame} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: member.primaryColor }}>{member.name}</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: "#6b8ba4", marginTop: 4 }}>{member.role}</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: "#e8f4f8", marginTop: 6 }}>LVL {member.level}</div>
            <div style={{ marginTop: 6 }}>
              <XPBar current={member.xp} max={member.xpMax} color={member.primaryColor} />
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: "#6b8ba4", marginTop: 3 }}>
                {member.xp.toLocaleString()} / {member.xpMax.toLocaleString()} XP
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", padding: 4 }}>
            <IconX size={16} color="#6b8ba4" />
          </button>
        </div>
        <div style={{ margin: "12px 16px 0", padding: "10px 12px", backgroundColor: member.safeThisWeek ? "rgba(0,255,136,0.06)" : "rgba(255,45,85,0.06)", border: `3px solid ${member.safeThisWeek ? "#00ff88" : "#ff2d55"}`, display: "flex", alignItems: "center", gap: 10 }}>
          <IconShield size={20} color={member.safeThisWeek ? "#00ff88" : "#ff2d55"} />
          <div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 7, color: member.safeThisWeek ? "#00ff88" : "#ff2d55" }}>
              {member.safeThisWeek ? "SAFE THIS WEEK" : "SCAMMED THIS WEEK"}
            </div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: "#6b8ba4", marginTop: 3 }}>
              Last drill: {member.recentDrillResult ?? "—"}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "12px 16px 0" }}>
          {[
            { label: "STREAK", val: member.streak === 0 ? "BROKEN" : `${member.streak}`, color: member.streak > 0 ? "#ff6b35" : "#ff2d55", icon: <IconFlame size={12} color={member.streak > 0 ? "#ff6b35" : "#ff2d55"} /> },
            { label: "SAFE", val: `${member.timesSafe}`, color: "#00ff88", icon: <IconShield size={12} color="#00ff88" /> },
            { label: "SCAMMED", val: `${member.timesScammed}`, color: "#ff2d55", icon: <IconSkull size={12} color="#ff2d55" /> },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "#111827", border: "3px solid #2a3a5c", padding: "10px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                {s.icon}
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 4, color: "#6b8ba4" }}>{s.label}</div>
              </div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ margin: "12px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <IconBadge size={12} color="#ffe66d" />
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: "#ffe66d" }}>BADGES — {member.badgeCount}/{member.badgeTotal}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {badges.map((b, i) => (
              <div key={i} style={{ width: 32, height: 32, backgroundColor: b.unlocked ? "#111827" : "#0a0e1a", border: `2px solid ${b.unlocked ? b.color : "#1a2340"}`, boxShadow: b.unlocked ? `2px 2px 0 ${b.color}` : "none", opacity: b.unlocked ? 1 : 0.35, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {b.unlocked ? <IconBadge size={20} color={b.color} /> : <IconLock size={12} color="#2a3a5c" />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 16px 8px" }}>
          <PixelBtn
            onClick={() => { onClose(); onDrillSelect(); }}
            color={member.primaryColor}
            textColor={["#ffe66d", "#00ff88"].includes(member.primaryColor) ? "#0a0e1a" : "#ffffff"}
            size="lg" full
          >
            [ TRAIN {member.name} ]
          </PixelBtn>
        </div>
        <div style={{ padding: "0 16px 20px", fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: "#6b8ba4", textAlign: "center" }}>
          Choose call, SMS, or email scam training.
        </div>
      </div>
    </div>
  );
}

function FamilyHomeScreen({ onDrillSelect }: { onDrillSelect: () => void }) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "0 16px", minHeight: 52, backgroundColor: "#0a0e1a", borderBottom: "4px solid #2a3a5c", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: "#00ff88" }}>DRILL MODE</div>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: "#2a3a5c" }}>FAMILY HOME</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <div style={{ height: 6, background: "linear-gradient(90deg,#2a3a5c,#3a4a6c,#2a3a5c)" }} />
        <FamilySafetyBar />
        <HouseRoof />
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, backgroundColor: "#2a3a5c", backgroundImage: "repeating-linear-gradient(0deg,#1a2a3c,#1a2a3c 4px,#2a3a5c 4px,#2a3a5c 8px)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, backgroundColor: "#2a3a5c", backgroundImage: "repeating-linear-gradient(0deg,#1a2a3c,#1a2a3c 4px,#2a3a5c 4px,#2a3a5c 8px)" }} />
          {FAMILY_MEMBERS.map((member) => (
            <DollhouseRoom key={member.id} member={member} onTap={setSelectedMember} />
          ))}
        </div>
        <div style={{ height: 24, backgroundColor: "#1a2340", borderTop: "4px solid #2a3a5c", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: "#2a3a5c", letterSpacing: 3 }}>████████████████████████████</div>
        </div>
        <div style={{ padding: "16px 16px 8px", backgroundColor: "#0a0e1a" }}>
          <PixelBtn onClick={onDrillSelect} color="#00ff88" size="lg" full>[ START FAMILY DRILL ]</PixelBtn>
        </div>
        <div style={{ padding: "0 16px 24px", backgroundColor: "#0a0e1a", fontFamily: "'Press Start 2P',monospace", fontSize: 5, color: "#6b8ba4", textAlign: "center" }}>
          Pick a scam type for the whole family.
        </div>
      </div>
      {selectedMember && (
        <MemberProfileOverlay
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onDrillSelect={onDrillSelect}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: INCOMING CALL
// ─────────────────────────────────────────────────────────────────────────
function IncomingCallScreen({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-between h-full px-6 py-12" style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #0d1526 50%, #0a0e1a 100%)" }}>
      <div className="flex flex-col items-center gap-2">
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#6b8ba4", letterSpacing: 2 }}>INCOMING CALL</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff6b35", border: "2px solid #ff6b35", padding: "4px 8px", backgroundColor: "rgba(255,107,53,0.1)", display: "flex", alignItems: "center", gap: 6 }}>
          <IconWarning size={12} color="#ff6b35" />
          UNKNOWN CALLER
        </div>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div style={{ opacity: pulse ? 1 : 0.6, transition: "opacity 0.4s" }}>
          <PixelPhone ringing />
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: "#ffffff", textAlign: "center" }}>
          +1 (???)<br />???-????
        </div>
        <Blink ms={900}>
          <div className="flex items-center gap-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff6b35" }}>
            <IconBell size={14} color="#ff6b35" />
            RINGING...
          </div>
        </Blink>
        <div style={{ backgroundColor: "rgba(255,45,85,0.1)", border: "3px solid #ff2d55", padding: "8px 12px", width: "100%" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#ff6b35", lineHeight: 1.5 }}>
            DRILL MODE ACTIVE — This is a simulated scam call. Can you hang tough?
          </div>
        </div>
      </div>
      <div className="flex gap-12 items-center">
        <div className="flex flex-col items-center gap-3">
          <button onClick={onDecline} onMouseDown={(e) => (e.currentTarget.style.transform = "translate(4px,4px)")} onMouseUp={(e) => (e.currentTarget.style.transform = "none")} style={{ width: 72, height: 72, backgroundColor: "#ff2d55", border: "4px solid #0a0e1a", boxShadow: "4px 4px 0 #0a0e1a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.05s" }}>
            <IconX size={32} color="#ffffff" />
          </button>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff2d55" }}>DECLINE</div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={onAccept} onMouseDown={(e) => (e.currentTarget.style.transform = "translate(4px,4px)")} onMouseUp={(e) => (e.currentTarget.style.transform = "none")} style={{ width: 72, height: 72, backgroundColor: "#00ff88", border: "4px solid #0a0e1a", boxShadow: "4px 4px 0 #0a0e1a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.05s" }}>
            <IconCheck size={32} color="#0a0e1a" />
          </button>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#00ff88" }}>ACCEPT</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: CALL
// ─────────────────────────────────────────────────────────────────────────
type ConvLine = { who: string; text: string; highlights?: Highlight[] };

const CONVERSATION: ConvLine[] = [
  { who: "caller", text: "Hello! This is David from the IRS Fraud Division.", highlights: [{ phrase: "IRS Fraud Division", flagId: "impersonation" }] },
  { who: "caller", text: "We detected suspicious activity on your tax account." },
  { who: "you", text: "Uh, okay. What kind of activity?" },
  { who: "caller", text: "You owe $2,400 in back taxes. You must pay immediately to avoid arrest.", highlights: [{ phrase: "avoid arrest", flagId: "arrest_threat" }] },
  { who: "you", text: "Arrest? That sounds scary..." },
  { who: "caller", text: "Yes. You need to pay with gift cards RIGHT NOW to clear this up.", highlights: [{ phrase: "pay with gift cards", flagId: "gift_card" }, { phrase: "RIGHT NOW", flagId: "urgency" }] },
  { who: "caller", text: "Buy $2,400 in iTunes gift cards and read me the numbers.", highlights: [{ phrase: "iTunes gift cards", flagId: "gift_card" }] },
  { who: "you", text: "Gift cards? That doesn't sound right..." },
  { who: "caller", text: "This is your FINAL warning. Officers are being dispatched to your address.", highlights: [{ phrase: "FINAL warning", flagId: "urgency" }, { phrase: "Officers are being dispatched", flagId: "escalation" }] },
];

function CallScreen({ onHangUp, onResult }: { onHangUp: (win: boolean) => void; onResult: (win: boolean) => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [callerSpeaking, setCallerSpeaking] = useState(true);
  const [activeFlag, setActiveFlag] = useState<DrillFlag | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleLines >= CONVERSATION.length) return;
    const delay = visibleLines === 0 ? 1000 : 2200;
    const t = setTimeout(() => {
      setVisibleLines((v) => v + 1);
      setCallerSpeaking(CONVERSATION[visibleLines]?.who === "caller");
    }, delay);
    return () => clearTimeout(t);
  }, [visibleLines]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleLines]);

  useEffect(() => {
    if (visibleLines >= CONVERSATION.length) {
      const t = setTimeout(() => onResult(false), 3000);
      return () => clearTimeout(t);
    }
  }, [visibleLines]);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  const handleFlagTap = (flagId: string) => {
    const flag = FLAG_MAP[flagId];
    if (!flag) return;
    setActiveFlag(activeFlag?.id === flagId ? null : flag);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: "#111827", borderBottom: "4px solid #2a3a5c" }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, backgroundColor: callerSpeaking ? "#ff6b35" : "#00ff88", animation: "pulse-dot 1s ease-in-out infinite" }} />
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: callerSpeaking ? "#ff6b35" : "#00ff88" }}>
            {callerSpeaking ? "CALLER SPEAKING" : "LISTENING..."}
          </div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffe66d" }}>{mins}:{secs}</div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "3px solid #1a2340" }}>
        <PixelPhone />
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffffff" }}>UNKNOWN CALLER</div>
          <div className="flex items-center gap-1 mt-1">
            <IconWarning size={10} color="#ff6b35" />
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff6b35" }}>SCAM DRILL ACTIVE</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }} onClick={() => setActiveFlag(null)}>
        <div ref={scrollRef} className="flex flex-col gap-3" style={{ height: "100%", overflowY: "auto", padding: "16px 16px 8px", scrollbarWidth: "none" }}>
          {CONVERSATION.slice(0, visibleLines).map((line, i) => {
            const hasFlags = (line.highlights?.length ?? 0) > 0;
            return (
              <div key={i} className={`flex ${line.who === "you" ? "justify-end" : "justify-start"}`}>
                {line.who === "caller" && <div className="mr-2 mt-1 flex-shrink-0"><PixelAvatar rank={9} size={24} /></div>}
                <div style={{ maxWidth: "72%", backgroundColor: line.who === "you" ? "#1a3a2a" : "#1a2340", border: `3px solid ${line.who === "you" ? "#00ff88" : hasFlags ? "#ff2d55" : "#ff6b35"}`, padding: "8px 10px", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: line.who === "you" ? "#00ff88" : "#e8f4f8", lineHeight: 1.6 }}>
                  <AnnotatedMessage text={line.text} highlights={line.highlights} onFlagTap={handleFlagTap} />
                  {hasFlags && line.who === "caller" && (
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <IconWarning size={9} color="#ff2d55" />
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55" }}>TAP RED TEXT</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {visibleLines < CONVERSATION.length && (
            <div className="flex justify-start">
              <div className="mr-2"><PixelAvatar rank={9} size={24} /></div>
              <div style={{ backgroundColor: "#1a2340", border: "3px solid #ff6b35", padding: "8px 14px" }}>
                <Blink ms={400}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ff6b35" }}>...</span></Blink>
              </div>
            </div>
          )}
        </div>
        {activeFlag && <FlagTooltip flag={activeFlag} onClose={() => setActiveFlag(null)} />}
      </div>
      <div className="px-4 py-4" style={{ borderTop: "4px solid #2a3a5c", backgroundColor: "#0a0e1a" }}>
        <PixelBtn onClick={() => onHangUp(true)} color="#ff2d55" textColor="#ffffff" size="lg" full>
          [ HANG UP — DEFEAT SCAMMER ]
        </PixelBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SMS SCREENS
// ─────────────────────────────────────────────────────────────────────────
const SMS_INBOX_ITEMS = [
  { id: "parcelgo", sender: "ParcelGo Alert", preview: "Your parcel is on hold. Pay $1.99 redelivery fee…", time: "NOW", isScam: true },
  { id: "grandma", sender: "Grandma", preview: "Dinner at 7?", time: "2h" },
  { id: "school", sender: "School Admin", preview: "Reminder: class starts at 9AM.", time: "9h" },
  { id: "cyber", sender: "Cyber Tips", preview: "Never share OTPs with anyone.", time: "1d" },
];

function SMSInboxScreen({ onOpenScam, onBack }: { onOpenScam: () => void; onBack: () => void }) {
  const [shaking, setShaking] = useState<string | null>(null);
  const [glowFrame, setGlowFrame] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setGlowFrame((f) => !f), 800);
    return () => clearInterval(t);
  }, []);

  const handleNonScam = (id: string) => {
    setShaking(id);
    setTimeout(() => setShaking(null), 600);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4" style={{ backgroundColor: "#0a0e1a", borderBottom: "4px solid #2a3a5c", minHeight: 56, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>{"< BACK"}</div>
        </button>
        <div className="flex items-center gap-2">
          <IconChatBubble size={16} color="#4ecdc4" />
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#4ecdc4" }}>MESSAGES</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff2d55" }}>
          <Blink ms={700}>1 NEW</Blink>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "rgba(255,107,53,0.1)", borderBottom: "2px solid #ff6b35" }}>
        <IconWarning size={12} color="#ff6b35" />
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff6b35" }}>
          DRILL MODE — 1 suspicious message detected
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {SMS_INBOX_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => item.isScam ? onOpenScam() : handleNonScam(item.id)}
            style={{
              display: "block", width: "100%", textAlign: "left", background: "none",
              border: "none", borderBottom: "2px solid #1a2340", cursor: "pointer",
              padding: "12px 16px",
              backgroundColor: item.isScam ? (glowFrame ? "rgba(255,45,85,0.06)" : "rgba(255,107,53,0.06)") : "#0a0e1a",
              animation: shaking === item.id ? "shake 0.5s ease" : "none",
              boxShadow: item.isScam ? `inset 0 0 ${glowFrame ? "12px" : "4px"} rgba(255,45,85,0.15)` : "none",
              transition: "background-color 0.4s, box-shadow 0.4s",
            }}
          >
            <div className="flex items-start gap-3">
              <div style={{ width: 40, height: 40, backgroundColor: item.isScam ? "#ff2d55" : "#2a3a5c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: item.isScam ? "2px solid #ff2d55" : "2px solid #1a2340" }}>
                {item.isScam ? <IconWarning size={20} color="#ffffff" /> : <IconPerson size={20} color="#6b8ba4" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between mb-1">
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: item.isScam ? 7 : 6, color: item.isScam ? "#ff2d55" : "#e8f4f8" }}>{item.sender}</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: item.isScam ? "#ff6b35" : "#6b8ba4" }}>{item.time}</div>
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: item.isScam ? "#ff6b35" : "#6b8ba4", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.preview}
                </div>
                {item.isScam && (
                  <div className="flex items-center gap-2 mt-1">
                    <div style={{ backgroundColor: "#ff2d55", padding: "1px 5px", fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ffffff" }}>
                      <Blink ms={600}>IMPORTANT</Blink>
                    </div>
                    <div style={{ backgroundColor: "#ff6b35", padding: "1px 5px", fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#0a0e1a" }}>UNREAD</div>
                  </div>
                )}
              </div>
            </div>
            {shaking === item.id && (
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#4ecdc4", marginTop: 6, textAlign: "center" }}>
                Not part of this drill.
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const SMS_LINES: { text: string; highlights?: Highlight[] }[] = [
  { text: "Your parcel is on hold due to incomplete address details." },
  { text: "Pay $1.99 redelivery fee before 11:59PM or your parcel will be returned.", highlights: [{ phrase: "Pay $1.99", flagId: "sms_payment" }, { phrase: "before 11:59PM", flagId: "sms_urgency" }] },
  { text: "Update now: http://parcelgo-redeliver.example", highlights: [{ phrase: "http://parcelgo-redeliver.example", flagId: "sms_link" }] },
];

function SMSThreadScreen({ onReport, onAskFamily, onTapLink, onBack }: { onReport: () => void; onAskFamily: () => void; onTapLink: () => void; onBack: () => void }) {
  const [activeFlag, setActiveFlag] = useState<DrillFlag | null>(null);

  const handleFlagTap = (flagId: string) => {
    const flag = FLAG_MAP[flagId];
    if (!flag) return;
    setActiveFlag(activeFlag?.id === flagId ? null : flag);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4" style={{ backgroundColor: "#111827", borderBottom: "4px solid #2a3a5c", minHeight: 56, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>{"<"}</div>
        </button>
        <div style={{ width: 32, height: 32, backgroundColor: "#ff2d55", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconWarning size={16} color="#ffffff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff2d55" }}>ParcelGo Alert</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4", marginTop: 2 }}>Unknown sender</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff6b35" }}>DRILL ACTIVE</div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }} onClick={() => setActiveFlag(null)}>
        <div className="flex flex-col gap-3" style={{ height: "100%", overflowY: "auto", padding: "16px", scrollbarWidth: "none" }}>
          <div className="flex justify-start">
            <div style={{ maxWidth: "80%", backgroundColor: "#1a2340", border: "3px solid #ff2d55", padding: "12px", fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#e8f4f8", lineHeight: 1.8 }}>
              {SMS_LINES.map((line, i) => (
                <div key={i}>
                  <AnnotatedMessage text={line.text} highlights={line.highlights} onFlagTap={handleFlagTap} />
                </div>
              ))}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <IconWarning size={9} color="#ff2d55" />
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55" }}>TAP RED TEXT TO INSPECT</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div style={{ maxWidth: "75%", backgroundColor: "#0c1a10", border: "3px solid #00ff88", padding: "10px 12px", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#00ff88", lineHeight: 1.5 }}>
              Something feels off. Inspect the message carefully before acting.
            </div>
          </div>
        </div>
        {activeFlag && <FlagTooltip flag={activeFlag} onClose={() => setActiveFlag(null)} />}
      </div>
      <div className="px-4 py-4 flex flex-col gap-3" style={{ borderTop: "4px solid #2a3a5c", backgroundColor: "#0a0e1a" }}>
        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <PixelBtn onClick={onReport} color="#00ff88" textColor="#0a0e1a" size="sm" full>REPORT + BLOCK</PixelBtn>
          </div>
          <div style={{ flex: 1 }}>
            <PixelBtn onClick={onAskFamily} color="#ffe66d" textColor="#0a0e1a" size="sm" full>ASK FAMILY</PixelBtn>
          </div>
        </div>
        <PixelBtn onClick={onTapLink} color="#ff2d55" textColor="#ffffff" size="sm" full>TAP LINK (DANGER)</PixelBtn>
      </div>
    </div>
  );
}

function SMSBrowserScreen({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [showUrlTip, setShowUrlTip] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 80); }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div style={{ backgroundColor: "#111827", borderBottom: "4px solid #ff2d55", padding: "10px 12px", flexShrink: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div style={{ width: 8, height: 8, backgroundColor: "#ff2d55" }} />
          <div style={{ width: 8, height: 8, backgroundColor: "#ffe66d" }} />
          <div style={{ width: 8, height: 8, backgroundColor: "#00ff88" }} />
        </div>
        <button onClick={() => setShowUrlTip(!showUrlTip)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "rgba(255,45,85,0.08)", border: "2px solid #ff2d55", padding: "6px 8px", cursor: "pointer" }}>
          <IconWarning size={10} color="#ff2d55" />
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#ff6b35", flex: 1, textAlign: "left" }}>parcelgo-redeliver.example</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55" }}>UNSECURED</div>
        </button>
        {showUrlTip && (
          <div style={{ backgroundColor: "rgba(255,45,85,0.12)", border: "2px solid #ff2d55", padding: "8px", marginTop: 6, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#e8f4f8", lineHeight: 1.5 }}>
            Check the URL carefully. Fake domains often look similar to real services.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", backgroundColor: "#111827" }}>
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ textAlign: "center", filter: glitch ? "hue-rotate(180deg)" : "none", transition: "filter 0.05s" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ff6b35", marginBottom: 6 }}>Redelivery Payment</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#6b8ba4" }}>Enter your details to reschedule your parcel.</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#1a2340", border: "2px solid #ff2d55", padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <IconWarning size={10} color="#ff2d55" />
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55" }}>
                <Blink ms={400}>SECURE VERIFIED</Blink>
              </div>
            </div>
          </div>
          {["Full Name", "Home Address", "Card Number", "CVV", "OTP Code"].map((label) => (
            <div key={label}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6b8ba4", marginBottom: 4 }}>{label}</div>
              <div style={{ backgroundColor: "#0a0e1a", border: "2px solid #2a3a5c", padding: "10px", height: 36, fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#1a2340" }}>▋</div>
            </div>
          ))}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55", textAlign: "center" }}>
            <Blink ms={800}>UNSECURED PAGE — DO NOT ENTER DETAILS</Blink>
          </div>
        </div>
      </div>
      <div className="flex gap-3 px-4 py-4" style={{ borderTop: "4px solid #2a3a5c", backgroundColor: "#0a0e1a" }}>
        <div style={{ flex: 1 }}>
          <PixelBtn onClick={onSubmit} color="#ff2d55" textColor="#ffffff" size="sm" full>SUBMIT PAYMENT</PixelBtn>
        </div>
        <div style={{ flex: 1 }}>
          <PixelBtn onClick={onClose} color="#00ff88" textColor="#0a0e1a" size="sm" full>CLOSE PAGE</PixelBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EMAIL SCREENS
// ─────────────────────────────────────────────────────────────────────────
const EMAIL_INBOX_ITEMS = [
  { id: "campus", sender: "Campus Rewards Office", subject: "IMPORTANT: Claim Your $300 Digital Safety Reward", preview: "You have been selected for a limited-time cyber safety reward…", time: "NOW", isScam: true },
  { id: "tips", sender: "Cyber Tips Weekly", subject: "How to spot fake links", preview: "This week's safety tip…", time: "3h" },
  { id: "family", sender: "Family Group", subject: "Weekend lunch", preview: "Mum: Are we free this Sunday?", time: "5h" },
  { id: "school", sender: "School Portal", subject: "Assignment reminder", preview: "Your submission is due soon.", time: "1d" },
  { id: "game", sender: "Game Updates", subject: "New badge unlocked", preview: "You are close to your next rank.", time: "2d" },
];

function EmailInboxScreen({ onOpenScam, onBack }: { onOpenScam: () => void; onBack: () => void }) {
  const [toast, setToast] = useState("");
  const [glowFrame, setGlowFrame] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setGlowFrame((f) => !f), 900);
    return () => clearInterval(t);
  }, []);

  const handleNonScam = () => {
    setToast("This email is safe. Open the important email to continue.");
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="flex flex-col h-full" style={{ position: "relative" }}>
      <div className="flex items-center justify-between px-4" style={{ backgroundColor: "#0a0e1a", borderBottom: "4px solid #2a3a5c", minHeight: 56, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>{"< BACK"}</div>
        </button>
        <div className="flex items-center gap-2">
          <IconEnvelope size={16} color="#c77dff" />
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#c77dff" }}>MAILBOX</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff6b35" }}>DRILL ACTIVE</div>
      </div>
      <div className="px-4 py-2" style={{ borderBottom: "2px solid #1a2340" }}>
        <div style={{ backgroundColor: "#111827", border: "2px solid #2a3a5c", padding: "6px 10px", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#2a3a5c" }}>
          Search mail…
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "rgba(255,107,53,0.1)", borderBottom: "2px solid #ff6b35", flexShrink: 0 }}>
        <IconWarning size={12} color="#ff6b35" />
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff6b35" }}>
          New important email detected. Inspect before clicking.
        </div>
      </div>
      {toast && (
        <div style={{ backgroundColor: "#1a2340", border: "2px solid #4ecdc4", padding: "8px 12px", margin: "8px 12px", position: "absolute", top: 160, left: 0, right: 0, zIndex: 20, animation: "slideUp 0.2s ease-out" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#4ecdc4", lineHeight: 1.6 }}>{toast}</div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {EMAIL_INBOX_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => item.isScam ? onOpenScam() : handleNonScam()}
            style={{
              display: "block", width: "100%", textAlign: "left", background: "none",
              border: "none", borderBottom: "2px solid #1a2340", cursor: "pointer",
              padding: "12px 16px",
              backgroundColor: item.isScam ? (glowFrame ? "rgba(255,107,53,0.08)" : "rgba(255,45,85,0.05)") : "#0a0e1a",
              boxShadow: item.isScam ? `inset 0 0 ${glowFrame ? "16px" : "6px"} rgba(255,107,53,0.12)` : "none",
              transition: "background-color 0.45s, box-shadow 0.45s",
            }}
          >
            <div className="flex items-start gap-3">
              <div style={{ width: 36, height: 36, backgroundColor: item.isScam ? "#ff6b35" : "#2a3a5c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.isScam ? <IconWarning size={18} color="#0a0e1a" /> : <IconEnvelope size={16} color="#6b8ba4" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between mb-1">
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: item.isScam ? 6 : 5, color: item.isScam ? "#ff6b35" : "#e8f4f8" }}>{item.sender}</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: item.isScam ? "#ff6b35" : "#6b8ba4" }}>{item.time}</div>
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: item.isScam ? "#ff2d55" : "#e8f4f8", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.subject}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#6b8ba4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.preview}
                </div>
                {item.isScam && (
                  <div className="flex gap-2 mt-1">
                    <div style={{ backgroundColor: "#ff6b35", padding: "1px 5px", fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#0a0e1a" }}>
                      <Blink ms={500}>IMPORTANT</Blink>
                    </div>
                    <div style={{ backgroundColor: "#ff2d55", padding: "1px 5px", fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ffffff" }}>UNREAD</div>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const EMAIL_BODY_LINES: { text: string; highlights?: Highlight[] }[] = [
  { text: "Dear Student," },
  { text: "" },
  { text: "Congratulations! You have been selected to receive a $300 Digital Safety Reward for completing your campus cyber awareness profile.", highlights: [{ phrase: "$300 Digital Safety Reward", flagId: "email_reward" }] },
  { text: "" },
  { text: "This reward is only available for the next 30 minutes.", highlights: [{ phrase: "only available for the next 30 minutes", flagId: "email_urgency" }] },
  { text: "" },
  { text: "To claim your reward, verify your student account using the secure link below.", highlights: [{ phrase: "verify your student account", flagId: "email_verify" }] },
  { text: "" },
  { text: "[ CLAIM REWARD NOW ]", highlights: [{ phrase: "[ CLAIM REWARD NOW ]", flagId: "email_button" }] },
  { text: "" },
  { text: "If the button does not work, open the attached Reward_Verification_Form.zip and follow the instructions.", highlights: [{ phrase: "Reward_Verification_Form.zip", flagId: "email_attachment" }] },
  { text: "" },
  { text: "Failure to verify today may result in your reward being reassigned.", highlights: [{ phrase: "Failure to verify today", flagId: "email_threat" }] },
  { text: "" },
  { text: "Campus Rewards Office" },
];

function EmailDetailScreen({ onReport, onAskFamily, onClaimReward, onOpenAttachment, onBack }: { onReport: () => void; onAskFamily: () => void; onClaimReward: () => void; onOpenAttachment: () => void; onBack: () => void }) {
  const [activeFlag, setActiveFlag] = useState<DrillFlag | null>(null);
  const [foundFlags, setFoundFlags] = useState<Set<string>>(new Set());

  const handleFlagTap = (flagId: string) => {
    const flag = FLAG_MAP[flagId];
    if (!flag) return;
    setFoundFlags((prev) => new Set([...prev, flagId]));
    setActiveFlag(activeFlag?.id === flagId ? null : flag);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4" style={{ backgroundColor: "#111827", borderBottom: "4px solid #2a3a5c", minHeight: 56, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>{"<"}</div>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#c77dff" }}>Campus Rewards Office</div>
          <div className="flex items-center gap-1 mt-1">
            <IconWarning size={8} color="#ff6b35" />
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#ff6b35" }}>rewards-office@campus-secure.example</div>
          </div>
        </div>
        <div style={{ backgroundColor: "#ff6b35", padding: "2px 6px", fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#0a0e1a", flexShrink: 0 }}>IMPORTANT</div>
      </div>
      <div className="px-4 py-3" style={{ borderBottom: "2px solid #1a2340", backgroundColor: "#0d1120" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff2d55", lineHeight: 1.5, marginBottom: 6 }}>
          IMPORTANT: Claim Your $300 Digital Safety Reward
        </div>
        <div className="flex items-center justify-between">
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6b8ba4" }}>Tap red text to inspect</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: foundFlags.size > 0 ? "#ff6b35" : "#6b8ba4" }}>
            RED FLAGS: {foundFlags.size}/6
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }} onClick={() => setActiveFlag(null)}>
        <div style={{ height: "100%", overflowY: "auto", padding: "16px", scrollbarWidth: "none" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#e8f4f8", lineHeight: 2 }}>
            {EMAIL_BODY_LINES.map((line, i) => (
              <div key={i} style={{ minHeight: line.text === "" ? 8 : "auto" }}>
                {line.highlights?.length ? (
                  <AnnotatedMessage text={line.text} highlights={line.highlights} onFlagTap={handleFlagTap} />
                ) : (
                  line.text
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4" style={{ backgroundColor: "#1a2340", border: "2px solid #c77dff", padding: "8px 10px", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); handleFlagTap("email_attachment"); }}>
            <IconAttachment size={14} color="#c77dff" />
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#c77dff" }}>Reward_Verification_Form.zip</div>
            <IconWarning size={10} color="#ff2d55" />
          </div>
          <div style={{ height: 120 }} />
        </div>
        {activeFlag && <FlagTooltip flag={activeFlag} onClose={() => setActiveFlag(null)} />}
      </div>
      <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: "4px solid #2a3a5c", backgroundColor: "#0a0e1a", flexShrink: 0 }}>
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <PixelBtn onClick={onReport} color="#00ff88" textColor="#0a0e1a" size="sm" full>REPORT PHISHING</PixelBtn>
          </div>
          <div style={{ flex: 1 }}>
            <PixelBtn onClick={onAskFamily} color="#ffe66d" textColor="#0a0e1a" size="sm" full>ASK FAMILY</PixelBtn>
          </div>
        </div>
        <PixelBtn onClick={onClaimReward} color="#ff2d55" textColor="#ffffff" size="sm" full>CLAIM REWARD (DANGER)</PixelBtn>
        <PixelBtn onClick={onOpenAttachment} color="#1a2340" textColor="#c77dff" size="sm" full>OPEN ATTACHMENT (DANGER)</PixelBtn>
      </div>
    </div>
  );
}

function EmailBrowserScreen({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [showUrlTip, setShowUrlTip] = useState(false);
  const [showBreach, setShowBreach] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 90); }, 3000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = () => {
    setShowBreach(true);
    setTimeout(() => onSubmit(), 2200);
  };

  if (showBreach) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6" style={{ backgroundColor: "#1a0000" }}>
        <div style={{ filter: "drop-shadow(0 0 20px rgba(255,45,85,0.9))" }}>
          <IconSkull size={80} color="#ff2d55" />
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#ff2d55", textAlign: "center", lineHeight: 1.6, textShadow: "0 0 20px #ff2d55" }}>
          DETAILS<br />CAPTURED
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, color: "#ff6b35", textAlign: "center" }}>Redirecting to result...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div style={{ backgroundColor: "#111827", borderBottom: "4px solid #ff2d55", padding: "10px 12px", flexShrink: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div style={{ width: 8, height: 8, backgroundColor: "#ff2d55" }} />
          <div style={{ width: 8, height: 8, backgroundColor: "#ffe66d" }} />
          <div style={{ width: 8, height: 8, backgroundColor: "#00ff88" }} />
        </div>
        <button onClick={() => setShowUrlTip(!showUrlTip)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", backgroundColor: "rgba(255,45,85,0.08)", border: "2px solid #ff2d55", padding: "6px 8px", cursor: "pointer" }}>
          <IconWarning size={10} color="#ff2d55" />
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#ff6b35", flex: 1, textAlign: "left" }}>campus-secure-rewards.example</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55" }}>UNVERIFIED SITE</div>
        </button>
        {showUrlTip && (
          <div style={{ backgroundColor: "rgba(255,45,85,0.12)", border: "2px solid #ff2d55", padding: "8px", marginTop: 6, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#e8f4f8", lineHeight: 1.5 }}>
            The domain is suspicious. Scammers often use official-sounding fake domains.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", backgroundColor: "#111827" }}>
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ textAlign: "center", filter: glitch ? "hue-rotate(200deg) brightness(1.2)" : "none", transition: "filter 0.05s" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#c77dff", marginBottom: 6 }}>Digital Safety Reward Portal</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#6b8ba4" }}>Verify your identity to receive $300.</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#1a2340", border: `2px solid ${glitch ? "#ff2d55" : "#2a3a5c"}`, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.05s" }}>
              <IconShield size={12} color={glitch ? "#ff2d55" : "#2a3a5c"} />
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: glitch ? "#ff2d55" : "#2a3a5c" }}>SECURE VERIFIED</div>
            </div>
          </div>
          {["Student Email", "Password", "NRIC / ID Number", "Phone Number", "OTP Code"].map((label) => (
            <div key={label}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6b8ba4", marginBottom: 4 }}>{label}</div>
              <div style={{ backgroundColor: "#0a0e1a", border: "2px solid #2a3a5c", padding: "10px", height: 36, fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#1a2340" }}>▋</div>
            </div>
          ))}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55", textAlign: "center" }}>
            <Blink ms={700}>UNSECURED — DO NOT SUBMIT REAL DATA</Blink>
          </div>
        </div>
      </div>
      <div className="flex gap-3 px-4 py-4" style={{ borderTop: "4px solid #2a3a5c", backgroundColor: "#0a0e1a" }}>
        <div style={{ flex: 1 }}>
          <PixelBtn onClick={handleSubmit} color="#ff2d55" textColor="#ffffff" size="sm" full>SUBMIT DETAILS</PixelBtn>
        </div>
        <div style={{ flex: 1 }}>
          <PixelBtn onClick={onClose} color="#00ff88" textColor="#0a0e1a" size="sm" full>CLOSE + REPORT</PixelBtn>
        </div>
      </div>
    </div>
  );
}

function EmailDownloadScreen({ onCancel, onComplete }: { onCancel: () => void; onComplete: () => void }) {
  const [phase, setPhase] = useState<"downloading" | "opening" | "malware">("downloading");
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(interval); return 100; } return p + 1; });
    }, 32);
    const t1 = setTimeout(() => setPhase("opening"), 3500);
    const t2 = setTimeout(() => setPhase("malware"), 5500);
    const t3 = setTimeout(() => { doneRef.current = true; onComplete(); }, 7500);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleCancel = () => { if (!doneRef.current) onCancel(); };

  if (phase === "malware") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6" style={{ backgroundColor: "#1a0000" }}>
        <div style={{ filter: "drop-shadow(0 0 20px rgba(255,45,85,0.9))" }}>
          <IconSkull size={72} color="#ff2d55" />
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#ff2d55", textAlign: "center", lineHeight: 1.8, textShadow: "0 0 20px #ff2d55" }}>
          MALWARE SIMULATION<br />DETECTED
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff6b35", textAlign: "center", lineHeight: 2 }}>
          DEVICE COMPROMISED<br />PASSWORDS AT RISK
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#6b8ba4" }}>Returning to result...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      <div style={{ filter: "drop-shadow(0 0 8px rgba(199,125,255,0.6))" }}>
        <IconDownload size={48} color="#c77dff" />
      </div>
      <div style={{ width: "100%", backgroundColor: "#111827", border: "3px solid #c77dff", padding: "16px" }}>
        <div className="flex items-center gap-3 mb-4">
          <IconAttachment size={20} color="#c77dff" />
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#c77dff" }}>Reward_Verification_Form.zip</div>
        </div>
        <div style={{ width: "100%", backgroundColor: "#0a0e1a", border: "2px solid #2a3a5c", height: 20, marginBottom: 8, position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", backgroundColor: phase === "opening" ? "#ff6b35" : "#c77dff", width: `${progress}%`, transition: "width 0.1s" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ffffff", mixBlendMode: "difference" }}>
              {phase === "downloading" ? `${progress}%` : "100%"}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: phase === "opening" ? "#ff6b35" : "#c77dff", textAlign: "center" }}>
          {phase === "downloading" ? "DOWNLOADING..." : "OPENING FILE..."}
        </div>
      </div>
      <PixelBtn onClick={handleCancel} color="#00ff88" textColor="#0a0e1a" size="md" full>CANCEL DOWNLOAD</PixelBtn>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#ff2d55", textAlign: "center", lineHeight: 2 }}>
        <Blink ms={500}>WARNING — SIMULATED MALWARE DETECTED</Blink>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCAM REASON SECTION
// ─────────────────────────────────────────────────────────────────────────
function ScamReasonSection({ flags }: { flags: DrillFlag[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "3px solid #ff2d55" }}>
        <IconWarning size={16} color="#ff2d55" />
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ff2d55", letterSpacing: 1 }}>WHY IT WAS A SCAM</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {flags.map((flag, i) => {
          const isOpen = expanded === flag.id;
          return (
            <button key={flag.id} onClick={() => setExpanded(isOpen ? null : flag.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", padding: 0, border: "none", cursor: "pointer" }}>
              <div style={{ backgroundColor: isOpen ? "rgba(255,45,85,0.10)" : "#111827", border: `3px solid ${isOpen ? "#ff2d55" : "#2a3a5c"}`, boxShadow: isOpen ? "3px 3px 0 #ff2d55" : "none", padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, backgroundColor: "#ff2d55", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#0a0e1a" }}>{i + 1}</span>
                  </div>
                  <IconWarning size={14} color={isOpen ? "#ff2d55" : "#6b8ba4"} />
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: isOpen ? "#ff2d55" : "#e8f4f8", flex: 1 }}>{flag.name}</div>
                  <svg width={10} height={8} viewBox="0 0 5 4" style={{ imageRendering: "pixelated", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                    <rect x={0} y={0} width={1} height={1} fill="#6b8ba4" />
                    <rect x={1} y={1} width={1} height={1} fill="#6b8ba4" />
                    <rect x={2} y={2} width={1} height={1} fill="#6b8ba4" />
                    <rect x={3} y={1} width={1} height={1} fill="#6b8ba4" />
                    <rect x={4} y={0} width={1} height={1} fill="#6b8ba4" />
                  </svg>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid rgba(255,45,85,0.3)", fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#e8f4f8", lineHeight: 1.6 }}>
                    {flag.explanation}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: RESULT (dynamic per drill type + outcome)
// ─────────────────────────────────────────────────────────────────────────
function getResultContent(win: boolean, drillType: DrillType, smsOutcome: SmsOutcome | null, emailOutcome: EmailOutcome | null) {
  if (drillType === "call") {
    return {
      header: win ? "DRILL COMPLETE!" : "GAME OVER",
      xp: win ? 320 : 50,
      feedback: win ? "You correctly identified gift card payment as a scam tactic!" : "Never give gift card numbers to strangers on the phone!",
      flags: RED_FLAGS,
    };
  }
  if (drillType === "sms") {
    if (win) {
      const feedback =
        smsOutcome === "asked-family" ? "You paused and checked before acting. Good thinking!" :
        smsOutcome === "closed-page" ? "You recognised the fake page and closed it before entering your details." :
        "You spotted the suspicious delivery message and avoided the phishing link.";
      return { header: "SCAM BLOCKED!", xp: 280, feedback, flags: SMS_FLAGS };
    }
    return { header: "YOU GOT PHISHED!", xp: 50, feedback: "You tapped the link and reached a fake payment page. Scammers often use small fees to steal card details.", flags: SMS_FLAGS };
  }
  // email
  if (win) {
    const feedback =
      emailOutcome === "asked-family" ? "You paused and verified before trusting the email." :
      emailOutcome === "cancelled-download" ? "You stopped the download before opening the file." :
      "You inspected the email before clicking. Reporting phishing protects both you and your family.";
    return { header: "PHISHING REPORTED!", xp: 350, feedback, flags: EMAIL_FLAGS };
  }
  if (emailOutcome === "opened-attachment") {
    return { header: "MALWARE TRIGGERED!", xp: 50, feedback: "You opened a suspicious ZIP attachment. Attachments can hide malware or fake forms.", flags: EMAIL_FLAGS };
  }
  return { header: "DETAILS STOLEN!", xp: 50, feedback: "You submitted details on a fake login page. Scammers use official-looking forms to steal passwords, IDs, and OTPs.", flags: EMAIL_FLAGS };
}

function ResultScreen({ win, drillType, smsOutcome, emailOutcome, onPlayAgain, onGoHome }: { win: boolean; drillType: DrillType; smsOutcome: SmsOutcome | null; emailOutcome: EmailOutcome | null; onPlayAgain: () => void; onGoHome: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowDetails(true), 700); return () => clearTimeout(t); }, []);

  const { header, xp, feedback, flags } = getResultContent(win, drillType, smsOutcome, emailOutcome);
  const drillLabel = drillType === "call" ? "CALL" : drillType === "sms" ? "SMS" : "EMAIL";

  return (
    <div style={{ position: "relative", height: "100%", overflowY: "auto", scrollbarWidth: "none" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "32px 20px 36px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4", letterSpacing: 2 }}>
            {drillLabel} DRILL — {win ? "SUCCESS" : "FAIL"}
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: win ? 24 : 20, color: win ? "#00ff88" : "#ff2d55", textShadow: win ? "4px 4px 0 #006633, 0 0 30px rgba(0,255,136,0.7)" : "4px 4px 0 #660011, 0 0 30px rgba(255,45,85,0.7)", textAlign: "center", lineHeight: 1.3 }}>
            {header}
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: win ? "#4ecdc4" : "#ff6b35", textAlign: "center" }}>
            {win ? '"Great instinct!"' : '"Stay alert next time."'}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <PixelMascot size={96} animate />
          {win && (
            <div style={{ position: "absolute", top: -20, right: -20, animation: "spin 2s linear infinite" }}>
              <IconStar size={24} color="#ffe66d" />
            </div>
          )}
        </div>
        {showDetails && (
          <div style={{ width: "100%" }}>
            <PixelPanel accent={win ? "#00ff88" : "#ff2d55"} className="w-full">
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: win ? "#00ff88" : "#ff2d55", marginBottom: 12, textAlign: "center" }}>
                === RESULTS ===
              </div>
              <div className="flex justify-between items-center mb-2">
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>XP GAINED</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffe66d" }}>+{xp}</div>
              </div>
              <div className="flex justify-between items-center mb-3">
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>STREAK</div>
                <div className="flex items-center gap-2">
                  {win ? <IconFlame size={14} color="#ff6b35" /> : <IconSkull size={14} color="#ff2d55" />}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: win ? "#ff6b35" : "#ff2d55" }}>
                    {win ? "EXTENDED" : "BROKEN"}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: win ? "#00ff88" : "#ff6b35", backgroundColor: win ? "rgba(0,255,136,0.08)" : "rgba(255,45,85,0.08)", border: `2px solid ${win ? "#00ff88" : "#ff2d55"}`, padding: "8px 10px", lineHeight: 1.6 }}>
                {feedback}
              </div>
            </PixelPanel>
          </div>
        )}
        {showDetails && <ScamReasonSection flags={flags} />}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <PixelBtn onClick={onPlayAgain} color={win ? "#00ff88" : "#ff6b35"} size="lg" full>[ PLAY ANOTHER DRILL ]</PixelBtn>
          <PixelBtn onClick={onGoHome} color="#1a2340" textColor="#6b8ba4" size="md" full>BACK TO HOME</PixelBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────
function LeaderboardScreen() {
  const [tab, setTab] = useState<"fame" | "shame">("fame");
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4" style={{ borderBottom: "4px solid #2a3a5c", backgroundColor: "#0a0e1a", minHeight: 56 }}>
        <IconTrophy size={16} color="#ffe66d" />
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffe66d" }}>LEADERBOARD</div>
      </div>
      <div className="flex" style={{ borderBottom: "4px solid #2a3a5c" }}>
        <button onClick={() => setTab("fame")} className="flex-1 flex flex-col items-center justify-center gap-1 py-3" style={{ backgroundColor: tab === "fame" ? "#1a3a2a" : "#0a0e1a", border: "none", borderBottom: tab === "fame" ? "4px solid #00ff88" : "4px solid transparent", cursor: "pointer" }}>
          <IconTrophy size={16} color={tab === "fame" ? "#00ff88" : "#2a3a5c"} />
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: tab === "fame" ? "#00ff88" : "#2a3a5c" }}>HALL OF FAME</div>
        </button>
        <div style={{ width: 4, backgroundColor: "#2a3a5c" }} />
        <button onClick={() => setTab("shame")} className="flex-1 flex flex-col items-center justify-center gap-1 py-3" style={{ backgroundColor: tab === "shame" ? "#1a0a10" : "#0a0e1a", border: "none", borderBottom: tab === "shame" ? "4px solid #ff2d55" : "4px solid transparent", cursor: "pointer" }}>
          <IconSkull size={16} color={tab === "shame" ? "#ff2d55" : "#2a3a5c"} />
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: tab === "shame" ? "#ff2d55" : "#2a3a5c" }}>HALL OF SHAME</div>
        </button>
      </div>
      {tab === "fame" ? <FameBoard /> : <ShameBoard />}
    </div>
  );
}

function FameBoard() {
  // Live leaderboard from the backend; falls back to the mock if it's unreachable.
  const [board, setBoard] = useState(HALL_OF_FAME);
  useEffect(() => {
    apiGet<{ rank: number; name: string; score: number; wins: number }[]>("/api/leaderboard").then((rows) => {
      if (rows && rows.length) {
        setBoard(rows.map((r) => ({ rank: r.rank, name: r.name, score: r.score, wins: r.wins ?? 0, area: "FAMILY" })));
      }
    });
  }, []);
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="mx-4 mt-3 px-3 py-2 flex items-center justify-between" style={{ backgroundColor: "#111827", border: "3px solid #ffe66d" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6b8ba4" }}>DOWNTOWN AREA</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ffe66d" }}>YOUR RANK: #12</div>
      </div>
      <div className="mx-4 mt-2 px-3 py-3 flex items-center gap-3" style={{ backgroundColor: "rgba(0,255,136,0.08)", border: "3px solid #00ff88" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#00ff88" }}>#12</div>
        <PixelMascot size={28} />
        <div className="flex-1">
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#00ff88" }}>YOU</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#4ecdc4" }}>2,340 PTS / 48 WINS</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4" }}>LVL 7</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
        {board.map((p) => (
          <div key={p.rank} className="flex items-center gap-3 px-3 py-3" style={{ backgroundColor: "#111827", border: `3px solid ${p.rank <= 3 ? ["#ffe66d", "#c0c0c0", "#cd7f32"][p.rank - 1] : "#2a3a5c"}`, boxShadow: p.rank <= 3 ? `3px 3px 0px ${["#ffe66d", "#c0c0c0", "#cd7f32"][p.rank - 1]}` : "none" }}>
            <div className="flex items-center justify-center" style={{ width: 28 }}>
              {p.rank <= 3 ? <IconMedal rank={p.rank} size={20} /> : <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#6b8ba4" }}>#{p.rank}</div>}
            </div>
            <PixelAvatar rank={p.rank} size={28} />
            <div className="flex-1">
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#e8f4f8" }}>{p.name}</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4", marginTop: 2 }}>{p.wins} WINS · {p.area}</div>
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#4ecdc4" }}>{p.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShameBoard() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="mx-4 mt-3 px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "rgba(255,45,85,0.08)", border: "3px solid #ff2d55" }}>
        <IconWarning size={12} color="#ff2d55" />
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#ff2d55" }}>MOST SCAMMED IN YOUR AREA</div>
      </div>
      <div className="mx-4 mt-2 px-3 py-3 flex items-center gap-3" style={{ backgroundColor: "rgba(255,107,53,0.08)", border: "3px solid #ff6b35" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ff6b35" }}>#8</div>
        <PixelMascot size={28} />
        <div className="flex-1">
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ff6b35" }}>YOU</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4" }}>3 TIMES SCAMMED</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#00ff88" }}>NOT BAD!</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
        {HALL_OF_SHAME.map((p, i) => {
          const isYou = p.name === "PLAYER_001";
          const shameColors = ["#ff2d55", "#ff2d55", "#ff2d55", "#ff6b35", "#ff6b35", "#ff6b35", "#ffe66d", "#ffe66d"];
          const rowColor = shameColors[i] ?? "#2a3a5c";
          return (
            <div key={p.rank} className="flex items-center gap-3 px-3 py-3" style={{ backgroundColor: isYou ? "rgba(255,107,53,0.08)" : "#111827", border: `3px solid ${isYou ? "#ff6b35" : rowColor}`, boxShadow: i < 3 ? `3px 3px 0px ${rowColor}` : "none" }}>
              <div className="flex items-center justify-center" style={{ width: 28 }}>
                {i < 3 ? <IconSkull size={18} color={rowColor} /> : <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#6b8ba4" }}>#{p.rank}</div>}
              </div>
              <PixelAvatar rank={p.rank + 4} size={28} />
              <div className="flex-1">
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: isYou ? "#ff6b35" : "#e8f4f8" }}>{isYou ? "YOU" : p.name}</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4", marginTop: 2 }}>{p.area}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: rowColor }}>{p.scammed}x</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4" }}>SCAMMED</div>
              </div>
            </div>
          );
        })}
        <div className="py-3 text-center" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#2a3a5c" }}>
          — KEEP TRAINING TO STAY OFF THIS LIST —
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: PROFILE
// ─────────────────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 1, name: "FIRST BLOCK", unlocked: true, color: "#00ff88" },
  { id: 2, name: "STREAK X5", unlocked: true, color: "#ff6b35" },
  { id: 3, name: "IRS SLAYER", unlocked: true, color: "#4ecdc4" },
  { id: 4, name: "EAGLE EYE", unlocked: true, color: "#ffe66d" },
  { id: 5, name: "STREAK X10", unlocked: false, color: "#ff6b35" },
  { id: 6, name: "GRANDMASTER", unlocked: false, color: "#ffe66d" },
  { id: 7, name: "GHOST MODE", unlocked: false, color: "#c77dff" },
  { id: 8, name: "TECH SCAM", unlocked: false, color: "#4ecdc4" },
  { id: 9, name: "ROMANCE DEF", unlocked: false, color: "#ff2d55" },
];

function ProfileScreen() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4" style={{ borderBottom: "4px solid #2a3a5c", backgroundColor: "#0a0e1a", minHeight: 56 }}>
        <IconPerson size={16} color="#4ecdc4" />
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#4ecdc4" }}>PROFILE</div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="mx-4 mt-4 p-4 flex items-center gap-4" style={{ backgroundColor: "#111827", border: "4px solid #4ecdc4", boxShadow: "4px 4px 0 #4ecdc4" }}>
          <PixelMascot size={72} animate />
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffffff" }}>PLAYER_001</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#4ecdc4", marginTop: 4 }}>LVL 7 — WATCHER</div>
            <div className="mt-3">
              <XPBar current={2340} max={3000} color="#4ecdc4" />
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4", marginTop: 4 }}>2,340 / 3,000 XP TO LVL 8</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
          {[
            { label: "TOTAL SCORE", val: "11,240", color: "#ffe66d", icon: <IconTrophy size={12} color="#ffe66d" /> },
            { label: "DRILLS DONE", val: "51", color: "#4ecdc4", icon: <IconShield size={12} color="#4ecdc4" /> },
            { label: "BEST STREAK", val: "12", color: "#ff6b35", icon: <IconFlame size={12} color="#ff6b35" /> },
            { label: "AREA RANK", val: "#12", color: "#00ff88", icon: <IconStar size={12} color="#00ff88" /> },
          ].map((s) => (
            <div key={s.label} className="p-3" style={{ backgroundColor: "#111827", border: "3px solid #2a3a5c" }}>
              <div className="flex items-center gap-1 mb-1">{s.icon}<div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b8ba4" }}>{s.label}</div></div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div className="mx-4 mt-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <IconBadge size={16} color="#ffe66d" />
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffe66d" }}>ACHIEVEMENT BADGES</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-2 p-3" style={{ backgroundColor: a.unlocked ? "#111827" : "#0d1120", border: `3px solid ${a.unlocked ? a.color : "#1a2340"}`, boxShadow: a.unlocked ? `3px 3px 0 ${a.color}` : "none", opacity: a.unlocked ? 1 : 0.45, position: "relative" }}>
                {!a.unlocked && <div style={{ position: "absolute", top: 4, right: 4 }}><IconLock size={10} color="#2a3a5c" /></div>}
                <IconBadge size={28} color={a.unlocked ? a.color : "#2a3a5c"} />
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: a.unlocked ? a.color : "#2a3a5c", textAlign: "center", lineHeight: 1.4 }}>{a.name}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6b8ba4", textAlign: "center", marginTop: 12 }}>4 / 9 UNLOCKED</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────
function BottomNav({ activeTab, onTab, onDrillSelect }: { activeTab: Tab; onTab: (t: Tab) => void; onDrillSelect: () => void }) {
  const items: { tab: Tab; icon: React.ReactNode; label: string; activeColor: string }[] = [
    { tab: "home", icon: <IconHouse size={20} color={activeTab === "home" ? "#00ff88" : "#2a3a5c"} />, label: "HOME", activeColor: "#00ff88" },
    { tab: "leaderboard", icon: <IconTrophy size={20} color={activeTab === "leaderboard" ? "#ffe66d" : "#2a3a5c"} />, label: "RANKS", activeColor: "#ffe66d" },
    { tab: "profile", icon: <IconPerson size={20} color={activeTab === "profile" ? "#4ecdc4" : "#2a3a5c"} />, label: "PROFILE", activeColor: "#4ecdc4" },
  ];
  return (
    <div className="flex items-stretch" style={{ borderTop: "4px solid #2a3a5c", backgroundColor: "#0a0e1a", minHeight: 72, flexShrink: 0 }}>
      {items.slice(0, 2).map((item) => (
        <button key={item.tab} onClick={() => onTab(item.tab)} className="flex-1 flex flex-col items-center justify-center gap-1" style={{ background: "none", border: "none", borderTop: activeTab === item.tab ? `4px solid ${item.activeColor}` : "4px solid transparent", cursor: "pointer", paddingTop: 8 }}>
          {item.icon}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: activeTab === item.tab ? item.activeColor : "#2a3a5c" }}>{item.label}</div>
        </button>
      ))}
      <div className="flex items-center justify-center px-2" style={{ flexShrink: 0 }}>
        <button onClick={onDrillSelect} style={{ backgroundColor: "#00ff88", border: "4px solid #0a0e1a", boxShadow: "0 -4px 0 #006633, 4px 0 0 #006633, -4px 0 0 #006633", cursor: "pointer", width: 64, height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 8 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#0a0e1a", lineHeight: 1 }}>▶</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: "#0a0e1a" }}>DRILL</div>
        </button>
      </div>
      {items.slice(2).map((item) => (
        <button key={item.tab} onClick={() => onTab(item.tab)} className="flex-1 flex flex-col items-center justify-center gap-1" style={{ background: "none", border: "none", borderTop: activeTab === item.tab ? `4px solid ${item.activeColor}` : "4px solid transparent", cursor: "pointer", paddingTop: 8 }}>
          {item.icon}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: activeTab === item.tab ? item.activeColor : "#2a3a5c" }}>{item.label}</div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [drillType, setDrillType] = useState<DrillType>("call");
  const [smsOutcome, setSmsOutcome] = useState<SmsOutcome | null>(null);
  const [emailOutcome, setEmailOutcome] = useState<EmailOutcome | null>(null);

  const DRILL_SCREENS: Screen[] = ["drill-select", "incoming", "call", "sms-inbox", "sms-thread", "sms-browser", "email-inbox", "email-detail", "email-browser", "email-download", "result-win", "result-lose"];
  const isDrillFlow = DRILL_SCREENS.includes(screen);
  const isTitle = screen === "title";

  const goHome = () => { setActiveTab("home"); setScreen("home"); };
  const goDrillSelect = () => setScreen("drill-select");
  const handleTab = (tab: Tab) => { setActiveTab(tab); setScreen(tab); };

  const startCall = () => { setDrillType("call"); setSmsOutcome(null); setEmailOutcome(null); setScreen("incoming"); };
  const startSms = () => { setDrillType("sms"); setSmsOutcome(null); setEmailOutcome(null); setScreen("sms-inbox"); };
  const startEmail = () => { setDrillType("email"); setSmsOutcome(null); setEmailOutcome(null); setScreen("email-inbox"); };

  // On first load, check whether a real surprise-call result is waiting on the
  // backend and jump straight to its result screen (the surprise-call → game-UI loop).
  useEffect(() => {
    apiGet<{ pending: { screen: Screen } | null }>("/api/drills/pending-result").then((data) => {
      if (data?.pending?.screen) setScreen(data.pending.screen);
    });
  }, []);

  const handleHangUp = (win: boolean) => {
    reportOutcome(win ? "disengaged" : "complied");
    setScreen(win ? "result-win" : "result-lose");
  };

  return (
    <>
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.6; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <Scanlines />
      <PhoneFrame>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {screen === "title" && <TitleScreen onNext={goHome} />}
            {screen === "home" && <FamilyHomeScreen onDrillSelect={goDrillSelect} />}
            {screen === "leaderboard" && <LeaderboardScreen />}
            {screen === "profile" && <ProfileScreen />}

            {screen === "drill-select" && (
              <DrillSelectScreen onCall={startCall} onSms={startSms} onEmail={startEmail} onBack={goHome} />
            )}

            {screen === "incoming" && (
              <IncomingCallScreen
                onAccept={() => setScreen("call")}
                onDecline={() => { handleHangUp(true); }}
              />
            )}
            {screen === "call" && <CallScreen onHangUp={handleHangUp} onResult={handleHangUp} />}

            {screen === "sms-inbox" && (
              <SMSInboxScreen onOpenScam={() => setScreen("sms-thread")} onBack={goDrillSelect} />
            )}
            {screen === "sms-thread" && (
              <SMSThreadScreen
                onReport={() => { setSmsOutcome("reported"); reportOutcome("reported"); setScreen("result-win"); }}
                onAskFamily={() => { setSmsOutcome("asked-family"); reportOutcome("asked-family"); setScreen("result-win"); }}
                onTapLink={() => setScreen("sms-browser")}
                onBack={() => setScreen("sms-inbox")}
              />
            )}
            {screen === "sms-browser" && (
              <SMSBrowserScreen
                onClose={() => { setSmsOutcome("closed-page"); reportOutcome("closed_page"); setScreen("result-win"); }}
                onSubmit={() => { setSmsOutcome("clicked-link"); reportOutcome("clicked_link"); setScreen("result-lose"); }}
              />
            )}

            {screen === "email-inbox" && (
              <EmailInboxScreen onOpenScam={() => setScreen("email-detail")} onBack={goDrillSelect} />
            )}
            {screen === "email-detail" && (
              <EmailDetailScreen
                onReport={() => { setEmailOutcome("reported"); reportOutcome("reported"); setScreen("result-win"); }}
                onAskFamily={() => { setEmailOutcome("asked-family"); reportOutcome("asked-family"); setScreen("result-win"); }}
                onClaimReward={() => setScreen("email-browser")}
                onOpenAttachment={() => setScreen("email-download")}
                onBack={() => setScreen("email-inbox")}
              />
            )}
            {screen === "email-browser" && (
              <EmailBrowserScreen
                onClose={() => { setEmailOutcome("reported"); reportOutcome("reported"); setScreen("result-win"); }}
                onSubmit={() => { setEmailOutcome("submitted-details"); reportOutcome("submitted_details"); setScreen("result-lose"); }}
              />
            )}
            {screen === "email-download" && (
              <EmailDownloadScreen
                onCancel={() => { setEmailOutcome("cancelled-download"); reportOutcome("cancelled_download"); setScreen("result-win"); }}
                onComplete={() => { setEmailOutcome("opened-attachment"); reportOutcome("opened_attachment"); setScreen("result-lose"); }}
              />
            )}

            {(screen === "result-win" || screen === "result-lose") && (
              <ResultScreen
                win={screen === "result-win"}
                drillType={drillType}
                smsOutcome={smsOutcome}
                emailOutcome={emailOutcome}
                onPlayAgain={goDrillSelect}
                onGoHome={goHome}
              />
            )}
          </div>

          {!isDrillFlow && !isTitle && (
            <BottomNav activeTab={activeTab} onTab={handleTab} onDrillSelect={goDrillSelect} />
          )}
        </div>
      </PhoneFrame>
    </>
  );
}
