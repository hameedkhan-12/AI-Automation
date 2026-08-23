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
    <section className="border-t border-border/70 px-6 py-24">
      <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-[minmax(0,220px)_1fr]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Clear answers to common questions about flux, self-hosting, and
            security.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="text-sm font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
