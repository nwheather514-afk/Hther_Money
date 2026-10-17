import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.5-flash-lite";

const PROMPT = `이 영수증 이미지에서 아래 3가지를 읽어 JSON으로 답하세요.
- amount: 손님이 실제로 낸 "최종 결제 합계 금액"(정수, 원 단위). '합계', '결제금액', '받을금액', '카드승인금액' 등 최종 합계를 쓰고, 부가세(VAT)·공급가액·과세물품가액·받은 돈·거스름돈·할인 전 금액은 쓰지 마세요.
- date: 결제 날짜를 YYYY-MM-DD 형식으로.
- place: 상호(가게 이름).
이미지가 영수증이 아니거나 읽을 수 없는 항목은 추측하지 말고 null로 두세요.`;

const schema = {
  type: "OBJECT",
  properties: {
    amount: { type: "INTEGER", nullable: true },
    date: { type: "STRING", nullable: true },
    place: { type: "STRING", nullable: true },
  },
  required: ["amount", "date", "place"],
};

function validDate(s: unknown): string | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null;
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "서버에 Gemini API 키가 설정되지 않았어요" }, { status: 500 });
  }

  const { image, mimeType } = (await req.json().catch(() => ({}))) as {
    image?: string;
    mimeType?: string;
  };
  if (!image || !mimeType?.startsWith("image/")) {
    return NextResponse.json({ error: "이미지를 확인할 수 없어요" }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: image } }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
      }),
    },
  );
  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    return NextResponse.json({ error: "영수증을 읽는 중 문제가 생겼어요" }, { status: 502 });
  }

  let parsed: { amount?: unknown; date?: unknown; place?: unknown } = {};
  try {
    const json = await res.json();
    parsed = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  } catch {
    // 읽지 못한 것으로 처리
  }

  const amount =
    typeof parsed.amount === "number" && Number.isInteger(parsed.amount) && parsed.amount > 0
      ? parsed.amount
      : null;
  const place = typeof parsed.place === "string" && parsed.place.trim() ? parsed.place.trim() : null;

  return NextResponse.json({ amount, date: validDate(parsed.date), place });
}
