import { NextRequest, NextResponse } from "next/server";

function tryParseJson(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const getUrl = new URL(req.url).searchParams.get("getUrl");

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
  }

  if (!getUrl) {
    return NextResponse.json({ error: "Missing getUrl" }, { status: 400 });
  }

  const pollRes = await fetch(getUrl, {
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!pollRes.ok) {
    const details = await pollRes.text();
    return NextResponse.json({ error: "Replicate status request failed", details }, { status: 502 });
  }

  const pred = await pollRes.json();
  const text = Array.isArray(pred.output) ? pred.output.join("") : String(pred.output ?? "");
  const result = tryParseJson(text);

  return NextResponse.json({
    status: pred.status,
    result: result ?? null,
    raw: result ? null : text || null,
    error: pred.error ?? null,
  });
}
