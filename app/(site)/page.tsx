import { Metadata } from "next";
import { Suspense } from "react";
import BodyShapeAnalyzerTool from "../components/BodyShapeAnalyzerTool";

const title = "Body Shape Analyzer - Analyze Your Body Shape";
const description =
  "Upload a full-body photo and get an AI-estimated body shape category with visual references.";

export const metadata: Metadata = {
  title: title,
  description: description,
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      }
    >
      <BodyShapeAnalyzerTool />
    </Suspense>
  );
}
