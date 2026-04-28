import { Metadata } from "next";
import { Suspense } from "react";
import BodyShapeAnalyzerTool from "../components/BodyShapeAnalyzerTool";

const title = "Body Shape Analyzer - Analyze Your Body Shape";
const description =
  "Analyze your body shape from bust/chest, waist, and hip measurements with clear category matching and visual references.";

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
