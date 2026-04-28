"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import H1 from "@/app/components/common/h1";
import TryExamples from "@/app/components/common/try-examples";
import FaqSection, { type FaqSectionItem } from "@/app/components/common/faq-section";
import EstimateDropZone from "@/app/components/tools/composition/body-fat-estimator/estimate-drop-zone";
import { BodyShapeKey, useBodyShapeAnalysis } from "@/app/hooks/useBodyShapeAnalysis";
import {
  coerceBodyShapeForGender,
  getBodyShapeCards,
  type BodyShapeGender as VisualGender,
  type BodyShapeKey as VisualShapeKey,
} from "@/app/libs/body-shape";

type ShapeRow = {
  key: Exclude<BodyShapeKey, "uncertain">;
  label: string;
  emoji: string;
  colorClass: string;
  textClass: string;
  proportionPattern: string;
  commonFitDirection: string;
};

const SHAPE_ROWS: ShapeRow[] = [
  {
    key: "hourglass",
    label: "Hourglass",
    emoji: "⌛",
    colorClass: "bg-green-50",
    textClass: "text-green-800",
    proportionPattern: "Shoulders and hips are similar width with a clearly defined waist.",
    commonFitDirection: "Define and frame the waist while keeping top and bottom balanced.",
  },
  {
    key: "pear",
    label: "Pear (Triangle)",
    emoji: "🍐",
    colorClass: "bg-yellow-50",
    textClass: "text-yellow-800",
    proportionPattern: "Hips are visually wider than shoulders with a narrower upper torso.",
    commonFitDirection: "Add structure or visual width up top and keep clean lines below.",
  },
  {
    key: "rectangle",
    label: "Rectangle",
    emoji: "▭",
    colorClass: "bg-blue-50",
    textClass: "text-blue-800",
    proportionPattern:
      "Shoulders, waist, and hips read relatively straight with less waist contrast.",
    commonFitDirection: "Create shape through waist definition, layering, and silhouette contrast.",
  },
  {
    key: "inverted-triangle",
    label: "Inverted Triangle",
    emoji: "🔻",
    colorClass: "bg-orange-50",
    textClass: "text-orange-800",
    proportionPattern: "Shoulders/chest appear broader than hips and lower body.",
    commonFitDirection: "Soften upper width and add balance through lower-body volume/structure.",
  },
  {
    key: "apple",
    label: "Apple (Oval)",
    emoji: "🍎",
    colorClass: "bg-red-50",
    textClass: "text-red-800",
    proportionPattern:
      "Midsection appears fuller relative to shoulders/hips, often with less waist indentation.",
    commonFitDirection: "Use vertical lines and structured drape to simplify the torso silhouette.",
  },
];

const BODY_SHAPE_FAQ_ITEMS: FaqSectionItem[] = [
  {
    question: "How does the body shape analyzer work?",
    answer: (
      <>
        Upload a clear full-body photo and the AI evaluates visual proportion cues like shoulder width, waist
        definition, and hip balance to estimate your likely body-shape category.
      </>
    ),
  },
  {
    question: "What body-shape categories does this tool use?",
    answer: (
      <>
        The analyzer maps results to common labels: Hourglass, Pear (Triangle), Rectangle, Inverted Triangle, and
        Apple (Oval).
      </>
    ),
  },
  {
    question: "How accurate is this tool?",
    answer: (
      <>
        It is designed for directional visual classification, not clinical diagnosis. Accuracy depends heavily on
        photo quality, pose, clothing, camera angle, and lighting.
      </>
    ),
  },
  {
    question: "What kind of photo works best?",
    answer: (
      <>
        Use a full-body front-facing photo with head-to-feet visibility, neutral posture, even lighting, and fitted
        clothing that does not hide your silhouette.
      </>
    ),
  },
  {
    question: "Can I use a phone photo?",
    answer: (
      <>
        Yes. Most users upload smartphone photos. Keep the camera level around torso height and maintain similar
        framing between scans.
      </>
    ),
  },
  {
    question: "Why might my result change between photos?",
    answer: (
      <>
        Small changes in perspective, lens distance, posture, arm position, and clothing can noticeably change how
        proportions look in a photo, which can change category output.
      </>
    ),
  },
  {
    question: "Can I track progress over time with this?",
    answer: (
      <>
        Yes. It works best as a trend tool. Compare results from photos taken under consistent conditions every one to
        two weeks instead of focusing on a single scan.
      </>
    ),
  },
  {
    question: "What should I do if the tool says uncertain?",
    answer: (
      <>
        Retry with a clearer front-facing full-body image, better lighting, and a neutral stance. Make sure your full
        frame is visible and not obscured by loose clothing.
      </>
    ),
  },
  {
    question: "Is this tool meant for medical use?",
    answer: (
      <>
        No. This is not a medical, diagnostic, or clinical assessment tool. Use it for practical style and visual
        proportion context only.
      </>
    ),
  },
  {
    question: "Is my uploaded photo private?",
    answer: (
      <>
        Privacy matters. Uploaded photos are processed to generate analysis output. See the{" "}
        <a href="/privacy" className="text-primary underline">
          Privacy Policy
        </a>{" "}
        for details on handling and retention.
      </>
    ),
  },
  {
    question: "Can I use photos from social media?",
    answer: (
      <>
        You can, but results are usually less reliable due to filters, edits, angled poses, and inconsistent lighting.
        A fresh neutral photo generally performs better.
      </>
    ),
  },
  {
    question: "Who can I contact for help?",
    answer: (
      <>
        If you run into issues, contact support at{" "}
        <a href="mailto:matt@leandme.com" className="text-primary underline">
          matt@leandme.com
        </a>
        .
      </>
    ),
  },
];

function confidenceBadgeClass(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return "bg-green-100 text-green-800 border-green-200";
  if (confidence === "low") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}

function shapeOneLiner(shape: BodyShapeKey) {
  if (shape === "hourglass") return "Balanced upper/lower proportions with a more defined waist.";
  if (shape === "pear") return "Lower body appears wider than upper body.";
  if (shape === "rectangle") return "More straight-line proportions with less waist contrast.";
  if (shape === "inverted-triangle") return "Upper body appears broader than lower body.";
  if (shape === "apple") return "Fullness appears more concentrated around the midsection.";
  return "The image was not clear enough for a confident shape classification.";
}

function shapeEmoji(shape: BodyShapeKey) {
  if (shape === "hourglass") return "⌛";
  if (shape === "pear") return "🍐";
  if (shape === "rectangle") return "▭";
  if (shape === "inverted-triangle") return "🔻";
  if (shape === "apple") return "🍎";
  return "❔";
}

function BodyShapeTable({ activeShape }: { activeShape: BodyShapeKey | null }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-base-100">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
              Body Type
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
              Visual Pattern
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 hidden sm:table-cell">
              Fit Direction
            </th>
          </tr>
        </thead>
        <tbody>
          {SHAPE_ROWS.map((row) => {
            const isActive = activeShape === row.key;
            const cellBase = "px-4 py-4 align-top";
            const activeCell = isActive ? "border-y-4 border-gray-900" : "border-y border-transparent";

            return (
              <tr key={row.key} className={row.colorClass}>
                <td
                  className={[
                    cellBase,
                    activeCell,
                    isActive ? "border-l-4 border-gray-900 rounded-l-xl" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base" aria-hidden="true">
                      {row.emoji}
                    </span>
                    <span className={`font-semibold ${row.textClass}`}>{row.label}</span>
                    {isActive ? (
                      <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-2 py-0.5 text-xs font-semibold text-gray-900">
                        Your Result
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={[cellBase, activeCell].join(" ")}>
                  <p className="text-gray-700">{row.proportionPattern}</p>
                  <p className="mt-1 text-sm text-gray-700 sm:hidden">{row.commonFitDirection}</p>
                </td>
                <td
                  className={[
                    cellBase,
                    activeCell,
                    "hidden sm:table-cell text-gray-700",
                    isActive ? "border-r-4 border-gray-900 rounded-r-xl" : "",
                  ].join(" ")}
                >
                  {row.commonFitDirection}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CommonBodyTypesSection({
  activeShape,
  inferredGender,
}: {
  activeShape: BodyShapeKey | null;
  inferredGender: "male" | "female" | "unknown";
}) {
  const [gender, setGender] = useState<VisualGender>("female");

  useEffect(() => {
    if (inferredGender === "male" || inferredGender === "female") {
      setGender(inferredGender);
    }
  }, [inferredGender]);

  const activeVisualShape = useMemo(() => {
    if (!activeShape || activeShape === "uncertain") return null;
    return coerceBodyShapeForGender(activeShape as VisualShapeKey, gender);
  }, [activeShape, gender]);

  const cards = useMemo(() => getBodyShapeCards(gender), [gender]);

  return (
    <div className="w-full max-w-5xl mx-auto mt-20 lg:mt-40">
      <h2 className="text-3xl lg:text-4xl font-semibold text-center">Common Body Types</h2>
      <p className="mt-4 text-center text-lg text-gray-700">
        Toggle male and female reference cards to compare common silhouette patterns.
      </p>

      <div className="mt-6 flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setGender("female")}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              gender === "female" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            Female
          </button>
          <button
            type="button"
            onClick={() => setGender("male")}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              gender === "male" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            Male
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {cards.map((card) => {
          const isActive = activeVisualShape != null && activeVisualShape === card.key;
          return (
            <article
              key={`${gender}-${card.key}`}
              className={[
                "overflow-hidden rounded-2xl border bg-white shadow-sm",
                isActive ? "ring-2 ring-gray-900 border-gray-900/40" : "border-gray-200",
              ].join(" ")}
            >
              <div className="h-72 sm:h-80 bg-base-100 p-4 flex items-center justify-center">
                <img
                  src={card.imageSrc}
                  alt={`${card.title} body type example`}
                  className="max-h-full w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">{card.title}</h3>
                  {isActive ? (
                    <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-3 py-1 text-sm font-semibold text-gray-900">
                      Your Result
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-lg text-gray-700 leading-relaxed">{card.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function BodyShapePageContent() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("imageUrl");
  const source = searchParams.get("source") === "example" ? "example" : "upload";
  const { analysis, loading, error } = useBodyShapeAnalysis(imageUrl, { source });

  const activeShape = analysis?.shape ?? null;
  const activeShapeLabel = analysis?.shapeLabel ?? "—";

  const alternativesText = useMemo(() => {
    if (!analysis?.alternatives?.length) return null;
    return analysis.alternatives.slice(0, 2).join(" or ");
  }, [analysis?.alternatives]);

  const h2Class = "text-3xl lg:text-4xl font-semibold text-center";

  return (
    <main className="bg-base-100">
      <section className="flex flex-col items-center justify-start pt-10 px-6">
        <H1>Body Shape Analyzer</H1>
        <p className="mt-4 text-center text-lg text-gray-700 max-w-2xl mx-auto">
          Upload a full-body photo to estimate your body type and get practical guidance based on your visual
          proportions.
        </p>

        {!imageUrl ? (
          <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
            <div className="w-full max-w-md">
              <EstimateDropZone basePath="/" buttonLabel="Upload Full-Body Photo" />
            </div>
            <div className="w-full max-w-lg mt-6 lg:max-w-xl">
              <TryExamples basePath="/" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl mt-10">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 lg:gap-16 items-start">
              <div className="w-full sm:max-w-sm lg:max-w-none justify-self-center">
                <img
                  src={imageUrl}
                  alt="Uploaded image for body-shape analysis"
                  className="w-full max-w-[95vw] sm:max-w-sm lg:w-[360px] mx-auto rounded-2xl shadow-xl object-cover aspect-[3/4] bg-base-200"
                />
              </div>

              <div className="w-full rounded-2xl border bg-white p-6 lg:p-8 shadow-sm">
                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">Your Body Type Result</h2>

                {loading ? <p className="mt-4 text-lg text-gray-700">Analyzing image proportions and shape pattern...</p> : null}

                {error ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="whitespace-pre-line text-red-700">{error}</p>
                  </div>
                ) : null}

                {!loading && !error && analysis ? (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-3xl lg:text-4xl font-bold text-primary">
                        <span className="mr-2" aria-hidden="true">
                          {shapeEmoji(analysis.shape)}
                        </span>
                        {activeShapeLabel}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${confidenceBadgeClass(
                          analysis.confidence
                        )}`}
                      >
                        {analysis.confidence.toUpperCase()} confidence
                      </span>
                    </div>

                    <p className="mt-4 text-lg text-gray-700">{shapeOneLiner(analysis.shape)}</p>

                    {analysis.rationale ? <p className="mt-4 text-gray-700 leading-relaxed">{analysis.rationale}</p> : null}

                    {alternativesText ? (
                      <p className="mt-3 text-sm text-gray-600">Secondary possible pattern: {alternativesText}</p>
                    ) : null}

                    {analysis.proportionNotes.length ? (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900">Proportion notes</h3>
                        <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                          {analysis.proportionNotes.map((note, idx) => (
                            <li key={`${note}-${idx}`}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {analysis.recommendations.length ? (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900">Styling guidance</h3>
                        <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                          {analysis.recommendations.map((tip, idx) => (
                            <li key={`${tip}-${idx}`}>{tip}</li>
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
        <div className="w-full max-w-3xl mx-auto mt-20 lg:mt-40">
          <h2 className={h2Class}>Where Your Result Sits</h2>
          <p className="mt-4 text-center text-lg text-gray-700">
            The highlighted row marks your current result from the uploaded image.
          </p>
          <BodyShapeTable activeShape={activeShape} />
          {analysis ? (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-gray-700 leading-relaxed">
              Current classification: <span className="font-semibold text-gray-900">{activeShapeLabel}</span>.
              {analysis.shape === "uncertain"
                ? " Try a clearer full-body front photo with the camera at torso height."
                : " Use this as directional guidance, not a strict identity label."}
            </div>
          ) : null}
        </div>

        <CommonBodyTypesSection
          activeShape={activeShape}
          inferredGender={analysis?.perceivedGender ?? "unknown"}
        />
        <FaqSection
          id="faqs"
          accordionName="body-shape-faq-accordion"
          heading="Body Shape Analyzer FAQ"
          description="Answers to common questions about photo-based body-shape analysis."
          items={BODY_SHAPE_FAQ_ITEMS}
          className="mt-20 lg:mt-40"
        />
      </section>
    </main>
  );
}

const BodyShapeAnalyzerPageClient = dynamic(() => Promise.resolve(BodyShapePageContent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  ),
});

export default BodyShapeAnalyzerPageClient;
