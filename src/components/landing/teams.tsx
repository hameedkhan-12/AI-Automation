"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

const CASE_STUDIES = [
  {
    numeralImage: "/images/one.png",
    logoImage: "/images/hero/download (43).svg",
    company: "PayFlowAI",
    title: "PayFlowAI Cuts Refund Handling Time by 80%",
    description:
      "Automated the refund-review pipeline for PayFlowAI so disputed charges route straight to the right queue, with an AI first pass flagging fraud risk before a human ever opens the ticket.",
    stats: [
      { value: "80%", label: "Faster Refunds" },
      { value: "18%", label: "Fewer Chargebacks" },
      { value: "4x", label: "Team Capacity" },
    ],
  },
  {
    numeralImage: "/images/two.png",
    logoImage: "/images/hero/download (50).svg",
    company: "NovaCRM",
    title: "NovaCRM Automates Lead Routing End-to-End",
    description:
      "Every inbound lead is scored, enriched, and assigned to the right rep automatically — the sales team went from a spreadsheet triage process to a live, self-running pipeline overnight.",
    stats: [
      { value: "45%", label: "Faster Lead Response" },
      { value: "2x", label: "Rep Productivity" },
      { value: "12%", label: "Higher Win Rate" },
    ],
  },
  {
    numeralImage: "/images/three.png",
    logoImage: "/images/hero/download (51).svg",
    company: "ShopEase",
    title: "ShopEase Transforms Support with AI Chatbots",
    description:
      "Built an AI-powered chatbot for ShopEase that handled 70% of customer queries autonomously, boosting satisfaction and reducing support overhead.",
    stats: [
      { value: "26%", label: "Increase on reach" },
      { value: "3x", label: "Return on Ad" },
      { value: "3x", label: "Higher Conversion" },
    ],
  },
] as const;

export function Teams() {
  const [index, setIndex] = useState(0);
  const study = CASE_STUDIES[index];

  const prev = () =>
    setIndex((i) => (i - 1 + CASE_STUDIES.length) % CASE_STUDIES.length);
  const next = () => setIndex((i) => (i + 1) % CASE_STUDIES.length);

  return (
    <section className="dark relative overflow-hidden py-24 text-white">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <span className="brand-ring-border inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-white">
          Case Studies
        </span>
        <h2 className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
          Real-World AI Automation Case Studies
        </h2>
        <p className="mt-4 text-white/80">
          See how companies are revolutionizing their workflows using AI
          automation.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-5xl  px-6 py-6">
        <div className="brand-ring-border m-4 grid min-h-[460px] overflow-hidden rounded-3xl p-4 md:grid-cols-2">

          <div className="relative aspect-3/2 md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={study.numeralImage}
              alt={`${study.company} case study`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2">
              {study.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="brand-ring-border rounded-xl border border-white/10 bg-black/60 px-2 py-2.5 text-center backdrop-blur-sm"
                >
                  <p className="text-lg font-medium brand-ring">
                    {stat.value}
                  </p>
                  <p className="text-[10px] leading-tight text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content side */}
          <div className="flex flex-col justify-center p-8 md:p-10">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={study.logoImage}
                alt={`${study.company} logo`}
                className="h-10 w-auto max-w-full object-contain"
              />
            </div>

            <h3 className="mt-8 text-2xl font-medium tracking-tight text-balance sm:text-3xl">
              {study.title}
            </h3>
            <p className="mt-4 text-sm text-white/60 sm:text-base">
              {study.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous case study"
          className="brand-ring-border flex size-11 items-center justify-center rounded-xl text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next case study"
          className="brand-ring-border flex size-11 items-center justify-center rounded-xl text-white/80 transition-colors hover:text-white"
        >
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </section>
  );
}