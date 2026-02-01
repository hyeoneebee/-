import { NextResponse } from "next/server";
console.log("KEY EXISTS?", !!process.env.GEMINI_API_KEY);

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: Msg[] };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const model = "gemini-2.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      apiKey;

    const contents = (messages ?? []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(data, { status: r.status });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
