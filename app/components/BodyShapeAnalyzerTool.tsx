"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBodyShapeEstimate } from "@/app/hooks/useBodyShapeEstimate";
import {
  getBodyShapeCard,
  getBodyShapeCards,
  type BodyShapeGender,
  type BodyShapeKey,
} from "@/app/libs/body-shape";

type BodyShapeResultProps = {
  bodyShape: BodyShapeKey | null;
  gender: BodyShapeGender;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function BodyShapeResult({ bodyShape, gender }: BodyShapeResultProps) {
  const [showOtherShapes, setShowOtherShapes] = useState(false);

  const activeShape = useMemo(() => getBodyShapeCard(gender, bodyShape), [gender, bodyShape]);
  const otherShapes = useMemo(() => {
    if (!activeShape) return [];
    return getBodyShapeCards(gender).filter((shape) => shape.key !== activeShape.key);
  }, [gender, activeShape]);

  if (!activeShape) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p className="text-lg text-gray-700">No body-shape result was returned for this image.</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-5xl">
      <div className="p-5">
        <h2 className="text-3xl lg:text-4xl font-semibold text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span>Your Body Shape</span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-base font-semibold tracking-wide text-gray-700">
            {activeShape.title.toUpperCase()}
          </span>
        </h2>

        <div className="mt-8">
          <article className="overflow-hidden rounded-2xl border bg-white shadow-sm ring-2 ring-gray-900 border-gray-900/40">
            <div className="bg-base-100 aspect-[4/3]">
              <img
                src={activeShape.imageSrc}
                alt={`${gender} ${activeShape.title} body shape`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="px-6 pt-4 pb-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h4 className="text-2xl lg:text-3xl font-semibold text-gray-900">
                  {activeShape.title}
                </h4>
                <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-3 py-1 text-sm font-semibold text-gray-900">
                  YOUR RESULT
                </span>
              </div>
              <p className="mt-3 text-lg text-gray-700 leading-relaxed text-center">
                {activeShape.description}
              </p>

              {!showOtherShapes && otherShapes.length > 0 ? (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-lg font-semibold text-primary underline underline-offset-2"
                    onClick={() => setShowOtherShapes(true)}
                  >
                    See other body shapes
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        </div>

        {showOtherShapes && otherShapes.length > 0 ? (
          <div className="mt-10">
            <h3 className="text-2xl lg:text-3xl font-semibold text-center">Other Body Shapes</h3>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {otherShapes.map((shape) => (
                <article
                  key={shape.key}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="bg-base-100 aspect-[4/3]">
                    <img
                      src={shape.imageSrc}
                      alt={`${gender} ${shape.title} body shape`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-6 pt-4 pb-6">
                    <h4 className="text-xl lg:text-2xl font-semibold text-gray-900">
                      {shape.title}
                    </h4>
                    <p className="mt-3 text-lg text-gray-700 leading-relaxed">
                      {shape.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function BodyShapeAnalyzerTool() {
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const imageUrl = searchParams.get("imageUrl");
  const sourceParam = searchParams.get("source");
  const source = sourceParam === "example" ? "example" : "upload";
  const { estimate, loading, error } = useBodyShapeEstimate(imageUrl, { source });

  const resultGender: BodyShapeGender = estimate?.perceivedGender === "female" ? "female" : "male";

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const pushImageForAnalysis = (nextImageUrl: string, nextSource: "example" | "upload") => {
    setLocalError(null);
    const encoded = encodeURIComponent(nextImageUrl);
    router.push(`/?imageUrl=${encoded}&source=${nextSource}`);
  };

  const validateAndPushFile = (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError("File size exceeds 5MB. Please upload a smaller photo.");
      return;
    }

    setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    pushImageForAnalysis(objectUrl, "upload");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    validateAndPushFile(event.dataTransfer.files?.[0]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateAndPushFile(event.target.files?.[0]);
  };

  const handlePasteUrl = () => {
    const url = window.prompt("Paste an image URL (must start with http:// or https://):");
    if (!url) return;

    const cleaned = url.trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      setLocalError("Please paste a valid URL starting with http:// or https://");
      return;
    }

    setLocalError(null);
    setFileName(null);
    pushImageForAnalysis(cleaned, "example");
  };

  if (!imageUrl) {
    return (
      <section className="max-w-4xl mx-auto py-8 lg:py-14">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold">Body Shape Analyzer</h1>
          <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
            Upload a clear full-body photo and get an AI-estimated body shape category.
          </p>
        </div>

        <div
          className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 border-2 border-dashed rounded-2xl cursor-pointer border-gray-400 shadow-sm hover:shadow-md transition bg-white"
          onClick={openFilePicker}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openFilePicker();
            }}
            className="btn btn-lg btn-primary mt-8 mb-4 text-white"
          >
            Upload Full-Body Photo
          </button>

          <p className="text-gray-600 text-base">Drop a photo here, or</p>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handlePasteUrl();
            }}
            className="text-sm mt-1 text-gray-700 hover:text-primary underline underline-offset-2"
          >
            paste image URL
          </button>

          <p className="mt-4 text-xs text-gray-500">JPG, PNG, or WEBP. Max 5MB.</p>

          {fileName ? (
            <p className="mt-4 text-sm text-primary font-semibold">Uploaded File: {fileName}</p>
          ) : null}

          {localError ? (
            <p className="mt-4 text-sm text-red-600 text-center">{localError}</p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center gap-10 py-4 lg:py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
        <img
          src={imageUrl}
          alt="Uploaded image"
          className="w-full rounded-2xl shadow-xl object-cover aspect-[3/4] bg-base-200"
        />

        <div className="rounded-2xl border bg-white p-6 lg:p-8">
          <h2 className="text-2xl font-semibold">Analysis</h2>

          {loading ? <p className="mt-4 text-lg">Analyzing your photo...</p> : null}

          {!loading && error ? (
            <div className="mt-4 space-y-4">
              <p className="text-red-600 whitespace-pre-line">{error}</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push("/")}
              >
                Try Another Photo
              </button>
            </div>
          ) : null}

          {!loading && !error && estimate ? (
            <div className="mt-4 space-y-3">
              <p className="text-gray-700">
                Confidence:{" "}
                <span className="font-semibold uppercase">
                  {estimate.confidence ?? "unknown"}
                </span>
              </p>
              {estimate.rationale ? (
                <p className="text-gray-700 leading-relaxed">{estimate.rationale}</p>
              ) : null}
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push("/")}
              >
                Analyze Another Photo
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {!loading && !error && estimate ? (
        <BodyShapeResult bodyShape={estimate.bodyShape} gender={resultGender} />
      ) : null}
    </section>
  );
}

