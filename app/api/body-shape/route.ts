import { NextRequest, NextResponse } from "next/server";

type ReqBody = {
  imageBase64?: string;
};

const REPLICATE_MODEL_VERSION =
  "e526a4c7f3e940fa28e7e6bdf3a00ac35e11f004e10c5fb12b51f576663de814";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReqBody;
  const { imageBase64 } = body;

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const systemPrompt = `You are a careful visual body-shape analyst.
Return ONLY valid JSON. No markdown. No extra text.`;

  const prompt = `
Analyze the person's visual body shape from the provided image.
Classify the PRIMARY body shape into one of:
- "hourglass"
- "pear"
- "rectangle"
- "inverted_triangle"
- "apple"
- "uncertain"

Use visible shoulder width, bust/chest width, waist definition, and hip width.
If a full-body view is not clear, lower confidence and use "uncertain" if needed.

Return JSON exactly in this shape:
{
  "version": "1.0",
  "analysis": {
    "perceived_gender": "male" | "female" | "unknown",
    "primary_body_shape": "hourglass" | "pear" | "rectangle" | "inverted_triangle" | "apple" | "uncertain",
    "alternative_shapes": ["string"],
    "confidence": "low" | "medium" | "high",
    "shape_rationale": "string",
    "proportion_notes": ["string"],
    "styling_recommendations": ["string"]
  }
}

Rules:
- Do not provide medical advice or diagnosis.
- Keep rationale practical and concise.
- Limit proportion_notes and styling_recommendations to 3-5 items each.
`.trim();

  try {
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL_VERSION,
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
      console.error("Replicate create prediction error (body-shape):", createJson);
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
      console.error("Unexpected Replicate response (body-shape):", createJson);
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
    console.error("Replicate call failed (body-shape):", err);
    return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 });
  }
}
