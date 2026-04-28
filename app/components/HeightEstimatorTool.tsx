"use client";

import { ReactNode, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/app/libs/amplitude";
import { useHeightEstimate } from "@/app/hooks/useHeightEstimate";

type HeightRange = {
  key: string;
  label: string;
  min: number;
  max: number;
  rowClass: string;
  dotClass: string;
  note: string;
};

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const HEIGHT_EXAMPLES = [
  { id: "h1", label: "Example A", src: "/tools/height-estimator/height-example-1.jpg" },
  { id: "h2", label: "Example B", src: "/tools/height-estimator/height-example-2.jpg" },
  { id: "h3", label: "Example C", src: "/tools/height-estimator/height-example-3.jpg" },
  { id: "h4", label: "Example D", src: "/tools/height-estimator/height-example-4.jpg" },
];

const HEIGHT_RANGES: HeightRange[] = [
  {
    key: "very_short",
    label: "Very Short Band",
    min: 120,
    max: 155,
    rowClass: "bg-red-50",
    dotClass: "bg-red-500",
    note: "Below common adult-height medians in many populations.",
  },
  {
    key: "short",
    label: "Short Band",
    min: 155,
    max: 166,
    rowClass: "bg-orange-50",
    dotClass: "bg-orange-500",
    note: "Lower-than-average adult-height band in many cohorts.",
  },
  {
    key: "average",
    label: "Average Band",
    min: 166,
    max: 180,
    rowClass: "bg-yellow-50",
    dotClass: "bg-yellow-400",
    note: "Common adult-height band across many populations.",
  },
  {
    key: "tall",
    label: "Tall Band",
    min: 180,
    max: 193,
    rowClass: "bg-green-50",
    dotClass: "bg-green-500",
    note: "Above-average adult-height band in many cohorts.",
  },
  {
    key: "very_tall",
    label: "Very Tall Band",
    min: 193,
    max: Infinity,
    rowClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    note: "Uncommon adult-height band; verify with direct measurement for precision.",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How accurate is height estimation from a photo?",
    answer:
      "Photo-based height estimation is a rough visual estimate, not an exact measurement. Accuracy depends heavily on image quality, camera angle, and whether the scene includes scale cues.",
  },
  {
    question: "Can you estimate height from one image?",
    answer:
      "Yes, but indirectly. The model uses body proportions, posture, and perspective cues to infer apparent height. Without a known reference object, uncertainty is higher.",
  },
  {
    question: "What type of photo gives the best result?",
    answer: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Full body visible from head to feet</li>
        <li>Standing upright on flat ground</li>
        <li>Camera positioned farther away (not close-up)</li>
        <li>Minimal tilt and lens distortion</li>
        <li>A visible reference object when possible</li>
      </ul>
    ),
  },
  {
    question: "Does camera angle affect the estimate?",
    answer:
      "Yes. Top-down angles, low angles, and wide-angle close-ups can distort proportions and make someone appear shorter or taller than they are.",
  },
  {
    question: "Do shoes and posture impact the result?",
    answer:
      "They can. Footwear adds visible height, and posture changes apparent stature. The tool estimates apparent height from the image, not barefoot measured height.",
  },
  {
    question: "Why do you return a range instead of one exact number?",
    answer:
      "A single image rarely contains enough reliable scale information for exact measurement. A range better reflects uncertainty from perspective and missing reference points.",
  },
  {
    question: "Can this replace a real height measurement?",
    answer:
      "No. For exact height, use a stadiometer or careful wall-based method. This tool is best for visual estimation and comparison.",
  },
];

function round(value: number, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function cmToIn(cm: number) {
  return cm / 2.54;
}

function formatFeetInches(totalInches: number) {
  const rounded = Math.round(totalInches);
  const feet = Math.floor(rounded / 12);
  const inches = rounded % 12;
  return `${feet} ft ${inches} in`;
}

function confidenceBadgeClass(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return "bg-green-100 text-green-800 border-green-200";
  if (confidence === "low") return "bg-red-100 text-red-800 border-red-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function heightBandLabel(key: string) {
  if (key === "very_short") return "Very Short Band";
  if (key === "short") return "Short Band";
  if (key === "average") return "Average Band";
  if (key === "tall") return "Tall Band";
  if (key === "very_tall") return "Very Tall Band";
  return "Unknown Band";
}

function perceivedGenderLabel(gender: "male" | "female" | "unknown") {
  if (gender === "male") return "Male (visual)";
  if (gender === "female") return "Female (visual)";
  return "Unknown / unclear";
}

function formatRange(min: number, max: number) {
  if (!Number.isFinite(max)) return `${min}+`;
  return `${min}-${max}`;
}

function findActiveRange(value: number | null) {
  if (value == null) return null;
  return HEIGHT_RANGES.find((range) => value >= range.min && value < range.max) ?? HEIGHT_RANGES[HEIGHT_RANGES.length - 1];
}

function UploadBox() {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const goToImage = (url: string, source: "upload" | "example") => {
    router.push(`/?imageUrl=${encodeURIComponent(url)}&source=${source}`);
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("File size exceeds 5MB. Please upload a smaller image.");
      return;
    }

    setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    goToImage(objectUrl, "upload");
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-lg p-6 border-2 border-dashed rounded-lg cursor-pointer border-gray-400 shadow-sm hover:shadow-md transition"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFile(dropped);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) handleFile(selected);
        }}
      />

      <button
        type="button"
        className="btn btn-lg btn-primary mt-10 mb-5 text-white transform transition-transform duration-200 hover:scale-105"
      >
        Upload Full-Body Photo
      </button>

      <div className="text-center text-gray-600">
        <p className="text-base mb-2">drop a photo here,</p>
        <button
          type="button"
          className="text-xs mb-5 text-gray-600 hover:text-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = window.prompt("Paste an image URL (must start with http:// or https://)");
            if (!url) return;
            const cleaned = url.trim();
            if (!/^https?:\/\//i.test(cleaned)) {
              alert("Please paste a valid URL starting with http:// or https://");
              return;
            }
            goToImage(cleaned, "upload");
          }}
        >
          or paste <span className="underline underline-offset-2">URL</span>
        </button>
      </div>

      {fileName ? <p className="mt-4 text-sm text-primary font-semibold">Uploaded File: {fileName}</p> : null}
    </div>
  );
}

function TryExamples() {
  const router = useRouter();

  return (
    <div className="w-full mt-10 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="leading-tight font-bold text-base-content/70">
          <span className="inline sm:block">No photo?</span>{" "}
          <span className="inline sm:block">Try one of these:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {HEIGHT_EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => {
                trackEvent("Try Height Estimator Example", { example: example.label });
                router.push(`/?imageUrl=${encodeURIComponent(example.src)}&source=example`);
              }}
              className="group relative rounded-2xl p-[2px] bg-transparent"
              aria-label={`Try ${example.label}`}
            >
              <div className="rounded-2xl bg-base-100 shadow-sm group-hover:shadow-md transition overflow-hidden">
                <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden">
                  <img
                    src={example.src}
                    alt={example.label}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-base-content/60 leading-relaxed">
        By uploading a photo, you agree to our <a className="link" href="/terms">Terms of Service</a>. To learn more about how Height Estimator handles your personal data, check our <a className="link" href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}

function InterpretationTable({ valueCm }: { valueCm: number | null }) {
  const activeRange = findActiveRange(valueCm);

  return (
    <section className="w-full max-w-3xl mx-auto">
      <div className="p-5">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl lg:text-4xl font-semibold text-center">Estimated Height Interpretation</h2>
          <p className="text-center text-lg text-gray-700 leading-relaxed max-w-2xl">
            The highlighted row shows where your photo-based height estimate sits in broad adult-height bands.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border bg-base-100">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">RANGE</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">CATEGORY</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 hidden sm:table-cell">WHAT IT USUALLY MEANS</th>
              </tr>
            </thead>
            <tbody>
              {HEIGHT_RANGES.map((range) => {
                const isActive = activeRange?.key === range.key;
                const rowCellClass = isActive ? "border-y-4 border-gray-900" : "border-y border-transparent";
                return (
                  <tr key={range.key} className={range.rowClass}>
                    <td className={`px-4 py-4 align-top ${rowCellClass} ${isActive ? "border-l-4 border-gray-900 rounded-l-xl" : ""}`}>
                      <span className="font-semibold tabular-nums text-gray-900">{formatRange(range.min, range.max)}</span>
                    </td>
                    <td className={`px-4 py-4 align-top ${rowCellClass}`}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${range.dotClass}`} />
                        <span className="font-semibold text-gray-900">{range.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 sm:hidden">{range.note}</p>
                    </td>
                    <td className={`px-4 py-4 align-top hidden sm:table-cell ${rowCellClass} ${isActive ? "border-r-4 border-gray-900 rounded-r-xl" : ""}`}>
                      <p className="text-sm text-gray-700 leading-relaxed">{range.note}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {valueCm != null && activeRange ? (
          <div className="mt-6">
            <p className="text-gray-700 text-lg text-center leading-relaxed">
              Your result of <span className="font-semibold text-gray-900">{round(valueCm, 1)} cm</span> falls in{" "}
              <span className="font-semibold text-gray-900">{activeRange.label}</span>.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function HeightEstimatorTool() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("imageUrl");
  const source = searchParams.get("source") === "example" ? "example" : "upload";
  const { estimate, loading, error } = useHeightEstimate(imageUrl, { source });

  const estimatedHeightFeetInches = useMemo(() => {
    if (estimate?.estimatedHeightCm == null) return null;
    return formatFeetInches(cmToIn(estimate.estimatedHeightCm));
  }, [estimate?.estimatedHeightCm]);

  const sectionWrap = "w-full max-w-3xl mx-auto space-y-6 text-gray-900 pt-10 pb-10 lg:pt-20 lg:pb-20 leading-relaxed";
  const pClass = "text-lg leading-relaxed";
  const h2Class = "text-3xl lg:text-4xl font-semibold text-center";

  return (
    <main className="bg-base-100">
      <section className="flex flex-col items-center justify-start pt-10 px-6">
        <h1 className="text-4xl lg:text-5xl font-bold text-center">Estimate Height from a Photo</h1>
        <p className="mt-4 text-center text-lg text-gray-700 max-w-2xl mx-auto">
          Upload a full-body photo to estimate apparent height with a confidence rating, estimated range, and practical accuracy guidance.
        </p>

        {!imageUrl ? (
          <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
            <div className="w-full max-w-md">
              <UploadBox />
            </div>
            <div className="w-full max-w-lg mt-6 lg:max-w-xl">
              <TryExamples />
            </div>
            <p className="mt-6 text-sm text-gray-600 max-w-md text-center">
              Best results come from a full-body standing photo with camera distance, minimal tilt, and clear ground context.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-5xl mt-10">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 lg:gap-16 items-start">
              <div className="w-full sm:max-w-sm lg:max-w-none justify-self-center">
                <img
                  src={imageUrl}
                  alt="Uploaded image for height estimation"
                  className="w-full max-w-[95vw] sm:max-w-sm lg:w-[360px] mx-auto rounded-2xl shadow-xl object-cover aspect-[3/4] bg-base-200"
                />
              </div>

              <div className="w-full rounded-2xl border bg-white p-6 lg:p-8 shadow-sm">
                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">Estimated Height</h2>

                {loading ? <p className="mt-4 text-lg text-gray-700">Analyzing body proportions, perspective, and visual scale cues...</p> : null}

                {error ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="whitespace-pre-line text-red-700">{error}</p>
                  </div>
                ) : null}

                {!loading && !error && estimate ? (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-4xl lg:text-5xl font-bold text-primary">
                        {estimate.estimatedHeightCm != null ? `${round(estimate.estimatedHeightCm, 1)} cm` : "—"}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${confidenceBadgeClass(
                          estimate.confidence
                        )}`}
                      >
                        {estimate.confidence.toUpperCase()} confidence
                      </span>
                    </div>

                    {estimatedHeightFeetInches ? <p className="mt-2 text-lg text-gray-700">{estimatedHeightFeetInches}</p> : null}

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-base-200/60 p-3">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Estimated range</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {estimate.rangeMinCm != null && estimate.rangeMaxCm != null
                            ? `${round(estimate.rangeMinCm, 1)}-${round(estimate.rangeMaxCm, 1)} cm`
                            : "Range unavailable"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-base-200/60 p-3">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Likely height band</p>
                        <p className="text-lg font-semibold text-gray-900">{heightBandLabel(estimate.likelyBand)}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-600">
                      Visual profile:{" "}
                      <span className="font-semibold text-gray-800">{perceivedGenderLabel(estimate.perceivedGender)}</span>
                    </p>

                    {estimate.rationale ? <p className="mt-5 text-gray-700 leading-relaxed">{estimate.rationale}</p> : null}

                    {estimate.keyCues.length ? (
                      <div className="mt-5">
                        <h3 className="font-semibold text-gray-900">Model cues used</h3>
                        <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                          {estimate.keyCues.map((cue, idx) => (
                            <li key={`${cue}-${idx}`}>{cue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="px-6">
        <div className="w-full max-w-3xl mx-auto pt-10 pb-10 lg:pt-20 lg:pb-20">
          <InterpretationTable valueCm={estimate?.estimatedHeightCm ?? null} />
        </div>

        <div className={sectionWrap}>
          <h2 className={h2Class}>How This Height Estimator Works</h2>
          <p className={pClass}>
            This tool estimates apparent adult height from one image by combining visual proportion signals with scene context and camera perspective cues. It returns an estimated height, a plausible range, and a confidence rating so uncertainty is visible.
          </p>
          <p className={pClass}>
            A single photo is an indirect input. Results should be interpreted as rough visual estimates for planning and comparison, not exact measurement.
          </p>
        </div>

        <div className={sectionWrap}>
          <h2 className={h2Class}>How To Improve Accuracy</h2>
          <ul className="list-disc pl-6 space-y-2 text-lg">
            {(estimate?.improvements?.length
              ? estimate.improvements
              : [
                  "Use a full-body standing photo from head to feet.",
                  "Keep camera farther back to reduce perspective distortion.",
                  "Avoid top-down and wide-angle close-up shots.",
                  "Stand next to a known-height reference object when possible.",
                  "Use even lighting and minimal pose asymmetry.",
                ]
            ).map((tip, idx) => (
              <li key={`${tip}-${idx}`}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className={sectionWrap}>
          <h2 className={h2Class}>Limitations</h2>
          <p className={pClass}>
            Camera distance, lens type, tilt, footwear, and posture can change perceived body proportions substantially. Without a known-size reference object, this estimate has meaningful uncertainty.
          </p>
          <p className={pClass}>
            For precise height, direct measurement (stadiometer or wall-based measurement protocol) is the correct method. Use this page as directional context only.
          </p>
        </div>

        <div className="hero pt-10 pb-10 lg:pt-20 lg:pb-20 flex items-center justify-center bg-base-100">
          <div className="hero-content w-full px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold text-center">Height Estimator FAQs</h2>
              <p className="py-6 text-lg mb-6 text-center">
                Common questions about photo-based height estimation and how to interpret results.
              </p>
              <div className="space-y-4">
                {FAQ_ITEMS.map((item, idx) => (
                  <div key={`${item.question}-${idx}`} className="collapse collapse-plus border bg-base-500 rounded-lg">
                    <input type="radio" name="height-estimator-faq-accordion" />
                    <div className="collapse-title text-lg lg:text-xl">{item.question}</div>
                    <div className="collapse-content">
                      <div className="text-lg text-gray-700 leading-relaxed">{item.answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={sectionWrap}>
          <h2 className={h2Class}>References</h2>
          <ul className="list-disc pl-6 space-y-3 text-lg break-words">
            <li>
              CDC adult body measurement context and population distributions:
              <a className="text-primary underline ml-1" href="https://www.cdc.gov/nchs/fastats/body-measurements.htm">
                CDC FastStats
              </a>
            </li>
            <li>
              WHO growth reference standards and height-for-age context:
              <a className="text-primary underline ml-1" href="https://www.who.int/tools/growth-reference-data-for-5to19-years">
                WHO Growth Reference Data
              </a>
            </li>
            <li>
              OpenCV camera geometry and calibration fundamentals used in image-based scale reasoning:
              <a className="text-primary underline ml-1" href="https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html">
                OpenCV calib3d documentation
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
