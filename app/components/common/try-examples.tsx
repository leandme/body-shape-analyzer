"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/app/libs/amplitude";

type BasePath = "/" | "/body-shape-analyzer";

type Props = {
  basePath: BasePath;
};

type Example = {
  id: string;
  label: string;
  src: string;
};

const EXAMPLES: Example[] = [
  { id: "m2", label: "Example B", src: "/examples/bfe-example2.webp" },
  { id: "m3", label: "Example C", src: "/examples/bfe-example3.webp" },
  { id: "m4", label: "Example D", src: "/examples/bfe-example1.webp" },
  { id: "m1", label: "Example A", src: "/examples/bfe-example4.webp" },
];

export default function TryExamples({ basePath }: Props) {
  const router = useRouter();

  const onPick = (src: string) => {
    trackEvent("Try Body Shape Example", { src });
    router.push(`${basePath}?imageUrl=${encodeURIComponent(src)}&source=example`);
  };

  return (
    <div className="w-full mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="leading-tight font-bold text-base-content/70">
          <span className="inline sm:block">No photo?</span>{" "}
          <span className="inline sm:block">Try one of these:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => onPick(example.src)}
              className="group relative rounded-2xl p-[2px] bg-transparent"
              aria-label={`Try ${example.label}`}
            >
              <div className="rounded-2xl bg-base-100 shadow-sm group-hover:shadow-md transition overflow-hidden">
                <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden">
                  <Image
                    src={example.src}
                    alt={example.label}
                    fill
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                    sizes="64px"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-base-content/60 leading-relaxed">
        By uploading a photo, you agree to our <a className="link" href="/terms">Terms of Service</a>. To learn more
        about how Body Shape Analyzer handles your personal data, check our{" "}
        <a className="link" href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}

