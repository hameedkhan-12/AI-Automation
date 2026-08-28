import { headers } from "next/headers";
import { CtaBand } from "@/components/landing/cta-band";
import { Faq } from "@/components/landing/faq";
import { FeaturesBento } from "@/components/landing/features-bento";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Nav } from "@/components/landing/nav";
import { Pricing } from "@/components/landing/pricing";
import { Teams } from "@/components/landing/teams";
import { Testimonials } from "@/components/landing/testimonials";
import { auth } from "@/lib/auth";
import { FeatureStrip } from "@/components/landing/feature-strip";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = !!session;

  return (
    <div className="dark bg-background min-h-screen overflow-x-hidden text-foreground">
      <Nav isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <FeatureStrip />
      <FeaturesBento />
      <HowItWorks />
      <Teams />
      <Testimonials />
      <Pricing />
      <Faq />
      <CtaBand isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}
