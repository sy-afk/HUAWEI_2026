import { useState, useEffect, useRef, useMemo } from "react";
import { 
  IconAttachment, 
  IconBadge, IconBell, IconBulb,
  IconChat, IconCheck, IconCoin, 
  IconEnvelope, IconEyeInspect,
  IconGear, 
  IconHouse, IconPerson, IconPhone, 
  IconShield, IconSpeaker, IconStore,
  IconTrophy,
  IconWarning, 
  IconX 
} from "../../components/icons";
import type { FamilyMember } from "../../types/family";
import { FurnitureIcon, PurchasedRoomFurniture, ShopFurnitureArt, WallpaperSwatch } from "../../components/furniture";
import { loadAccessibility } from "../../services/storage";
import { FamilyChar } from "../../components/avatars";
import { FURNITURE_STORE } from "../../data/furniture";

function useIdleFrame(fps = 2): number {
  const [frame, setFrame] = useState(0);
  const reduceMotion = loadAccessibility().reduceMotion
    || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (reduceMotion) {
      setFrame(0);
      return;
    }
    const t = setInterval(() => setFrame((f) => (f + 1) % 4), Math.floor(1000 / fps));
    return () => clearInterval(t);
  }, [fps, reduceMotion]);
  return reduceMotion ? 0 : frame;
}

function SafetyBadge({ safe, size = 20 }: { safe: boolean; size?: number }) {
  const color = safe ? "#00ff88" : "#ff2d55";
  const glow = safe ? "0 0 8px rgba(0,255,136,0.8)" : "0 0 8px rgba(255,45,85,0.8)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ filter: `drop-shadow(${glow})` }}>
        <IconShield size={size} color={color} />
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 6, color, letterSpacing: 0.5 }}>
        {safe ? "SAFE" : "REVIEW"}
      </div>
    </div>
  );
}

export function DollhouseRoom({ member, onTap, coins, soldItems, purchasedItems }: { member: FamilyMember; onTap: (m: FamilyMember) => void; coins: number; soldItems: string[]; purchasedItems: string[] }) {
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
        <div style={{ position: "absolute", top: 10, left: 12, fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: member.primaryColor, opacity: 0.8 }}>
          {member.roomName}
        </div>
        <div style={{ position: "absolute", top: 24, left: 12, fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "#6b8ba4" }}>
          LVL {member.level}
        </div>
        <div style={{ position: "absolute", top: 38, left: 12, display: "flex", alignItems: "center", gap: 3 }}>
          <IconCoin size={8} color="#ffe66d" />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "#ffe66d" }}>
            {coins}
          </span>
        </div>
        <div style={{ position: "absolute", left: 8, bottom: 12, display: "flex", alignItems: "flex-end", gap: 3, maxWidth: 126 }}>
          {FURNITURE_STORE
            .filter(item => item.memberId === member.id && !soldItems.includes(item.id))
            .map(item => (
              <div key={item.id} title={item.name} style={{ width: 27, height: 30, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <FurnitureIcon itemId={item.id} size={26} />
              </div>
            ))}
        </div>
        {/* purchasedItems is the ownership source of truth; selling a shop item removes
            it there, while buying it again adds it back and should render it again. */}
        <PurchasedRoomFurniture itemIds={purchasedItems} accent={member.primaryColor} />
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <SafetyBadge safe={member.safeThisWeek} size={18} />
          <FamilyChar id={member.id} size={charSize} frame={frame} />
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: member.primaryColor }}>{member.name}</div>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 12, fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "#2a3a5c", lineHeight: 1.8 }}>
          TAP{"\n"}TO{"\n"}VIEW
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${member.primaryColor}22,${member.primaryColor}55,${member.primaryColor}22)`, borderTop: `2px solid ${member.primaryColor}44` }} />
      </div>
    </button>
  );
}