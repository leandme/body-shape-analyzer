"use client";

import { useMemo, useState } from "react";

type Units = "imperial" | "metric";
type BodyShapeKey =
  | "hourglass"
  | "pear"
  | "rectangle"
  | "inverted-triangle"
  | "apple";

type BodyShapeRow = {
  key: BodyShapeKey;
  label: string;
  pattern: string;
  note: string;
  colorClass: string;
};

type BodyTypeVisual = {
  id: string;
  title: string;
  src: string;
  description: string;
  shapeKey: BodyShapeKey;
};

const BODY_SHAPE_ROWS: BodyShapeRow[] = [
  {
    key: "hourglass",
    label: "Hourglass",
    pattern: "Upper and lower measurements are similar with a clearly narrower waist.",
    note: "Balanced upper/lower proportions with visible waist definition.",
    colorClass: "text-emerald-700",
  },
  {
    key: "pear",
    label: "Pear (Triangle)",
    pattern: "Hip measurement is larger than upper-body measurement with a defined waist.",
    note: "Lower body is proportionally wider than upper body.",
    colorClass: "text-amber-700",
  },
  {
    key: "rectangle",
    label: "Rectangle",
    pattern: "Upper, waist, and hip measurements are closer in size with lower waist contrast.",
    note: "Straighter body-line profile with less waist narrowing.",
    colorClass: "text-sky-700",
  },
  {
    key: "inverted-triangle",
    label: "Inverted Triangle",
    pattern: "Upper-body measurement is larger than hip measurement with visible waist taper.",
    note: "Upper body is proportionally wider than lower body.",
    colorClass: "text-orange-700",
  },
  {
    key: "apple",
    label: "Apple (Oval)",
    pattern: "Waist measurement is closer to upper and hip measurements with less taper.",
    note: "More proportional fullness around the midsection.",
    colorClass: "text-rose-700",
  },
];

const WOMEN_BODY_TYPE_VISUALS: BodyTypeVisual[] = [
  {
    id: "women-hourglass",
    title: "Hourglass",
    src: "/tools/body-shape-analyzer/hourglass-body-type.png",
    description: "Balanced shoulder and hip width with more visible waist definition.",
    shapeKey: "hourglass",
  },
  {
    id: "women-triangle",
    title: "Triangle (Pear)",
    src: "/tools/body-shape-analyzer/triangle-body-type.png",
    description: "Lower body reads wider than upper body.",
    shapeKey: "pear",
  },
  {
    id: "women-rectangle",
    title: "Rectangle",
    src: "/tools/body-shape-analyzer/rectangle-body-type.png",
    description: "Straighter silhouette with less waist contrast.",
    shapeKey: "rectangle",
  },
  {
    id: "women-inverted-triangle",
    title: "Inverted Triangle",
    src: "/tools/body-shape-analyzer/inverted-triangle-body-type.png",
    description: "Upper body appears broader than hips.",
    shapeKey: "inverted-triangle",
  },
  {
    id: "women-oval",
    title: "Oval (Apple)",
    src: "/tools/body-shape-analyzer/oval-body-type.png",
    description: "More visual fullness around the midsection.",
    shapeKey: "apple",
  },
];

const MEN_BODY_TYPE_VISUALS: BodyTypeVisual[] = [
  {
    id: "men-trapezoid",
    title: "Trapezoid",
    src: "/tools/body-shape-analyzer/male-trapezoid-body-type.jpg",
    description: "Balanced shoulders and hips with moderate waist taper.",
    shapeKey: "hourglass",
  },
  {
    id: "men-triangle",
    title: "Triangle",
    src: "/tools/body-shape-analyzer/male-triangle-body-type.jpg",
    description: "Lower body and waist read wider than upper torso.",
    shapeKey: "pear",
  },
  {
    id: "men-rectangle",
    title: "Rectangle",
    src: "/tools/body-shape-analyzer/male-rectangle-body-type.jpg",
    description: "Straight shoulder-to-waist silhouette with less taper.",
    shapeKey: "rectangle",
  },
  {
    id: "men-inverted-triangle",
    title: "Inverted Triangle",
    src: "/tools/body-shape-analyzer/male-inverted-triangle-body-type.jpg",
    description: "Upper torso appears wider than hips with stronger V-taper.",
    shapeKey: "inverted-triangle",
  },
  {
    id: "men-oval",
    title: "Oval",
    src: "/tools/body-shape-analyzer/male-oval-body-type.jpg",
    description: "Visual fullness concentrated more in the midsection.",
    shapeKey: "apple",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeDiv(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function cmToIn(cm: number) {
  return cm / 2.54;
}

function inToCm(inches: number) {
  return inches * 2.54;
}

function estimateBodyShape(params: { bustCm: number; waistCm: number; hipCm: number }) {
  const bustCm = Math.max(params.bustCm, 1);
  const waistCm = Math.max(params.waistCm, 1);
  const hipCm = Math.max(params.hipCm, 1);

  const maxUpperLower = Math.max(bustCm, hipCm);
  const minUpperLower = Math.min(bustCm, hipCm);

  const symmetry = 1 - clamp(Math.abs(bustCm - hipCm) / maxUpperLower, 0, 1);
  const waistDefinition = clamp((minUpperLower - waistCm) / (minUpperLower * 0.35), 0, 1);
  const waistFullness = clamp((waistCm - minUpperLower * 0.78) / (minUpperLower * 0.35), 0, 1);
  const hipDominance = clamp((hipCm - bustCm) / (maxUpperLower * 0.2), 0, 1);
  const upperDominance = clamp((bustCm - hipCm) / (maxUpperLower * 0.2), 0, 1);

  const scores: Record<BodyShapeKey, number> = {
    hourglass: Math.round(clamp(55 * symmetry + 45 * waistDefinition, 0, 100)),
    pear: Math.round(clamp(65 * hipDominance + 35 * waistDefinition, 0, 100)),
    rectangle: Math.round(clamp(70 * (1 - waistDefinition) + 30 * symmetry, 0, 100)),
    "inverted-triangle": Math.round(clamp(65 * upperDominance + 35 * waistDefinition, 0, 100)),
    apple: Math.round(clamp(70 * waistFullness + 30 * (1 - waistDefinition), 0, 100)),
  };

  const winner = [...BODY_SHAPE_ROWS].sort((a, b) => scores[b.key] - scores[a.key])[0];

  return {
    shape: winner.key,
    scores,
    topScore: scores[winner.key],
    bustToHip: safeDiv(bustCm, hipCm),
    waistToBust: safeDiv(waistCm, bustCm),
    waistToHip: safeDiv(waistCm, hipCm),
  };
}

function BodyTypeVisualGrid({
  title,
  visuals,
  activeShape,
}: {
  title: string;
  visuals: BodyTypeVisual[];
  activeShape: BodyShapeKey;
}) {
  return (
    <div>
      <h3 className="text-2xl lg:text-3xl font-semibold text-center">{title}</h3>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {visuals.map((visual) => {
          const isActive = activeShape === visual.shapeKey;
          return (
            <article
              key={visual.id}
              className={[
                "overflow-hidden rounded-2xl border bg-white shadow-sm",
                isActive ? "ring-2 ring-gray-900 border-gray-900/40" : "border-gray-200",
              ].join(" ")}
            >
              <div className="h-72 sm:h-80 bg-base-100 p-4 flex items-center justify-center">
                <img
                  src={visual.src}
                  alt={`${visual.title} body type example`}
                  className="max-h-full w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xl lg:text-2xl font-semibold text-gray-900">{visual.title}</h4>
                  {isActive ? (
                    <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-3 py-1 text-sm font-semibold text-gray-900">
                      Your Result
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-lg text-gray-700 leading-relaxed">{visual.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
};

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <input
          type="number"
          className="input input-bordered w-28 text-right"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <input
        type="range"
        className="range range-primary"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="text-xs text-gray-500">
        {round(value, 1)} {suffix}
      </div>
    </div>
  );
}

export default function BodyShapeAnalyzerTool() {
  const [units, setUnits] = useState<Units>("imperial");
  const [bustCm, setBustCm] = useState(96.5); // 38 in
  const [waistCm, setWaistCm] = useState(76.2); // 30 in
  const [hipCm, setHipCm] = useState(101.6); // 40 in

  const result = useMemo(() => estimateBodyShape({ bustCm, waistCm, hipCm }), [bustCm, waistCm, hipCm]);
  const activeRow = useMemo(
    () => BODY_SHAPE_ROWS.find((row) => row.key === result.shape) ?? BODY_SHAPE_ROWS[0],
    [result.shape],
  );

  const bustDisplay = units === "imperial" ? round(cmToIn(bustCm), 1) : round(bustCm, 1);
  const waistDisplay = units === "imperial" ? round(cmToIn(waistCm), 1) : round(waistCm, 1);
  const hipDisplay = units === "imperial" ? round(cmToIn(hipCm), 1) : round(hipCm, 1);

  return (
    <main className="space-y-16">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl lg:text-5xl font-bold">Body Shape Analyzer</h1>
        <p className="text-lg text-gray-700">
          Analyze your body shape from bust/chest, waist, and hip measurements and compare your proportions to common
          body-type patterns.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8 items-start">
        <div className="rounded-3xl border bg-white shadow-lg p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Measurements</h2>
            <div className="join">
              <button
                type="button"
                onClick={() => setUnits("imperial")}
                className={`btn btn-sm join-item ${units === "imperial" ? "btn-primary" : "btn-ghost"}`}
              >
                Inches
              </button>
              <button
                type="button"
                onClick={() => setUnits("metric")}
                className={`btn btn-sm join-item ${units === "metric" ? "btn-primary" : "btn-ghost"}`}
              >
                Centimeters
              </button>
            </div>
          </div>

          {units === "imperial" ? (
            <div className="space-y-6">
              <SliderField
                label="Bust / Chest"
                value={bustDisplay}
                min={24}
                max={70}
                step={0.1}
                suffix="in"
                onChange={(value) => setBustCm(inToCm(value))}
              />
              <SliderField
                label="Waist"
                value={waistDisplay}
                min={20}
                max={65}
                step={0.1}
                suffix="in"
                onChange={(value) => setWaistCm(inToCm(value))}
              />
              <SliderField
                label="Hips"
                value={hipDisplay}
                min={24}
                max={75}
                step={0.1}
                suffix="in"
                onChange={(value) => setHipCm(inToCm(value))}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <SliderField
                label="Bust / Chest"
                value={bustDisplay}
                min={60}
                max={178}
                step={0.1}
                suffix="cm"
                onChange={setBustCm}
              />
              <SliderField
                label="Waist"
                value={waistDisplay}
                min={50}
                max={165}
                step={0.1}
                suffix="cm"
                onChange={setWaistCm}
              />
              <SliderField
                label="Hips"
                value={hipDisplay}
                min={60}
                max={191}
                step={0.1}
                suffix="cm"
                onChange={setHipCm}
              />
            </div>
          )}

          <p className="text-sm text-gray-600">
            Tip: measure at consistent landmarks and use similar tape tension for cleaner trend tracking.
          </p>
        </div>

        <div className="rounded-3xl border bg-white shadow-lg p-6 lg:p-8">
          <h2 className="text-2xl font-semibold text-center">Your Result</h2>
          <div className="mt-6 text-center">
            <p className={`text-3xl font-bold ${activeRow.colorClass}`}>{activeRow.label}</p>
            <p className="mt-2 text-sm text-gray-600">Best-fit match strength</p>
            <p className="text-5xl font-bold mt-1">{Math.round(result.topScore)}%</p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-base-200 p-3">
              <div className="text-xs text-gray-600">Bust : Hip</div>
              <div className="text-lg font-semibold">{round(result.bustToHip, 2)}</div>
            </div>
            <div className="rounded-xl bg-base-200 p-3">
              <div className="text-xs text-gray-600">Waist : Bust</div>
              <div className="text-lg font-semibold">{round(result.waistToBust, 2)}</div>
            </div>
            <div className="rounded-xl bg-base-200 p-3">
              <div className="text-xs text-gray-600">Waist : Hip</div>
              <div className="text-lg font-semibold">{round(result.waistToHip, 2)}</div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Shape</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Match</th>
                </tr>
              </thead>
              <tbody>
                {BODY_SHAPE_ROWS.map((row) => {
                  const score = result.scores[row.key];
                  const isActive = row.key === result.shape;
                  return (
                    <tr key={row.key} className={isActive ? "bg-gray-100" : ""}>
                      <td className={`px-3 py-2 ${isActive ? "font-semibold" : ""}`}>{row.label}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${isActive ? "font-semibold" : ""}`}>
                        {score}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white shadow-lg p-6 lg:p-8">
        <h2 className="text-3xl font-semibold text-center">Body Shape Interpretation</h2>
        <p className="mt-3 text-center text-gray-700 max-w-2xl mx-auto">
          The highlighted row represents the closest measurement pattern based on your current entries.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">SHAPE</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
                  MEASUREMENT PATTERN
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 hidden sm:table-cell">
                  WHAT IT USUALLY MEANS
                </th>
              </tr>
            </thead>
            <tbody>
              {BODY_SHAPE_ROWS.map((row) => {
                const isActive = result.shape === row.key;
                const cellBase = "px-4 py-4 align-top";
                return (
                  <tr key={row.key} className={isActive ? "bg-gray-100" : ""}>
                    <td className={`${cellBase} ${isActive ? "font-semibold" : ""}`}>{row.label}</td>
                    <td className={cellBase}>
                      <p className="text-sm text-gray-700 leading-relaxed">{row.pattern}</p>
                      <p className="mt-2 text-sm text-gray-700 sm:hidden">{row.note}</p>
                    </td>
                    <td className={`${cellBase} hidden sm:table-cell`}>
                      <p className="text-sm text-gray-700 leading-relaxed">{row.note}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-12">
        <h2 className="text-3xl lg:text-4xl font-semibold text-center">Common Body Types</h2>
        <p className="text-center text-gray-700 max-w-2xl mx-auto text-lg">
          Compare your result against common silhouette references for women and men.
        </p>

        <BodyTypeVisualGrid
          title="Women Body Types (Female)"
          visuals={WOMEN_BODY_TYPE_VISUALS}
          activeShape={result.shape}
        />

        <BodyTypeVisualGrid
          title="Men Body Types (Male)"
          visuals={MEN_BODY_TYPE_VISUALS}
          activeShape={result.shape}
        />
      </section>

      <section className="max-w-3xl mx-auto space-y-5 pb-8">
        <h2 className="text-3xl font-semibold text-center">Measurement Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-lg">
          <li>Measure bust/chest at the fullest circumference with tape level to the floor.</li>
          <li>Measure waist at the narrowest point between ribs and hips (or navel line).</li>
          <li>Measure hips at the widest point of the glutes.</li>
          <li>Repeat under the same conditions when tracking changes over time.</li>
        </ul>
      </section>
    </main>
  );
}

