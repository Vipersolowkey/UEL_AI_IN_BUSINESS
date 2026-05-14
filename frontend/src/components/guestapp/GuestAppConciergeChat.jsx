import { useCallback, useEffect, useRef, useState } from "react";

import {
  consumeSseStream,
  normalizeStreamProviderError,
  normalizeUiErrorMessage,
} from "../../lib/dashboardApi";
import { guestAppConciergeChatStream } from "../../lib/guestAppApi";
import { useGuestAppBooking } from "./GuestAppBookingContext";

export default function GuestAppConciergeChat() {
  const { bookingRef, session } = useGuestAppBooking();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [modelHint, setModelHint] = useState("");
  const listRef = useRef(null);

  const guestName = session?.guest_name || "there";

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length) return prev;
      return [
        {
          role: "assistant",
          content: `Hi ${guestName} — glad you are here. I am the Azure Pearl concierge team on chat: Wi‑Fi, dining, housekeeping, checkout, your bill, or a straight answer if you are curious about another room type. For anything urgent, dial 0 from your room phone and someone will pick up right away.`,
        },
      ];
    });
  }, [open, guestName]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const priorHist = messages.map((m) => ({ role: m.role, content: m.content }));
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setModelHint("");

    try {
      const response = await guestAppConciergeChatStream({
        booking_ref: bookingRef,
        message: text,
        history: priorHist.slice(-24),
      });
      if (!response.ok) {
        let detail = response.statusText;
        try {
          const errBody = await response.json();
          detail = typeof errBody.detail === "string" ? errBody.detail : JSON.stringify(errBody.detail);
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      setMessages((current) => [...current, { role: "assistant", content: "" }]);

      await consumeSseStream(response, (event) => {
        if (event.type === "meta") return;
        if (event.type === "done") return;
        if (event.type === "model") {
          if (event.model_used) setModelHint(String(event.model_used));
          return;
        }
        if (event.type === "error") {
          const errorMessage = normalizeStreamProviderError(
            event,
            "Concierge AI unavailable. Check backend logs or API keys.",
          );
          setModelHint("provider_error");
          setMessages((current) => {
            const updated = [...current];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = { role: "assistant", content: errorMessage };
              return updated;
            }
            return [...updated, { role: "assistant", content: errorMessage }];
          });
          return;
        }
        if (event.type === "chunk") {
          setMessages((current) => {
            const updated = [...current];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: `${updated[lastIndex].content}${event.content || ""}`,
              };
              return updated;
            }
            return [...updated, { role: "assistant", content: event.content || "" }];
          });
        }
      });

      setMessages((current) => {
        const updated = [...current];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === "assistant" && !String(updated[lastIndex].content || "").trim()) {
          updated[lastIndex] = {
            role: "assistant",
            content:
              "Here is a quick offline suggestion: for dining use the Dine tab, for housekeeping use Me, and dial 0 for urgent help. If this message appeared unexpectedly, the AI stream ended without text — try again in a moment.",
          };
          return updated;
        }
        return current;
      });
    } catch (error) {
      const errorMessage = normalizeUiErrorMessage(
        error,
        "Could not stream concierge reply. Is the API server running?",
      );
      setMessages((current) => [
        ...current.filter(
          (item, index, array) => !(index === array.length - 1 && item.role === "assistant" && !item.content),
        ),
        { role: "assistant", content: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  }, [bookingRef, loading, messages]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[5.75rem] z-[35] flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-md justify-end">
          <button
            type="button"
            aria-label="Open guest care chat"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-600 text-white shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition hover:bg-emerald-500"
          >
            {open ? (
              <span className="text-lg font-semibold leading-none">×</span>
            ) : (
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3C7.03 3 3 6.58 3 11c0 2.05.9 3.94 2.45 5.33L4 21l5.02-1.33C9.62 20.2 10.78 20.5 12 20.5c4.97 0 9-3.58 9-8s-4.03-8-9-8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="11" r="1.1" fill="currentColor" />
                <circle cx="12" cy="11" r="1.1" fill="currentColor" />
                <circle cx="15" cy="11" r="1.1" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[45] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Close chat overlay"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-[46] flex max-h-[min(78vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#0f1714] shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-emerald-200/80">Care</p>
                <p className="text-sm font-semibold text-white">AI concierge</p>
                {modelHint && modelHint !== "provider_error" ? (
                  <p className="mt-0.5 text-[0.6rem] text-white/40">Model: {modelHint}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg, i) => (
                <div
                  key={`msg-${i}`}
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "ml-auto bg-emerald-600/90 text-emerald-950"
                      : "mr-auto border border-white/10 bg-white/[0.06] text-white/90"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading ? (
                <p className="text-xs text-emerald-200/70">Concierge is replying…</p>
              ) : null}
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-emerald-400/40 focus:outline-none"
                  placeholder="Message…"
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={loading || !input.trim()}
                  onClick={send}
                  className="shrink-0 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-[0.6rem] text-white/35">
                Streams from the backend LLM (Groq or Ollama from backend env). If no provider is configured, you get
                the offline keyword helper instead. Emergencies: dial 0.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
