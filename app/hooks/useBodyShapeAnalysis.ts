"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/app/libs/amplitude";

type AnalyzeSource = "example" | "upload";

export type BodyShapeKey =
  | "hourglass"
  | "pear"
  | "rectangle"
  | "inverted-triangle"
  | "apple"
  | "uncertain";

export type BodyShapeAnalysisResult = {
  perceivedGender: "male" | "female" | "unknown";
  shape: BodyShapeKey;
  shapeLabel: string;
  confidence: "low" | "medium" | "high";
  rationale: string | null;
  proportionNotes: string[];
  recommendations: string[];
  alternatives: string[];
  raw?: any;
};

type State = {
  analysis: BodyShapeAnalysisResult | null;
  loading: boolean;
  error: string | null;
};

const resolveToAbsoluteUrl = (url: string) => {
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return url;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isE005SensitiveFlag(msg: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("(e005)") ||
    m.includes("flagged as sensitive") ||
    m.includes("input or output was flagged as sensitive")
  );
}

function buildFriendlyErrorMessage(rawMsg: string) {
  const msg = rawMsg || "";
  const lower = msg.toLowerCase();

  if (lower.includes("monthly spend limit reached") || lower.includes("spend limit")) {
    return "Body-shape analysis is temporarily unavailable because the Replicate monthly spend limit was reached. Increase billing limit in Replicate and retry.";
  }

  if (lower.includes("insufficient credits")) {
    return "Body-shape analysis is temporarily unavailable due to insufficient Replicate credits.";
  }

  if (isE005SensitiveFlag(msg)) {
    return [
      "This image could not be processed.",
      "The moderation filter flagged it as sensitive.",
      "Try a different full-body photo in fitted clothing.",
    ].join("\n");
  }

  if (lower.includes("timed out")) {
    return "This analysis timed out. Please try again.";
  }

  return msg || "Something went wrong. Please try a different image.";
}

function normalizeShapeKey(input: unknown): BodyShapeKey {
  const raw = String(Array.isArray(input) ? input[0] : input ?? "")
    .trim()
    .toLowerCase();

  if (!raw) return "uncertain";
  if (raw.includes("hourglass") || raw.includes("x-shape") || raw.includes("x shape")) {
    return "hourglass";
  }
  if (
    raw.includes("inverted triangle") ||
    raw.includes("inverted-triangle") ||
    raw.includes("v-shape") ||
    raw.includes("v shape")
  ) {
    return "inverted-triangle";
  }
  if (raw.includes("pear") || (raw.includes("triangle") && !raw.includes("inverted"))) {
    return "pear";
  }
  if (raw.includes("apple") || raw.includes("oval") || raw.includes("round")) {
    return "apple";
  }
  if (raw.includes("rectangle") || raw.includes("straight") || raw.includes("column")) {
    return "rectangle";
  }

  return "uncertain";
}

function shapeLabel(shape: BodyShapeKey) {
  if (shape === "hourglass") return "Hourglass";
  if (shape === "pear") return "Pear (Triangle)";
  if (shape === "rectangle") return "Rectangle";
  if (shape === "inverted-triangle") return "Inverted Triangle";
  if (shape === "apple") return "Apple (Oval)";
  return "Uncertain";
}

function normalizeConfidence(input: unknown): "low" | "medium" | "high" {
  const value = String(Array.isArray(input) ? input[0] : input ?? "")
    .trim()
    .toLowerCase();
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function asStringArray(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizePerceivedGender(input: unknown): "male" | "female" | "unknown" {
  const value = String(Array.isArray(input) ? input[0] : input ?? "")
    .trim()
    .toLowerCase();
  if (value === "male") return "male";
  if (value === "female") return "female";
  return "unknown";
}

function normalizeResult(raw: any): BodyShapeAnalysisResult {
  const shape = normalizeShapeKey(
    raw?.analysis?.primary_body_shape ?? raw?.body_shape ?? raw?.shape ?? null
  );

  const confidence = normalizeConfidence(raw?.analysis?.confidence ?? raw?.confidence ?? null);

  const rationale = raw?.analysis?.shape_rationale ?? raw?.shape_rationale ?? raw?.rationale ?? null;

  const proportionNotes = asStringArray(raw?.analysis?.proportion_notes ?? raw?.proportion_notes);

  const recommendations = asStringArray(
    raw?.analysis?.styling_recommendations ??
      raw?.analysis?.recommendations ??
      raw?.styling_recommendations ??
      raw?.recommendations
  );

  const alternatives = asStringArray(raw?.analysis?.alternative_shapes ?? raw?.alternative_shapes);

  return {
    perceivedGender: normalizePerceivedGender(
      raw?.analysis?.perceived_gender ?? raw?.perceived_gender ?? null
    ),
    shape,
    shapeLabel: shapeLabel(shape),
    confidence,
    rationale: typeof rationale === "string" && rationale.trim() ? rationale.trim() : null,
    proportionNotes,
    recommendations,
    alternatives,
    raw,
  };
}

export function useBodyShapeAnalysis(
  imageUrl: string | null,
  options?: { source?: AnalyzeSource }
) {
  const source: AnalyzeSource = options?.source ?? "upload";
  const [state, setState] = useState<State>({
    analysis: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!imageUrl) {
      setState({ analysis: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      setState({ analysis: null, loading: true, error: null });

      try {
        const resolvedUrl = resolveToAbsoluteUrl(imageUrl);
        const response = await fetch(resolvedUrl, { cache: "no-store", signal });

        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) throw new Error(`Not an image: ${contentType}`);

        const blob = await response.blob();
        const base64WithMime = await blobToDataUrl(blob);

        const startRes = await fetch("/api/body-shape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64WithMime }),
          signal,
        });

        if (!startRes.ok) {
          let startErrDetail = "";
          try {
            const startErr = await startRes.json();
            startErrDetail = startErr?.detail || startErr?.error || startErr?.message || "";
          } catch {
            // Ignore parse failures.
          }

          const detailPart = startErrDetail ? ` - ${startErrDetail}` : "";
          throw new Error(`Body-shape analysis start failed (${startRes.status})${detailPart}`);
        }

        const startData = await startRes.json();
        const getUrl = startData?.getUrl;
        if (!getUrl) throw new Error("Body-shape analysis did not return getUrl");

        let finalResult: any = null;

        for (let i = 0; i < 240; i += 1) {
          if (signal.aborted) return;

          const statusRes = await fetch(`/api/body-shape/status?getUrl=${encodeURIComponent(getUrl)}`, {
            cache: "no-store",
            signal,
          });

          if (!statusRes.ok) {
            throw new Error(`Body-shape analysis status failed: ${statusRes.status}`);
          }

          const statusData = await statusRes.json();
          const status = statusData?.status;

          if (status === "failed" || status === "canceled") {
            throw new Error(statusData?.error || "Body-shape analysis failed");
          }

          if (status === "succeeded") {
            finalResult = statusData?.result;
            if (!finalResult) throw new Error("Model returned invalid JSON");
            break;
          }

          await sleep(1000);
        }

        if (!finalResult) throw new Error("Body-shape analysis timed out");

        const analysis = normalizeResult(finalResult);
        if (signal.aborted) return;

        trackEvent("Analyze Body Shape", {
          shape: analysis.shapeLabel,
          confidence: analysis.confidence,
          source,
        });

        setState({ analysis, loading: false, error: null });
      } catch (err: any) {
        if (signal.aborted) return;

        const rawMessage = err?.message ?? (typeof err === "string" ? err : "") ?? "Error";
        const friendly = buildFriendlyErrorMessage(rawMessage);

        console.error("Body shape error:", err);

        trackEvent("Analyze Body Shape Error", {
          "error type": isE005SensitiveFlag(rawMessage) ? "E005_sensitive" : "other",
          "error message": rawMessage.slice(0, 200),
          source,
        });

        setState({ analysis: null, loading: false, error: friendly });
      }
    };

    run();
    return () => controller.abort();
  }, [imageUrl, source]);

  return state;
}
