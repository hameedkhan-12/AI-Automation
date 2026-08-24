import { PlusIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Do I need to write code to build a workflow?",
    answer:
      "No. flux is a drag-and-drop canvas — you connect triggers, AI nodes, and actions visually. Nodes that call an external API (like HTTP requests) accept plain configuration, not code.",
  },
  {
    question: "Can I self-host flux instead of using a hosted plan?",
    answer:
      "Yes. flux is open source and built to be self-hostable with Next.js, Postgres, and Inngest. Clone the repo, set your environment variables, and run it on your own infrastructure.",
  },
  {
    question: "Which tools can I connect?",
    answer:
      "Out of the box: Stripe, OpenAI, Anthropic, Gemini, Slack, Discord, Google Forms, and GitHub, plus a generic HTTP node for anything else and exchange adapters for trading workflows.",
  },
  {
    question: "How are my API keys and secrets stored?",
    answer:
      "Every credential is encrypted at rest and scoped to your account. Workflow definitions reference a credential by ID — the actual secret is never exposed to the node config.",
  },
  {
    question: "Can I inspect what happened during a run?",
    answer:
      "Yes. Every execution is stored step by step, so you can see exactly what data moved through each node, whether it succeeded, and replay it later.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="dark relative overflow-hidden py-24 text-white"
    >
      <div className="mx-auto max-w-2xl px-6 text-center">
        <span className="brand-ring-border inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-white/80">
          FAQ
        </span>

        <h2 className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
          Still have questions?
        </h2>

        <p className="mt-4 text-white/60">
          Everything you need to know about automating workflows, integrating
          tools, and getting started—quickly and confidently.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl px-6">
        <Accordion type="single" collapsible className="flex flex-col gap-4">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              value={`item-${i}`}
              className="brand-ring-border group rounded-2xl border-0 px-6 data-[state=open]:[--ring-from:var(--brand-orange-500)] data-[state=open]:[--ring-to:var(--brand-violet-500)]"
            >
              <AccordionTrigger className="py-5 text-base font-medium text-white hover:no-underline [&>svg]:hidden">
                {faq.question}
                <FaqToggle />
              </AccordionTrigger>
              <AccordionContent className="pr-14 text-sm text-white/60">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FaqToggle() {
  return (
    <span
      aria-hidden="true"
      className="brand-ring-border relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-data-[state=open]:rotate-45"
    >
      <PlusIcon className="size-4 text-[var(--brand-orange-500)]" strokeWidth={2.5} />
    </span>
  );
}