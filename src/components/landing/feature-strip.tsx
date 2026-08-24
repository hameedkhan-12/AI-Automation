import type { CSSProperties } from "react";


const FEATURES = [
  {
    icon: <LiveIntelligenceIcon />,
    title: "Live Intelligence",
    description:
      "Access continuously updated data to make faster decisions.",
  },
  {
    icon: <ActionableInsightsIcon />,
    title: "Actionable Insights",
    description:
      "Measure performance, identify trends, and turn data into real outcomes.",
  },
  {
    icon: <OngoingSupportIcon />,
    title: "Ongoing Support",
    description:
      "We provide continuous support and fine-tune your AI systems.",
  },
] as const;

export function FeatureStrip() {
  return (
    <section className="dark relative overflow text-white -mt-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero/download (19).svg"
          alt=""
          aria-hidden="true"
          className="w-full max-w-2xl"
        />

        {/* Three columns */}
        <div className="mt-2 grid w-full grid-cols-1 gap-12 pb-20 text-center sm:grid-cols-3 sm:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-4">
              <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-2xl shadow-lg">
                {/* mesh background */}
                <span
                  className="brand-mesh absolute inset-0 rounded-2xl"
                  style={
                    {
                      "--mesh-angle": "145deg",
                      "--mesh-from": "#ded8ff",
                      "--mesh-via": "#da5012",
                      "--mesh-via-pos": "55%",
                      "--mesh-to": "#593bff",
                    } as CSSProperties
                  }
                />
                {/* subtle inner border */}
                <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                {/* icon */}
                <span className="relative z-10">{f.icon}</span>
              </div>

              <h3 className="text-base font-bold tracking-tight">{f.title}</h3>
              <p className="max-w-[200px] text-sm text-white/60">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function LiveIntelligenceIcon() {
  /* Atom / circuit-node icon (Live Intelligence) */
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* outer ellipse rings */}
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      {/* center dot */}
      <circle cx="12" cy="12" r="1.5" fill="white" stroke="none" />
    </svg>
  );
}

function ActionableInsightsIcon() {
  /* Light-bulb icon (Actionable Insights) */
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21h6" />
      <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.19V17H9v-2.81A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" />
    </svg>
  );
}

function OngoingSupportIcon() {
  /* Headset icon (Ongoing Support) */
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11a9 9 0 1 1 18 0" />
      <path d="M21 11v4a2 2 0 0 1-2 2h-1" />
      <path d="M3 11v4a2 2 0 0 0 2 2h1" />
      <rect x="6" y="13" width="3" height="5" rx="1" />
      <rect x="15" y="13" width="3" height="5" rx="1" />
    </svg>
  );
}