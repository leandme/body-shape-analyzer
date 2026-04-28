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

  const system_prompt = `You are a careful visual anthropometry assistant.
Return ONLY valid JSON. No markdown. No extra text.`;

  const prompt = `
Estimate apparent adult height from the provided photo.
Use visual cues such as body proportions, perspective, camera angle, and environmental scale cues.
If the image is ambiguous, return lower confidence and a wider range.

Return JSON exactly in this shape:
{
  "version": "1.0",
  "photo_assessment": {
    "perceived_gender": "male" | "female" | "unknown"
  },
  "height_estimation": {
    "estimated_height_cm": number | null,
    "estimated_height_in": number | null,
    "height_range_cm": {
      "min": number,
      "max": number
    },
    "confidence_rating": "low" | "medium" | "high",
    "likely_height_band": "very_short" | "short" | "average" | "tall" | "very_tall" | "unknown",
    "key_cues": ["string"],
    "estimation_rationale": "string",
    "accuracy_improvements": ["string"]
  }
}

Rules:
- Height must be for adults only (not child growth prediction).
- Return estimated_height_cm to one decimal place when possible.
- Keep height_range_cm realistic and include uncertainty.
- Use 3 to 6 key_cues max.
- If full body is not visible or perspective is extreme, set confidence to "low".
- Do not provide medical advice or diagnosis.
- This is a visual estimate and not a clinical measurement.
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
          system_prompt,
          image_input: [imageBase64],
          reasoning_effort: "low",
          max_completion_tokens: 14000,
        },
      }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok) {
      console.error("Replicate create prediction error (height-estimate):", createJson);
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
      console.error("Unexpected Replicate response (height-estimate):", createJson);
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
    console.error("Replicate call failed (height-estimate):", err);
    return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 });
  }
}
