import { useCallback } from "react";
import { useConversationControls } from "@elevenlabs/react";
import OrbFluid from "./OrbFluid";
import "./VoiceOrb.css";

function scaleVolume(raw) {
  if (!Number.isFinite(raw)) return 0;
  return Math.min(1, Math.pow(Math.max(0, raw), 0.5) * 2.5);
}

/**
 * Fixed-corner KAI mark — same homepage fluid, always in motion.
 */
export default function VoiceOrb({
  onClick,
  open,
  connected,
  connecting,
  isSpeaking,
}) {
  const { getInputVolume, getOutputVolume } = useConversationControls();

  const getIntensity = useCallback(() => {
    if (!connected) return 0.52;
    try {
      const out = scaleVolume(getOutputVolume?.() ?? 0);
      const inn = scaleVolume(getInputVolume?.() ?? 0);
      return Math.min(1, 0.38 + Math.max(out, inn) * 0.95);
    } catch {
      return 0.52;
    }
  }, [connected, getInputVolume, getOutputVolume]);

  return (
    <button
      type="button"
      className={[
        "voice-orb",
        connected && "is-live",
        connecting && "is-connecting",
        open && "is-open",
        isSpeaking && "is-speaking",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "Close voice agent" : "Talk to KAI, the voice agent"}
      data-cursor
    >
      <span className="voice-orb__halo" aria-hidden="true" />
      <span className="voice-orb__halo voice-orb__halo--soft" aria-hidden="true" />
      <OrbFluid className="voice-orb__canvas" getIntensity={getIntensity} />
      <span className="voice-orb__label">KAI</span>
    </button>
  );
}
