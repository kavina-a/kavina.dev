import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { CLIENT_TOOL_NAME } from "../../data/voiceAgent";
import { sendVoiceLead } from "../../lib/sendVoiceLead";
import VoiceOrb from "./VoiceOrb";
import "./VoiceAgent.css";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
const MAX_CALL_MS = 2 * 60 * 1000;
const WRAP_UP_MS = 20 * 1000;

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Waveform({ active }) {
  return (
    <div className={`voice-agent__wave ${active ? "" : "is-idle"}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

function VoiceAgentPanel({
  onClose,
  remainingMs,
  toast,
  toastError,
}) {
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();
  const [starting, setStarting] = useState(false);
  const [localToast, setLocalToast] = useState("");
  const [localError, setLocalError] = useState(false);

  const connected = status === "connected";
  const connecting = status === "connecting";
  const shownToast = toast || localToast;
  const shownError = toast ? toastError : localError;

  const hint = useMemo(() => {
    if (connecting) return "Getting the line ready — allow mic access if prompted.";
    if (!connected) {
      return "Two minutes max. Ask about Kavina's work — if you want something built, KAI will connect you.";
    }
    if (remainingMs <= WRAP_UP_MS) return "Wrapping up — that's the two-minute limit.";
    if (isSpeaking) return "Hang on — I'm talking.";
    return "Your turn. Ask anything, or say you want to hire Kavina for a project.";
  }, [connected, connecting, isSpeaking, remainingMs]);

  const startCall = async () => {
    setStarting(true);
    setLocalToast("");
    setLocalError(false);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startSession({
        agentId: AGENT_ID,
        onError: (message) => {
          setLocalToast(message || "Connection failed.");
          setLocalError(true);
        },
      });
    } catch (err) {
      const denied = err?.name === "NotAllowedError";
      setLocalToast(
        denied
          ? "Microphone access is needed for the voice agent."
          : err?.message || "Could not start the call."
      );
      setLocalError(true);
    } finally {
      setStarting(false);
    }
  };

  const hangUp = async () => {
    await endSession();
    onClose?.();
  };

  return (
    <div className="voice-agent__panel" role="dialog">
      {connected && (
        <p className={`voice-agent__timer ${remainingMs <= WRAP_UP_MS ? "is-ending" : ""}`}>
          {formatClock(remainingMs)} left
        </p>
      )}

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

      {shownToast && (
        <p className={`voice-agent__toast ${shownError ? "is-error" : ""}`}>{shownToast}</p>
      )}
    </div>
  );
}

function VoiceAgentLauncher() {
  const { endSession, sendContextualUpdate } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const [open, setOpen] = useState(false);
  const [remainingMs, setRemainingMs] = useState(MAX_CALL_MS);
  const [limitToast, setLimitToast] = useState("");
  const connected = status === "connected";
  const connecting = status === "connecting";
  const warnedRef = useRef(false);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!connected) {
      setRemainingMs(MAX_CALL_MS);
      warnedRef.current = false;
      endedRef.current = false;
      return;
    }

    const startedAt = Date.now();
    setLimitToast("");

    const tick = () => {
      const left = Math.max(0, MAX_CALL_MS - (Date.now() - startedAt));
      setRemainingMs(left);

      if (!warnedRef.current && left <= WRAP_UP_MS && left > 0) {
        warnedRef.current = true;
        try {
          sendContextualUpdate(
            "About 20 seconds remain. Wrap up in one short sentence. If they still need Kavina, point them to the contact form."
          );
        } catch {
          /* ignore */
        }
      }

      if (!endedRef.current && left <= 0) {
        endedRef.current = true;
        endSession();
        setLimitToast(
          "Two minutes is the max for KAI. Use the contact form below if you want to keep going."
        );
        setOpen(true);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [connected, endSession, sendContextualUpdate]);

  return (
    <>
      <VoiceOrb
        open={open}
        connected={connected}
        connecting={connecting}
        isSpeaking={isSpeaking}
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <div className="voice-agent">
          <VoiceAgentPanel
            onClose={() => setOpen(false)}
            remainingMs={remainingMs}
            toast={limitToast}
            toastError={false}
          />
        </div>
      )}
    </>
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
