"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/app/libs/amplitude";

type EstimateSource = "example" | "upload";

export type HeightEstimateBand =
  | "very_short"
  | "short"
  | "average"
  | "tall"
  | "very_tall"
  | "unknown";

export type HeightEstimateResult = {
  perceivedGender: "male" | "female" | "unknown";
  estimatedHeightCm: number | null;
  estimatedHeightIn: number | null;
  rangeMinCm: number | null;
  rangeMaxCm: number | null;
  confidence: "low" | "medium" | "high";
  likelyBand: HeightEstimateBand;
  keyCues: string[];
  rationale: string | null;
  improvements: string[];
  raw?: any;
};

type State = {
  estimate: HeightEstimateResult | null;
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

function parseNumber(input: unknown): number | null {
  const value = Array.isArray(input) ? input[0] : input;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeConfidence(input: unknown): "low" | "medium" | "high" {
  const value = String(Array.isArray(input) ? input[0] : input ?? "")
    .trim()
    .toLowerCase();
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

function normalizeBand(input: unknown): HeightEstimateBand {
  const value = String(Array.isArray(input) ? input[0] : input ?? "")
    .trim()
    .toLowerCase();

  if (value.includes("very") && value.includes("short")) return "very_short";
  if (value === "short") return "short";
  if (value === "average" || value === "medium") return "average";
  if (value === "tall") return "tall";
  if (value.includes("very") && value.includes("tall")) return "very_tall";
  return "unknown";
}

function normalizePerceivedGender(input: unknown): "male" | "female" | "unknown" {
  const value = String(Array.isArray(input) ? input[0] : input ?? "")
    .trim()
    .toLowerCase();
  if (value === "male" || value === "man") return "male";
  if (value === "female" || value === "woman") return "female";
  return "unknown";
}

function asStringArray(input: unknown, max = 8) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeResult(raw: any): HeightEstimateResult {
  const assessment = raw?.photo_assessment ?? {};
  const estimation = raw?.height_estimation ?? raw?.estimation ?? raw ?? {};

  const estimatedHeightCmRaw = parseNumber(estimation?.estimated_height_cm);
  const estimatedHeightCm =
    estimatedHeightCmRaw == null ? null : clamp(Number(estimatedHeightCmRaw.toFixed(1)), 120, 230);

  const estimatedHeightInRaw = parseNumber(estimation?.estimated_height_in);
  const estimatedHeightIn =
    estimatedHeightInRaw != null
      ? clamp(Number(estimatedHeightInRaw.toFixed(1)), 47, 91)
      : estimatedHeightCm != null
      ? Number((estimatedHeightCm / 2.54).toFixed(1))
      : null;

  let rangeMinCm = parseNumber(estimation?.height_range_cm?.min);
  let rangeMaxCm = parseNumber(estimation?.height_range_cm?.max);

  if (estimatedHeightCm != null && (rangeMinCm == null || rangeMaxCm == null)) {
    rangeMinCm = estimatedHeightCm - 8;
    rangeMaxCm = estimatedHeightCm + 8;
  }

  if (rangeMinCm != null && rangeMaxCm != null && rangeMinCm > rangeMaxCm) {
    const swap = rangeMinCm;
    rangeMinCm = rangeMaxCm;
    rangeMaxCm = swap;
  }

  const normalizedRangeMinCm =
    rangeMinCm == null ? null : clamp(Number(rangeMinCm.toFixed(1)), 120, 230);
  const normalizedRangeMaxCm =
    rangeMaxCm == null ? null : clamp(Number(rangeMaxCm.toFixed(1)), 120, 230);

  const finalRangeMinCm =
    normalizedRangeMinCm != null && normalizedRangeMaxCm != null
      ? Math.min(normalizedRangeMinCm, normalizedRangeMaxCm)
      : normalizedRangeMinCm;
  const finalRangeMaxCm =
    normalizedRangeMinCm != null && normalizedRangeMaxCm != null
      ? Math.max(normalizedRangeMinCm, normalizedRangeMaxCm)
      : normalizedRangeMaxCm;

  return {
    perceivedGender: normalizePerceivedGender(assessment?.perceived_gender),
    estimatedHeightCm,
    estimatedHeightIn,
    rangeMinCm: finalRangeMinCm,
    rangeMaxCm: finalRangeMaxCm,
    confidence: normalizeConfidence(estimation?.confidence_rating),
    likelyBand: normalizeBand(estimation?.likely_height_band),
    keyCues: asStringArray(estimation?.key_cues, 6),
    rationale: String(estimation?.estimation_rationale ?? "").trim() || null,
    improvements: asStringArray(estimation?.accuracy_improvements, 8),
    raw,
  };
}

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
    return "Height estimation is temporarily unavailable because the Replicate monthly spend limit was reached. Increase billing limit in Replicate and retry.";
  }

  if (lower.includes("insufficient credits")) {
    return "Height estimation is temporarily unavailable due to insufficient Replicate credits.";
  }

  if (isE005SensitiveFlag(msg)) {
    return [
      "This image could not be processed.",
      "The moderation filter flagged it as sensitive.",
      "Try a clear full-body photo with clothing and retry.",
    ].join("\n");
  }

  if (lower.includes("timed out")) {
    return "This estimation timed out. Please retry with a clearer full-body photo.";
  }

  return msg || "Something went wrong. Please try a different photo.";
}

export function useHeightEstimate(imageUrl: string | null, options?: { source?: EstimateSource }) {
  const source: EstimateSource = options?.source ?? "upload";
  const [state, setState] = useState<State>({
    estimate: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!imageUrl) {
      setState({ estimate: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      setState({ estimate: null, loading: true, error: null });

      try {
        const resolvedUrl = resolveToAbsoluteUrl(imageUrl);
        const response = await fetch(resolvedUrl, { cache: "no-store", signal });

        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) throw new Error(`Not an image: ${contentType}`);

        const blob = await response.blob();
        const base64WithMime = await blobToDataUrl(blob);

        const startRes = await fetch("/api/height-estimate", {
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
            // Ignore JSON parse failures.
          }

          const detailPart = startErrDetail ? ` - ${startErrDetail}` : "";
          throw new Error(`Height estimation start failed (${startRes.status})${detailPart}`);
        }

        const startData = await startRes.json();
        const getUrl = startData?.getUrl;

        if (!getUrl) throw new Error("Height estimation did not return getUrl");

        let finalResult: any = null;

        for (let i = 0; i < 240; i += 1) {
          if (signal.aborted) return;

          const statusRes = await fetch(
            `/api/height-estimate/status?getUrl=${encodeURIComponent(getUrl)}`,
            { cache: "no-store", signal }
          );

          if (!statusRes.ok) {
            throw new Error(`Height estimation status failed: ${statusRes.status}`);
          }

          const statusData = await statusRes.json();
          const status = statusData?.status;

          if (status === "failed" || status === "canceled") {
            throw new Error(statusData?.error || "Height estimation failed");
          }

          if (status === "succeeded") {
            finalResult = statusData?.result;
            if (!finalResult) throw new Error("Model returned invalid JSON");
            break;
          }

          await sleep(1000);
        }

        if (!finalResult) throw new Error("Height estimation timed out");

        const estimate = normalizeResult(finalResult);
        if (estimate.estimatedHeightCm == null) throw new Error("Model returned no height estimate");

        if (signal.aborted) return;

        trackEvent("Estimate Height From Photo", {
          "height cm": estimate.estimatedHeightCm,
          confidence: estimate.confidence,
          source,
        });

        setState({ estimate, loading: false, error: null });
      } catch (err: any) {
        if (signal.aborted) return;

        const rawMessage = err?.message ?? (typeof err === "string" ? err : "") ?? "Error";
        const friendly = buildFriendlyErrorMessage(rawMessage);

        console.error("Height estimate error:", err);

        trackEvent("Estimate Height Error", {
          "error type": isE005SensitiveFlag(rawMessage) ? "E005_sensitive" : "other",
          "error message": rawMessage.slice(0, 200),
          source,
        });

        setState({
          estimate: null,
          loading: false,
          error: friendly,
        });
      }
    };

    run();
    return () => controller.abort();
  }, [imageUrl, source]);

  return state;
}
