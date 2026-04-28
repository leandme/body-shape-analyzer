import { NextRequest, NextResponse } from "next/server";

type ReqBody = {
  imageBase64?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReqBody;
  const { imageBase64 } = body;

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN" },
      { status: 500 }
    );
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const systemPrompt =
    "You are a careful body-shape analysis assistant. Return ONLY valid JSON and no extra text.";

  const prompt = `
Analyze the person in the image and estimate their likely body shape from visual appearance.

Return JSON exactly in this shape:
{
  "version": "1.0",
  "photo_assessment": {
    "perceived_gender": "male" | "female" | "unknown",
    "body_shape": "hourglass" | "triangle" | "rectangle" | "inverted-triangle" | "oval" | "trapezoid"
  },
  "analysis": {
    "confidence_rating": "low" | "medium" | "high",
    "rationale": "string",
    "improvements": ["string"]
  }
}

Rules:
- For women body_shape should be one of: "hourglass", "triangle", "rectangle", "inverted-triangle", "oval".
- For men body_shape should be one of: "trapezoid", "triangle", "rectangle", "inverted-triangle", "oval".
- Choose the single best-fit shape.
- Do not output markdown.
`.trim();

  try {
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "e526a4c7f3e940fa28e7e6bdf3a00ac35e11f004e10c5fb12b51f576663de814",
        input: {
          prompt,
          system_prompt: systemPrompt,
          image_input: [imageBase64],
          reasoning_effort: "low",
          max_completion_tokens: 12000,
        },
      }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok) {
      console.error("Replicate create prediction error:", createJson);
      const upstreamStatus =
        createRes.status >= 400 && createRes.status <= 599 ? createRes.status : 502;
      const detail = createJson?.detail || createJson?.error || createJson?.message || null;

      return NextResponse.json(
        {
          error: "Replicate create prediction failed",
          detail,
          details: createJson,
        },
        { status: upstreamStatus }
      );
    }

    if (!createJson?.urls?.get) {
      console.error("Unexpected Replicate response:", createJson);
      return NextResponse.json(
        { error: "Invalid Replicate response", details: createJson },
        { status: 500 }
      );
    }

    return NextResponse.json({
      predictionId: createJson.id,
      getUrl: createJson.urls.get,
    });
  } catch (err) {
    console.error("Replicate call failed:", err);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}
