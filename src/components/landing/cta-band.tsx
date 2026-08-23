import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "./constants";

export function CtaBand({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="px-6 py-16">
      <div className="brand-dark-band mx-auto max-w-5xl rounded-3xl px-8 py-16 text-center text-white sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Start automating your workflows today
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/60">
          Spin it up locally in a few minutes, or read the source before you
          commit to anything.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            asChild
            className="bg-[var(--brand-orange-500)] text-white hover:bg-[var(--brand-orange-600)]"
          >
            <Link href={isAuthenticated ? "/workflows" : "/signup"}>
              {isAuthenticated ? "Go to dashboard" : "Get started free"}
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              Star on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
