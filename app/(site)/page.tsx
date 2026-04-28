import { Metadata } from "next";
import { Suspense } from "react";
import HeightEstimatorTool from "../components/HeightEstimatorTool";

const title = "Height Estimator AI – Estimate Height from Photo";
const description =
  "Estimate apparent adult height from a full-body photo with confidence and range context.";

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
      <HeightEstimatorTool />
    </Suspense>
  );
}
