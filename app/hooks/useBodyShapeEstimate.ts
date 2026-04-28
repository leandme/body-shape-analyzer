"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/app/libs/amplitude";
import { normalizeBodyShapeKey, type BodyShapeKey } from "@/app/libs/body-shape";

type EstimateSource = "example" | "upload";

type EstimateResult = {
  perceivedGender: "male" | "female" | "unknown";
  bodyShape: BodyShapeKey | null;
  confidence: "low" | "medium" | "high" | null;
  rationale: string | null;
  improve: string[];
  raw?: any;
};

type State = {
  estimate: EstimateResult | null;
  loading: boolean;
  error: string | null;
};

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
    return "Body-shape analysis is temporarily unavailable because the Replicate monthly spend limit was reached.";
  }

  if (lower.includes("insufficient credits")) {
    return "Body-shape analysis is temporarily unavailable due to insufficient Replicate credits.";
  }

  if (isE005SensitiveFlag(msg)) {
    return [
      "This photo could not be processed.",
      "The moderation filter flagged it as sensitive.",
      "Try a different image and retry.",
    ].join("\n");
  }

  if (lower.includes("timed out")) {
    return "This analysis timed out. Please retry with a clearer image.";
  }

  return msg || "Something went wrong. Please try a different photo.";
}

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useBodyShapeEstimate(
  imageUrl: string | null,
  options?: { source?: EstimateSource }
) {
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

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
          throw new Error(`Not an image: ${contentType}`);
        }

        const blob = await response.blob();
        const base64WithMime = await blobToDataUrl(blob);

        const startRes = await fetch("/api/estimate", {
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
            // ignore parse failures
          }

          const detailPart = startErrDetail ? ` - ${startErrDetail}` : "";
          throw new Error(`Estimate start failed (${startRes.status})${detailPart}`);
        }

        const startData = await startRes.json();
        const getUrl = startData?.getUrl;

        if (!getUrl) {
          throw new Error("Estimate start did not return getUrl");
        }

        let finalEstimate: any = null;
        const maxPolls = 240;

        for (let i = 0; i < maxPolls; i += 1) {
          if (signal.aborted) return;

          const statusRes = await fetch(
            `/api/estimate/status?getUrl=${encodeURIComponent(getUrl)}`,
            { cache: "no-store", signal }
          );

          if (!statusRes.ok) {
            throw new Error(`Estimate status failed: ${statusRes.status}`);
          }

          const statusData = await statusRes.json();
          const status = statusData?.status;

          if (status === "failed") {
            throw new Error(statusData?.error || "Prediction failed");
          }

          if (status === "succeeded") {
            finalEstimate = statusData?.estimate;
            break;
          }

          const isInProgress =
            status === "starting" ||
            status === "queued" ||
            status === "pending" ||
            status === "processing" ||
            status === "running";

          if (!isInProgress) {
            throw new Error(statusData?.error || "Prediction failed");
          }

          await sleep(1000);
        }

        if (!finalEstimate) {
          throw new Error("Prediction timed out");
        }

        const rawGender = finalEstimate?.photo_assessment?.perceived_gender;
        const normalizedGender = (() => {
          const value = String(Array.isArray(rawGender) ? rawGender[0] : rawGender ?? "")
            .trim()
            .toLowerCase();
          if (value === "female") return "female";
          if (value === "male") return "male";
          return "unknown";
        })();

        const normalized: EstimateResult = {
          perceivedGender: normalizedGender,
          bodyShape: normalizeBodyShapeKey(finalEstimate?.photo_assessment?.body_shape),
          confidence: finalEstimate?.analysis?.confidence_rating ?? null,
          rationale:
            finalEstimate?.analysis?.rationale ??
            finalEstimate?.estimation?.estimation_rationale ??
            null,
          improve: Array.isArray(finalEstimate?.analysis?.improvements)
            ? finalEstimate.analysis.improvements
            : [],
          raw: finalEstimate,
        };

        if (!normalized.bodyShape) {
          throw new Error("Model returned no body-shape result");
        }

        if (signal.aborted) return;

        trackEvent("Analyze Body Shape", {
          "body shape": normalized.bodyShape,
          "perceived gender": normalized.perceivedGender,
          confidence: normalized.confidence,
          source,
        });

        setState({ estimate: normalized, loading: false, error: null });
      } catch (err: any) {
        if (signal.aborted) return;

        const rawMessage = err?.message ?? (typeof err === "string" ? err : "") ?? "Error";
        const friendly = buildFriendlyErrorMessage(rawMessage);

        console.error("Body shape analysis error:", err);

        trackEvent("Body Shape Analysis Error", {
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

