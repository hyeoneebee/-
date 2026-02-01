"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Conversation = {
  id: string;
  title: string;
  messages: Msg[];
  createdAt: number;
};

const STORAGE_KEY = "hamsuni-conversations";

function newConversation(): Conversation {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2);

  return {
    id,
    title: "새 대화",
    createdAt: Date.now(),
    messages: [{ role: "assistant", content: "안녕! 나는 햄순이야 🐹🍌 뭐 도와줄까?" }],
  };
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo(
    () => conversations.find((c) => c.id === currentId) ?? null,
    [conversations, currentId]
  );

  const messages = current?.messages ?? [];

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  // ✅ 1) 최초 로딩: localStorage에서 복원 (없으면 기본 1개 생성)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Conversation[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 최신 대화를 위로 보이게 정렬(원하면 제거 가능)
          const sorted = [...parsed].sort((a, b) => b.createdAt - a.createdAt);
          setConversations(sorted);
          setCurrentId(sorted[0].id);
          return;
        }
      } catch {
        // 깨졌으면 새로 생성
      }
    }

    const first = newConversation();
    setConversations([first]);
    setCurrentId(first.id);
  }, []);

  // ✅ 2) conversations가 바뀔 때마다 저장
  useEffect(() => {
    if (conversations.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // 현재 대화의 메시지가 바뀌면 스크롤
  useEffect(() => {
    setTimeout(scrollToBottom, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, messages.length]);

  function createNewChat() {
    const conv = newConversation();
    setConversations((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    setInput("");
  }

  function deleteChat(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);

      // 현재 대화를 지웠으면, 다음으로 전환
      if (id === currentId) {
        const fallback = next[0]?.id ?? null;
        setCurrentId(fallback);

        // 다 지워져버리면 1개 다시 생성
        if (!fallback) {
          const fresh = newConversation();
          setCurrentId(fresh.id);
          return [fresh];
        }
      }

      return next.length ? next : [newConversation()];
    });
  }

  function updateCurrentMessages(nextMessages: Msg[]) {
    if (!currentId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === currentId ? { ...c, messages: nextMessages } : c))
    );
  }

  function appendToCurrent(msg: Msg) {
    updateCurrentMessages([...messages, msg]);
  }

  async function send() {
    const content = input.trim();
    if (!content || loading || !currentId) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content }];
    updateCurrentMessages(nextMessages);

    // 제목 자동: "새 대화"일 때 첫 사용자 메시지로 제목 바꾸기
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c;
        if (c.title !== "새 대화") return c;
        const title = content.length > 16 ? content.slice(0, 16) + "…" : content;
        return { ...c, title };
      })
    );

    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await r.json();
      const reply: string = data?.text ?? data?.error ?? "앗… 오류가 났어 🥺";

      appendToCurrent({ role: "assistant", content: reply });
    } catch {
      appendToCurrent({ role: "assistant", content: "네트워크 오류가 난 것 같아 🥺" });
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 10);
    }
  }

  return (
    <div className="min-h-screen kawa-bg">
      <div className="mx-auto flex max-w-6xl gap-4 px-4 py-6">
        {/* ✅ Sidebar */}
        <aside className="hidden w-72 shrink-0 sm:block">
          <div className="sticker rounded-[22px] p-3">
            <button
              onClick={createNewChat}
              className="sticker pop w-full rounded-[16px] px-3 py-3 text-sm font-extrabold"
            >
              ➕ 새 대화
            </button>

            <div className="mt-3 space-y-1">
              {conversations.map((c) => {
                const active = c.id === currentId;
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentId(c.id)}
                      className={
                        "flex-1 rounded-[14px] px-3 py-2 text-left text-sm " +
                        (active ? "bg-yellow-200 font-extrabold" : "hover:bg-black/5")
                      }
                    >
                      🐹 {c.title}
                      <div className="mt-0.5 text-[11px] text-black/45">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </button>

                    <button
                      onClick={() => deleteChat(c.id)}
                      className="sticker pop rounded-[14px] px-2 py-2 text-xs"
                      title="대화 삭제"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-black/45">
              팁: 제목은 첫 메시지로 자동 생성돼!
            </div>
          </div>
        </aside>

        {/* ✅ Main */}
        <main className="flex-1">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="sticker rounded-3xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐹</span>
                  <div className="text-lg font-extrabold">햄순이</div>
                </div>
                <div className="mt-0.5 text-xs text-black/55">
                  말랑 스티커 모드 · 멀티 세션 저장됨
                </div>
              </div>

              <div className="sticker pop rounded-full px-3 py-2 text-sm">
                오늘의 기분 <span className="ml-1">🍌</span>
              </div>

              {/* 모바일에서는 새 대화 버튼을 헤더에 */}
              <button
                onClick={createNewChat}
                className="sticker pop rounded-full px-3 py-2 text-sm sm:hidden"
              >
                ➕ 새 대화
              </button>
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
            <div className="h-[66vh] overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
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
                      <div className="mb-1 text-[11px] text-black/45">🐹 햄순이</div>
                    )}
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ ...props }) => (
                            <a {...props} className="underline" target="_blank" rel="noreferrer" />
                          ),
                          ul: ({ ...props }) => <ul className="list-disc pl-5" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-5" {...props} />,
                          strong: ({ ...props }) => <strong className="font-extrabold" {...props} />,
                          pre: ({ ...props }) => (
                            <pre className="mt-2 overflow-x-auto rounded-xl bg-black/5 p-3 text-xs" {...props} />
                          ),
                          code: ({ children, ...props }) => (
                            <code className="rounded-md bg-black/5 px-1 py-0.5 text-[0.9em]" {...props}>
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>


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
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="햄순이에게 말 걸어줘…"
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
              왼쪽 목록에서 대화를 바꿀 수 있어! (모바일은 상단 ➕ 새 대화)
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
