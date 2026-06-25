import { useCallback, useMemo, useState } from "react";
import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { CLIENT_TOOL_NAME } from "../../data/voiceAgent";
import { sendVoiceLead } from "../../lib/sendVoiceLead";
import VoicePixelMascot from "./VoicePixelMascot";
import "./VoiceAgent.css";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

function Waveform({ active }) {
  return (
    <div className={`voice-agent__wave ${active ? "" : "is-idle"}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

function VoiceAgentPanel({ onClose }) {
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState(false);
  const [starting, setStarting] = useState(false);

  const connected = status === "connected";
  const connecting = status === "connecting";

  const statusLabel = useMemo(() => {
    if (connecting) return "Connecting…";
    if (!connected) return "Pick up";
    if (isSpeaking) return "Speaking";
    return "Listening";
  }, [connected, connecting, isSpeaking]);

  const hint = useMemo(() => {
    if (connecting) return "Getting the line ready — allow mic access if prompted.";
    if (!connected) {
      return "Ask about Kavina's work. If you want something built, the agent will connect you.";
    }
    if (isSpeaking) return "Hang on — I'm talking.";
    return "Your turn. Ask anything, or say you want to hire Kavina for a project.";
  }, [connected, connecting, isSpeaking]);

  const startCall = async () => {
    setStarting(true);
    setToast("");
    setToastError(false);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startSession({
        agentId: AGENT_ID,
        onError: (message) => {
          setToast(message || "Connection failed.");
          setToastError(true);
        },
      });
    } catch (err) {
      const denied = err?.name === "NotAllowedError";
      setToast(
        denied
          ? "Microphone access is needed for the voice agent."
          : err?.message || "Could not start the call."
      );
      setToastError(true);
    } finally {
      setStarting(false);
    }
  };

  const hangUp = async () => {
    await endSession();
    onClose?.();
  };

  return (
    <div className="voice-agent__panel" role="dialog" aria-label="Voice agent">
      <p className="voice-agent__label">Voice layer</p>
      <p className="voice-agent__status">{statusLabel}</p>
      <p className="voice-agent__hint">{hint}</p>

      <Waveform active={connected && (isSpeaking || !isMuted)} />

      <div className="voice-agent__actions">
        {!connected ? (
          <>
            <button type="button" onClick={onClose} disabled={connecting || starting}>
              Not now
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={startCall}
              disabled={connecting || starting}
            >
              {connecting || starting ? "Connecting…" : "Start call"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setMuted(!isMuted)}>
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button type="button" className="is-primary" onClick={hangUp}>
              End call
            </button>
          </>
        )}
      </div>

      {toast && (
        <p className={`voice-agent__toast ${toastError ? "is-error" : ""}`}>{toast}</p>
      )}
    </div>
  );
}

function VoiceAgentLauncher() {
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const [open, setOpen] = useState(false);
  const connected = status === "connected";
  const connecting = status === "connecting";

  return (
    <div className="voice-agent">
      {open && <VoiceAgentPanel onClose={() => setOpen(false)} />}

      <VoicePixelMascot
        open={open}
        connected={connected}
        connecting={connecting}
        isSpeaking={isSpeaking}
        onClick={() => setOpen((v) => !v)}
      />
    </div>
  );
}

export default function VoiceAgent() {
  const submitLead = useCallback(async (params) => {
    try {
      const result = await sendVoiceLead(params);
      if (result.method === "mailto") {
        return "Lead prepared in your email app — ask the visitor to confirm send if needed.";
      }
      return "Lead sent to Kavina. She'll reach out soon.";
    } catch (err) {
      return `Could not send the lead: ${err.message}. Ask them to use the contact form instead.`;
    }
  }, []);

  const clientTools = useMemo(
    () => ({
      [CLIENT_TOOL_NAME]: submitLead,
    }),
    [submitLead]
  );

  if (!AGENT_ID) return null;

  return (
    <ConversationProvider clientTools={clientTools}>
      <VoiceAgentLauncher />
    </ConversationProvider>
  );
}
