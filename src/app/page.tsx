"use client";

import { useRef, useState } from "react";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "안녕! 나는 햄순이야 🐹🍌 뭐 도와줄까?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  async function send() {
    const content = input.trim();
    if (!content || loading) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setTimeout(scrollToBottom, 10);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await r.json();
      const reply: string = data?.text ?? "앗… 오류가 났어 🥺";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 난 것 같아 🥺" },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 10);
    }
  }

  return (
  <div className="min-h-screen kawa-bg">
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="sticker rounded-3xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐹</span>
              <div className="text-lg font-extrabold">햄수니</div>
            </div>
            <div className="mt-0.5 text-xs text-black/55">말랑 스티커 모드 · Gemini 연결됨</div>
          </div>

          <div className="sticker pop rounded-full px-3 py-2 text-sm">
            오늘의 기분 <span className="ml-1">🍌</span>
          </div>
        </div>

        <div className="sticker pop rounded-full px-4 py-2 text-sm">
          상태:{" "}
          <span className="ml-1 font-semibold">
            {loading ? "🐹💦 햄순이 생각중…" : "🐹✨ 햄순이 대기중"}
          </span>
        </div>
      </div>

      {/* Quick chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["공부 루틴 짜줘", "귀엽게 응원해줘", "논문 3줄 요약", "코드 에러 봐줘"].map((q) => (
          <button
            key={q}
            onClick={() => {
              setInput(q);
              setTimeout(() => send(), 0);
            }}
            className="sticker pop rounded-full px-4 py-2 text-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat card */}
      <div className="card rounded-[28px] p-4">
        <div className="h-[62vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "bubble " +
                  (m.role === "user"
                    ? "tail-right bg-gradient-to-r from-[#cfefff] to-[#ffe0c7]"
                    : "tail-left bg-white")
                }
                style={{ borderRadius: 22, padding: "12px 14px", maxWidth: "80%" }}
              >
                {m.role === "assistant" && (
                  <div className="mb-1 text-[11px] text-black/45">
                    🐹 햄순이
                  </div>
                )}
                <div className="text-sm leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="mb-3 flex justify-start">
              <div className="bubble tail-left rounded-[22px] bg-white px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  🐹💦
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce [animation-delay:120ms]">·</span>
                    <span className="animate-bounce [animation-delay:240ms]">·</span>
                  </span>
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="햄수니에게 말 걸어줘…"
            className="bubble flex-1 rounded-[22px] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-200"
          />
          <button
            onClick={send}
            className="sticker pop rounded-[22px] px-4 py-3 text-sm font-extrabold"
          >
            보내기 🍌
          </button>
        </div>

        <div className="mt-3 text-xs text-black/45">
          팁: “햄스터처럼 귀엽게 말해줘”라고 하면 더 찰떡이야.
        </div>
      </div>
    </div>
  </div>
);}
