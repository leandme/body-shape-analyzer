"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Point = { x: number; y: number };
type LandmarkKey = "ramusPoint" | "gonionPoint" | "mentonPoint";
type Landmarks = Record<LandmarkKey, Point>;

type JawlineBandKey = "blockish" | "very-sharp" | "sharp" | "balanced" | "soft" | "rounded";
type JawlineBand = {
  key: JawlineBandKey;
  label: string;
  min: number;
  max: number;
  rangeLabel?: string;
  colorClass: string;
  textClass: string;
  summary: string;
};

type ExampleImage = {
  id: string;
  label: string;
  src: string;
};

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const DEFAULT_LANDMARKS: Landmarks = {
  ramusPoint: { x: 0.34, y: 0.38 },
  gonionPoint: { x: 0.5, y: 0.62 },
  mentonPoint: { x: 0.73, y: 0.76 },
};

const LANDMARK_STYLES: Record<
  LandmarkKey,
  { label: string; dotClass: string; labelClass: string; lineColor: string }
> = {
  ramusPoint: {
    label: "Ramus",
    dotClass: "bg-emerald-500 border-emerald-700",
    labelClass: "bg-emerald-600/90",
    lineColor: "#10b981",
  },
  gonionPoint: {
    label: "Gonion",
    dotClass: "bg-gray-900 border-gray-950",
    labelClass: "bg-gray-900/90",
    lineColor: "#111827",
  },
  mentonPoint: {
    label: "Menton",
    dotClass: "bg-blue-600 border-blue-800",
    labelClass: "bg-blue-600/90",
    lineColor: "#2563eb",
  },
};

const JAWLINE_BANDS: JawlineBand[] = [
  {
    key: "very-sharp",
    label: "Very Sharp",
    min: 91,
    max: 114,
    colorClass: "bg-green-50",
    textClass: "text-green-800",
    summary: "Very acute mandibular angle with a strong posterior-to-anterior jawline transition.",
  },
  {
    key: "sharp",
    label: "Sharp",
    min: 115,
    max: 124,
    colorClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    summary: "Defined angle with clear contour separation near the gonial region.",
  },
  {
    key: "balanced",
    label: "Balanced",
    min: 125,
    max: 134,
    colorClass: "bg-yellow-50",
    textClass: "text-yellow-800",
    summary:
      "Middle-range angle often seen when jawline definition is present without extreme angularity.",
  },
  {
    key: "soft",
    label: "Soft",
    min: 135,
    max: 145,
    colorClass: "bg-orange-50",
    textClass: "text-orange-800",
    summary: "Obtuser mandibular angle with smoother contour transition from ramus to chin.",
  },
  {
    key: "rounded",
    label: "Rounded",
    min: 146,
    max: 170,
    colorClass: "bg-red-50",
    textClass: "text-red-800",
    summary: "Broad, obtuse jawline angle with less abrupt angular definition in profile.",
  },
];

const BLOCKISH_BAND: JawlineBand = {
  key: "blockish",
  label: "Blockish (Not Desired)",
  min: 0,
  max: 90,
  rangeLabel: "≤90",
  colorClass: "bg-blue-50",
  textClass: "text-blue-800",
  summary: "Very low mandibular angle. This bucket is treated as a non-desired/blockish profile zone.",
};

const ALL_BANDS: JawlineBand[] = [BLOCKISH_BAND, ...JAWLINE_BANDS];

const EXAMPLE_IMAGES: ExampleImage[] = [
  { id: "jawline-a", label: "Example A", src: "https://bodyfatestimator.ai/examples/man-selfie.webp" },
  { id: "jawline-b", label: "Example B", src: "https://bodyfatestimator.ai/examples/woman-selfie.webp" },
  { id: "jawline-c", label: "Example C", src: "https://bodyfatestimator.ai/examples/man-selfie.webp" },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is the gonial angle in jawline analysis?",
    answer:
      "The gonial angle is the angle at the jaw corner where the posterior mandibular ramus meets the lower jaw body. In profile analysis, it is used as one visual marker of how sharp or rounded the jawline appears.",
  },
  {
    question: "How does Jawline Check estimate my jawline type?",
    answer:
      "The tool uses three landmarks (ramus, gonion, and menton) to calculate the jaw angle, then maps that angle into practical jawline-type bands such as sharp, balanced, soft, or rounded.",
  },
  {
    question: "Is manual point placement better than auto-detect?",
    answer:
      "Manual placement gives you direct control and is often best for difficult photos. Auto-detect is useful as a starting point, but refining landmark points manually usually improves consistency.",
  },
  {
    question: "What photo setup gives the best jawline result?",
    answer: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Use a true side profile (around 90 degrees), not a three-quarter angle.</li>
        <li>Keep head posture neutral without chin tuck or extension.</li>
        <li>Use even lighting with minimal shadows across jaw contour.</li>
        <li>Keep hair, beard bulk, and clothing away from the jawline edge.</li>
      </ul>
    ),
  },
  {
    question: "How do I take better jawline photos?",
    answer: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Use a true side profile (about 90 degrees) instead of a three-quarter angle.</li>
        <li>Keep your head neutral without chin tuck or neck extension.</li>
        <li>Use even lighting and avoid deep shadows under the jaw border.</li>
        <li>Pull hair, beard bulk, scarves, or collars away from the jawline edge.</li>
        <li>Use normal camera distance to reduce perspective distortion.</li>
      </ul>
    ),
  },
  {
    question: "Why does my jawline result change between photos?",
    answer:
      "Small changes in camera distance, lens perspective, head tilt, lighting, or landmark placement can shift angle output. For tracking, keep setup and point-placement method as consistent as possible.",
  },
  {
    question: "Does beard density affect jawline angle detection?",
    answer:
      "Yes. Heavy beard bulk can obscure the true jaw border and influence where points are placed. Cleaner contour visibility generally improves angle reliability.",
  },
  {
    question: "Can this tool diagnose skeletal or dental issues?",
    answer:
      "No. This is a non-medical visual analysis tool for appearance context. It does not replace clinical cephalometric assessment or evaluation by a qualified healthcare professional.",
  },
  {
    question: "What are the limitations of this tool?",
    answer: (
      <>
        <p>
          This is an appearance-based estimate from one photo and manual landmark placement. It is sensitive to
          camera perspective, occlusion, beard density, posture, and image quality.
        </p>
        <p className="mt-3">
          It does not replace clinical cephalometric assessment or medical evaluation.
        </p>
      </>
    ),
  },
  {
    question: "What does the landmark overlay mean?",
    answer: (
      <>
        <p>
          The overlay dots represent user-controlled landmarks. Dashed lines indicate the posterior mandibular
          segment and mandibular body segment used to estimate the angle.
        </p>
        <p className="mt-3">
          Small point shifts can materially change angle output. Zoom in visually, place points carefully, and keep
          your method consistent if you are tracking over time.
        </p>
      </>
    ),
  },
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function calcAngle(landmarks: Landmarks): number {
  const { ramusPoint, gonionPoint, mentonPoint } = landmarks;
  const ax = ramusPoint.x - gonionPoint.x;
  const ay = ramusPoint.y - gonionPoint.y;
  const bx = mentonPoint.x - gonionPoint.x;
  const by = mentonPoint.y - gonionPoint.y;

  const magA = Math.hypot(ax, ay);
  const magB = Math.hypot(bx, by);
  if (magA < 0.01 || magB < 0.01) {
    return 0;
  }

  const cosine = clamp((ax * bx + ay * by) / (magA * magB), -1, 1);
  const angle = (Math.acos(cosine) * 180) / Math.PI;
  return Number(clamp(angle, 80, 170).toFixed(1));
}

function bandForAngle(angle: number): JawlineBand {
  if (angle <= BLOCKISH_BAND.max) {
    return BLOCKISH_BAND;
  }
  return JAWLINE_BANDS.find((band) => angle >= band.min && angle <= band.max) ?? JAWLINE_BANDS[JAWLINE_BANDS.length - 1];
}

function descriptionForBand(band: JawlineBandKey): string {
  if (band === "very-sharp") {
    return "Acute jawline angle with strong angular profile definition.";
  }
  if (band === "sharp") {
    return "Defined jawline angle with clear mandibular contour break.";
  }
  if (band === "balanced") {
    return "Mid-range jawline angle with moderate visible definition.";
  }
  if (band === "soft") {
    return "Smoother jawline transition with less pronounced gonial angle.";
  }
  if (band === "rounded") {
    return "Broad, obtuse jawline angle with softer side-profile contour.";
  }
  return "The photo did not provide a reliable side-profile jawline angle.";
}

function SectionHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-4xl lg:text-5xl font-bold text-center ${className}`}>{children}</h1>;
}

function UploadPanel({ onSelectImage }: { onSelectImage: (imageUrl: string) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert("File size exceeds 5MB. Please upload a smaller photo.");
        return;
      }
      setFileName(file.name);
      const imageObjectUrl = URL.createObjectURL(file);
      onSelectImage(imageObjectUrl);
    },
    [onSelectImage],
  );

  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-lg p-6 border-2 border-dashed rounded-lg cursor-pointer border-gray-400 shadow-sm hover:shadow-md transition"
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
          handleFile(droppedFile);
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) {
            handleFile(selectedFile);
          }
        }}
      />

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="btn btn-lg btn-primary mt-10 mb-5 text-white transform transition-transform duration-200 hover:scale-105"
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 block" fill="currentColor" aria-hidden="true">
              <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5a1 1 0 0 0-2 0V19H5V5h9.5a1 1 0 0 0 0-2H5Zm7.5 5.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM7 17l4.5-4.5 2.5 2.5 3.5-3.5L20 14.5V17H7Zm10-14v2h-2a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0V7h2a1 1 0 0 0 0-2h-2V3a1 1 0 0 0-2 0Z" />
            </svg>
          </span>
          <span className="leading-none">Upload Side-Profile</span>
        </span>
      </button>

      <div className="text-center text-gray-600">
        <p className="text-base mb-2">drop a photo here,</p>
        <button
          type="button"
          className="text-xs mb-5 text-gray-600 hover:text-primary"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const pastedUrl = window.prompt("Paste an image URL (must end with .jpg/.png/.webp etc):");
            if (!pastedUrl) {
              return;
            }
            const trimmedUrl = pastedUrl.trim();
            if (!/^https?:\/\//i.test(trimmedUrl)) {
              alert("Please paste a valid URL starting with http:// or https://");
              return;
            }
            onSelectImage(trimmedUrl);
          }}
        >
          or paste <span className="underline underline-offset-2">URL</span>
        </button>
      </div>

      {fileName ? <p className="mt-4 text-sm text-primary font-semibold">Uploaded File: {fileName}</p> : null}
    </div>
  );
}

function ExampleChooser({ onSelectExample }: { onSelectExample: (imageUrl: string) => void }) {
  return (
    <div className="w-full mt-10 mb-10 lg:mb-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="leading-tight font-bold text-base-content/70">
          <span className="inline sm:block">No photo?</span>{" "}
          <span className="inline sm:block">Try one of these:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {EXAMPLE_IMAGES.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelectExample(image.src)}
              className="group relative rounded-2xl p-[2px] bg-transparent"
              aria-label={`Try ${image.label}`}
            >
              <div className="rounded-2xl bg-base-100 shadow-sm group-hover:shadow-md transition overflow-hidden">
                <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden">
                  <img src={image.src} alt={image.label} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-base-content/60 leading-relaxed">
        By uploading a photo, you agree to our <a className="link" href="/terms">Terms of Service</a>. To learn more about how Jawline Check handles your personal data, check our <a className="link" href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}

function LandmarkCanvas({
  imageUrl,
  landmarks,
  onChange,
}: {
  imageUrl: string;
  landmarks: Landmarks;
  onChange: (next: Landmarks) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activePoint, setActivePoint] = useState<LandmarkKey | null>(null);

  const pointerToNormalizedPoint = useCallback((clientX: number, clientY: number): Point | null => {
    const container = containerRef.current;
    if (!container) {
      return null;
    }
    const rect = container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return null;
    }
    return {
      x: Number(clamp((clientX - rect.left) / rect.width, 0, 1).toFixed(5)),
      y: Number(clamp((clientY - rect.top) / rect.height, 0, 1).toFixed(5)),
    };
  }, []);

  const updatePoint = useCallback(
    (pointKey: LandmarkKey, point: Point) => {
      onChange({ ...landmarks, [pointKey]: point });
    },
    [landmarks, onChange],
  );

  useEffect(() => {
    const clearActivePoint = () => setActivePoint(null);
    window.addEventListener("pointerup", clearActivePoint);
    window.addEventListener("pointercancel", clearActivePoint);
    return () => {
      window.removeEventListener("pointerup", clearActivePoint);
      window.removeEventListener("pointercancel", clearActivePoint);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[95vw] sm:max-w-sm lg:w-[360px] mx-auto touch-none select-none">
      <img src={imageUrl} alt="Uploaded side-profile image for jawline check" className="w-full rounded-2xl shadow-xl bg-base-200" draggable={false} />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          x1={(100 * landmarks.ramusPoint.x).toFixed(2)}
          y1={(100 * landmarks.ramusPoint.y).toFixed(2)}
          x2={(100 * landmarks.gonionPoint.x).toFixed(2)}
          y2={(100 * landmarks.gonionPoint.y).toFixed(2)}
          stroke={LANDMARK_STYLES.ramusPoint.lineColor}
          strokeWidth="0.7"
          strokeDasharray="2 1"
        />
        <line
          x1={(100 * landmarks.gonionPoint.x).toFixed(2)}
          y1={(100 * landmarks.gonionPoint.y).toFixed(2)}
          x2={(100 * landmarks.mentonPoint.x).toFixed(2)}
          y2={(100 * landmarks.mentonPoint.y).toFixed(2)}
          stroke={LANDMARK_STYLES.mentonPoint.lineColor}
          strokeWidth="0.7"
          strokeDasharray="2 1"
        />
      </svg>

      {(Object.keys(LANDMARK_STYLES) as LandmarkKey[]).map((pointKey) => {
        const point = landmarks[pointKey];
        const style = LANDMARK_STYLES[pointKey];

        return (
          <div key={pointKey}>
            <button
              type="button"
              className={[
                "absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md cursor-grab active:cursor-grabbing touch-none",
                style.dotClass,
                activePoint === pointKey ? "scale-110 ring-2 ring-black/30" : "",
              ].join(" ")}
              style={{ left: toPercent(point.x), top: toPercent(point.y) }}
              aria-label={`Drag ${style.label} point`}
              onPointerDown={(event) => {
                event.preventDefault();
                setActivePoint(pointKey);
                event.currentTarget.setPointerCapture(event.pointerId);
                const next = pointerToNormalizedPoint(event.clientX, event.clientY);
                if (next) {
                  updatePoint(pointKey, next);
                }
              }}
              onPointerMove={(event) => {
                if (activePoint !== pointKey) {
                  return;
                }
                const next = pointerToNormalizedPoint(event.clientX, event.clientY);
                if (next) {
                  updatePoint(pointKey, next);
                }
              }}
              onPointerUp={(event) => {
                setActivePoint(null);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
            />
            <div
              className={`absolute -translate-y-full rounded-md px-2 py-1 text-[10px] font-semibold text-white pointer-events-none ${style.labelClass}`}
              style={{
                left: toPercent(point.x),
                top: toPercent(point.y),
                transform: "translate(-50%, -115%)",
              }}
            >
              {style.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AngleInterpretationBar({ angle }: { angle: number }) {
  const clampedAngle = clamp(angle, 95, 160);
  const markerPosition = ((160 - clampedAngle) / 65) * 100;

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="w-full px-6 pt-6 pb-5">
        <div className="relative">
          <div className="relative h-12 rounded-full overflow-hidden border border-black/10 bg-base-200 shadow-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_rgba(0,0,0,0.16)]">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right,
                  #ef4444 0%,
                  #f97316 26%,
                  #fde047 52%,
                  #22c55e 76%,
                  #16a34a 100%
                )`,
              }}
            />
            <div className="absolute inset-0 bg-white/15" />
          </div>
          <div
            className="absolute -top-3"
            style={{
              left: `${markerPosition}%`,
              transform: "translateX(-50%)",
            }}
            aria-label="Jawline angle marker"
            title={`Jawline angle ${clampedAngle.toFixed(1)} degrees`}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "14px solid #111827",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))",
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between text-[11px] text-gray-600">
          {[160, 150, 140, 130, 120, 110, 100].map((tick) => (
            <span key={tick} className="tabular-nums">
              {tick}
            </span>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-gray-500">
          <span>Rounded</span>
          <span>Soft</span>
          <span>Balanced</span>
          <span>Sharp</span>
        </div>
      </div>
    </div>
  );
}

function AngleBandTable({ angle, activeBand }: { angle: number; activeBand: JawlineBand }) {
  const selectedBand = angle <= BLOCKISH_BAND.max ? BLOCKISH_BAND : activeBand;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-base-100">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">Angle Range (deg)</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">Jawline Type</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 hidden sm:table-cell">Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {ALL_BANDS.map((band) => {
            const isActive = selectedBand.key === band.key;
            const baseClass = "px-4 py-4 align-top";
            const borderClass = isActive ? "border-y-4 border-gray-900" : "border-y border-transparent";

            return (
              <tr key={band.key} className={band.colorClass}>
                <td
                  className={[
                    baseClass,
                    borderClass,
                    isActive ? "border-l-4 border-gray-900 rounded-l-xl" : "",
                  ].join(" ")}
                >
                  <span className="font-semibold tabular-nums text-gray-900">
                    {band.rangeLabel ?? `${band.min}-${band.max}`}
                  </span>
                </td>
                <td className={[baseClass, borderClass].join(" ")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold ${band.textClass}`}>{band.label}</span>
                    {isActive ? (
                      <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-2 py-0.5 text-xs font-semibold text-gray-900">
                        Your Result
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-700 sm:hidden">{band.summary}</p>
                </td>
                <td
                  className={[
                    baseClass,
                    borderClass,
                    "hidden sm:table-cell text-gray-700",
                    isActive ? "border-r-4 border-gray-900 rounded-r-xl" : "",
                  ].join(" ")}
                >
                  {band.summary}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FaqSection() {
  return (
    <div className="hero pt-10 pb-10 lg:pt-20 lg:pb-20 flex items-center justify-center bg-base-100">
      <div className="hero-content w-full px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mt-4">FAQs</h2>
          <p className="py-6 text-lg mb-6 text-center">
            Common questions about jawline angle estimation, landmark placement, and result consistency.
          </p>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <div key={`${item.question}-${index}`} className="collapse collapse-plus border bg-base-500 rounded-lg">
                <input type="radio" name="jawline-check-faq-accordion" />
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
  );
}

export default function JawlineCheckTool() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("imageUrl");
  const [landmarks, setLandmarks] = useState<Landmarks>(DEFAULT_LANDMARKS);

  useEffect(() => {
    setLandmarks(DEFAULT_LANDMARKS);
  }, [imageUrl]);

  const jawlineAngle = useMemo(() => calcAngle(landmarks), [landmarks]);
  const jawlineBand = useMemo(() => bandForAngle(jawlineAngle), [jawlineAngle]);
  const angleScore = useMemo(() => clamp(Math.round(((160 - jawlineAngle) / 52) * 100), 0, 100), [jawlineAngle]);

  const headingClass = "text-3xl lg:text-4xl font-semibold text-center";
  const proseClass = "text-lg leading-relaxed";

  const setImageFromUpload = useCallback(
    (nextImageUrl: string) => {
      const params = new URLSearchParams();
      params.set("imageUrl", nextImageUrl);
      router.push(`/?${params.toString()}`);
    },
    [router],
  );

  const setImageFromExample = useCallback(
    (nextImageUrl: string) => {
      const params = new URLSearchParams();
      params.set("imageUrl", nextImageUrl);
      params.set("source", "example");
      router.push(`/?${params.toString()}`);
    },
    [router],
  );

  return (
    <main className="bg-base-100">
      <section className="flex flex-col items-center justify-start pt-10 px-6">
        <SectionHeading>Jawline Analyzer</SectionHeading>
        <p className="mt-4 text-center text-lg text-gray-700 max-w-2xl mx-auto">
          Upload a side-profile photo to calculatr your jawline angle, type and receive a rating.
        </p>

        {imageUrl ? (
          <div className="w-full max-w-5xl mt-10">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 lg:gap-16 items-start">
              <div className="w-full sm:max-w-sm lg:max-w-none justify-self-center">
                <LandmarkCanvas imageUrl={imageUrl} landmarks={landmarks} onChange={setLandmarks} />
                <p className="mt-3 text-xs text-gray-600 text-center">
                  Drag Ramus, Gonion, and Menton points to match your profile geometry.
                </p>
              </div>

              <div className="w-full rounded-2xl border bg-white p-6 lg:p-8 shadow-sm">
                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">Your Jawline Result</h2>
                <div className="mt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className={`text-3xl lg:text-4xl font-bold ${jawlineBand.textClass}`}>{jawlineBand.label}</p>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                      Manual landmarks
                    </span>
                  </div>

                  <p className="mt-3 text-lg text-gray-700">{descriptionForBand(jawlineBand.key)}</p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-base-200/70 p-3">
                      <div className="text-xs text-gray-600">Jawline Angle</div>
                      <div className={`text-3xl lg:text-4xl font-semibold tabular-nums ${jawlineBand.textClass}`}>
                        {jawlineAngle.toFixed(1)}°
                      </div>
                    </div>
                    <div className="rounded-xl bg-base-200/70 p-3">
                      <div className="text-xs text-gray-600">Angle Score</div>
                      <div className="text-xl font-semibold text-gray-900 tabular-nums">{angleScore}/100</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setLandmarks(DEFAULT_LANDMARKS)}
                      className="rounded-btn border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Reset Points
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
            <div className="w-full max-w-md">
              <UploadPanel onSelectImage={setImageFromUpload} />
            </div>
            <div className="w-full max-w-lg mt-6 lg:max-w-xl">
              <ExampleChooser onSelectExample={setImageFromExample} />
            </div>
          </div>
        )}
      </section>

      <section className="px-6">
        {imageUrl ? (
          <div className="w-full max-w-3xl mx-auto pt-10 pb-10 lg:pt-20 lg:pb-20">
            <h2 className={headingClass}>Jawline Angle Interpretation Bar</h2>
            <p className="mt-4 text-center text-lg text-gray-700">
              Lower angle values generally map to sharper profile classification bands.
            </p>
            <div className="mt-8">
              <AngleInterpretationBar angle={jawlineAngle} />
            </div>
          </div>
        ) : null}

        <div className="w-full max-w-3xl mx-auto pt-10 pb-10 lg:pt-20 lg:pb-20">
          <h2 className={headingClass}>Your Jawline (Gonial) Angle</h2>
          <p className="mt-4 text-center text-lg text-gray-700">
            The highlighted row marks your current jawline type band from manual point placement.
          </p>
          <AngleBandTable angle={jawlineAngle} activeBand={jawlineBand} />
        </div>

        <div className="w-full max-w-3xl mx-auto space-y-6 text-gray-900 pt-10 pb-10 lg:pt-20 lg:pb-20 leading-relaxed">
          <h2 className={headingClass}>How Jawline Check Measures Angle</h2>
          <p className={proseClass}>
            This tool measures the side-profile mandibular angle at gonion using three landmarks: one point along the posterior ramus line, the gonial corner, and a chin-edge point near menton. The interior angle between these two segments is used to classify jawline type.
          </p>
          <p className={proseClass}>
            The primary workflow is user-set geometry, so you can correct landmark placement directly. Auto-detect in the original tool is optional and mainly used as a starting point.
          </p>
        </div>

        <FaqSection />

      </section>
    </main>
  );
}
