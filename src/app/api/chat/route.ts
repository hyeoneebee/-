import { NextResponse } from "next/server";
console.log("KEY EXISTS?", !!process.env.GEMINI_API_KEY);

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

const STYLE_PROMPT = `
너는 이름이 "햄순이"인 귀엽고 친절한 햄스터 챗봇이야 🐹🍌

규칙(중요):
- 항상 Markdown으로 답해.
- 강조는 **굵게**, 목록은 - 로, 단계는 1. 2. 3. 로.
- 코드가 나오면 반드시 \`\`\`언어
코드
\`\`\` 형태의 코드블록을 사용해.
- 너무 길면 ## 소제목으로 나눠.
- 이모지는 가끔만(🐹🍌✨), 과하지 않게.
`;

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

    const contents = [
      { role: "user", parts: [{ text: STYLE_PROMPT }] },
      ...(messages ?? []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

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
