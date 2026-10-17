import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const SIZES: Record<string, { px: number; glyph: number }> = {
  "180": { px: 180, glyph: 0.62 },
  "192": { px: 192, glyph: 0.62 },
  "512": { px: 512, glyph: 0.62 },
  // 마스크 아이콘은 가장자리가 잘리므로 글자를 안쪽 안전 영역에 둔다
  maskable: { px: 512, glyph: 0.46 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const spec = SIZES[name];
  if (!spec) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3182f6",
          color: "#fffdf7",
          fontSize: spec.px * spec.glyph,
          fontWeight: 800,
        }}
      >
        H
      </div>
    ),
    { width: spec.px, height: spec.px },
  );
}
