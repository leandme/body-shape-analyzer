import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const getUrl = new URL(req.url).searchParams.get("getUrl");

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
  }

  if (!getUrl) {
    return NextResponse.json({ error: "Missing getUrl" }, { status: 400 });
  }

  const pollRes = await fetch(getUrl, {
    headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
    cache: "no-store",
  });

  const prediction = await pollRes.json();

  const text =
    Array.isArray(prediction.output) ? prediction.output.join("") : String(prediction.output ?? "");

  let estimate: any = null;
  try {
    estimate = text ? JSON.parse(text) : null;
  } catch {
    estimate = text ? { raw: text } : null;
  }

  return NextResponse.json({
    status: prediction.status,
    estimate,
    error: prediction.error ?? null,
  });
}

