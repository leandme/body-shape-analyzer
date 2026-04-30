import { Metadata } from "next";

const title = "About";
const description =
  "Learn what Body Shape Analyzer is, how photo-based body shape analysis works, and how to use results responsibly.";

export const metadata: Metadata = {
  title,
  description,
};

export default function AboutPage() {
  return (
    <div className="hero min-h-screen flex mt-10 items-center justify-center">
      <div className="flex flex-col items-center gap-10 px-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-center">About</h1>

        <div className="prose prose-invert max-w-3xl text-center lg:text-left">
          <p className="text-lg">
            Body Shape Analyzer is a free tool designed to help people estimate likely body-shape patterns from a
            single full-body photo. The goal is simple: make visual body-shape analysis practical, private, and easy
            to use.
          </p>

          <h2>Why this tool exists</h2>
          <p className="text-lg">
            Many people want better clarity on their proportions for fit planning, style decisions, and progress
            tracking. Body Shape Analyzer provides quick directional insight from an image without complex setup.
          </p>

          <h2>How the analyzer works (high level)</h2>
          <p className="text-lg">
            The analyzer reviews visual cues such as upper/lower-body balance, waist definition, and frame silhouette
            to estimate a best-fit body-shape category.
          </p>
          <p className="text-lg">
            Like all photo-based classification tools, results are directional and can shift with camera angle,
            posture, clothing, and image quality.
          </p>

          <h2>Accuracy and limitations</h2>
          <p className="text-lg">
            Body Shape Analyzer provides a directional classification, not a medical diagnosis. It is most useful for
            personal context and repeatable comparisons when image conditions are similar.
          </p>
          <ul className="text-lg">
            <li>Not intended for medical diagnosis or treatment decisions</li>
            <li>Classification can change with lighting, clothing, posture, and camera perspective</li>
            <li>Best used as a directional comparison tool over time</li>
          </ul>

          <h2>Privacy</h2>
          <p className="text-lg">
            Privacy matters. Use the tool in ways you are comfortable with, and review the Privacy Policy for details
            on data handling.
          </p>

          <h2>Who should use this tool</h2>
          <ul className="text-lg">
            <li>People who want a quick photo-based body-shape estimate</li>
            <li>Users tracking body-shape trends over time with similar photo conditions</li>
            <li>Anyone planning clothing fit around body-shape context</li>
          </ul>

          <h2>Who should not rely on this tool</h2>
          <ul className="text-lg">
            <li>Anyone needing a clinical or diagnostic assessment</li>
            <li>Individuals requiring precision anthropometry for formal use</li>
          </ul>

          <h2 id="founder">About the Founder</h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center border gap-6 rounded-2xl p-6 bg-white">
            <img
              src="/profiles/matt-phelps.jpeg"
              alt="Matt Phelps"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="text-center sm:text-left">
              <div className="flex items-baseline justify-center sm:justify-start gap-3">
                <p className="text-lg font-bold">Matt Phelps</p>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.linkedin.com/in/matt-phelps/"
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-[#0A66C2] hover:opacity-80 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 relative top-[1px]">
                      <path d="M4.98 3.5c0 1.38-1.11 2.5-2.48 2.5S0 4.88 0 3.5 1.11 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.9h4.56V24H.22V8.9zM8.9 8.9h4.37v2.06h.06c.61-1.15 2.1-2.37 4.33-2.37 4.63 0 5.48 3.05 5.48 7.01V24h-4.56v-6.93c0-1.65-.03-3.77-2.3-3.77-2.3 0-2.65 1.79-2.65 3.64V24H8.9V8.9z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@mgphelps"
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label="YouTube"
                    className="text-[#FF0000] hover:opacity-80 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 relative top-[4px]">
                      <path d="M23.5 6.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C16.9 2.5 12 2.5 12 2.5h-.01s-4.9 0-8.19.34c-.46.05-1.46.06-2.36 1-.71.72-.94 2.36-.94 2.36S0 8.14 0 10.1v1.8c0 1.96.5 3.9.5 3.9s.23 1.64.94 2.36c.9.94 2.08.91 2.6 1.01 1.89.18 7.96.34 7.96.34s4.9-.01 8.19-.35c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.5-1.94.5-3.9v-1.8c0-1.96-.5-3.9-.5-3.9zM9.75 14.65V7.55l6.25 3.55-6.25 3.55z" />
                    </svg>
                  </a>
                </div>
              </div>
              <p className="text-gray-500 mt-1">
                Independent product builder focused on practical fitness tools, body composition insights, and visual
                progress tracking.
              </p>
            </div>
          </div>

          <h2>More sites by the maker</h2>
          <p className="text-lg">
            <a href="https://ai-calorie-counter.com" className="text-primary">AI Calorie Counter</a><br />
            <a href="https://skoy.ai" className="text-primary">Skoy</a><br />
            <a href="https://bodyfatestimator.ai" className="text-primary">Body Fat Estimator</a><br />
            <a href="https://jawlinecheck.com" className="text-primary">Jawline Check</a><br />
            <a href="https://heightestimatorai.com" className="text-primary">Height Estimator</a><br />
            <a href="https://bodyshapeanalyzer.com" className="text-primary">Body Shape Visualizer</a><br />
            <a href="https://canthaltilttest.com" className="text-primary">Canthal Tilt Test</a><br />
            <a href="https://bodyvisualizer.ai" className="text-primary">Body Visualizer</a>
          </p>

          <h2>Contact</h2>
          <p className="text-lg mb-12">
            Have questions, feedback, or need assistance? You can reach us at{" "}
            <a href="mailto:matt@leandme.com" className="text-primary">
              matt@leandme.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
