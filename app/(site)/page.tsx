import { Metadata } from "next";
import { Suspense } from "react";
import JawlineCheckTool from "../components/JawlineCheckTool";

const title = "Jawline Check – Gonial Angle and Jawline Type Detector";
const description =
  "Upload a side-profile photo to estimate jawline angle and classify jawline type with AI. Get confidence scoring, landmark overlay, and interpretation table.";

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
      <JawlineCheckTool />
    </Suspense>
  );
}
