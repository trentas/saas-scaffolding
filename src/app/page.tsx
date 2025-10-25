import { Background } from "@/components/background";
import { Logos } from "@/components/blocks/logos";
import { SaasFAQ } from "@/components/blocks/saas-faq";
import { SaasFeatures } from "@/components/blocks/saas-features";
import { SaasHero } from "@/components/blocks/saas-hero";
import { SaasPricing } from "@/components/blocks/saas-pricing";
import { Testimonials } from "@/components/blocks/testimonials";

export default function Home() {
  return (
    <>
      <Background className="via-muted to-muted/80">
        <SaasHero />
        <Logos />
        <SaasFeatures />
      </Background>
      <Testimonials />
      <Background variant="bottom">
        <SaasPricing />
        <SaasFAQ />
      </Background>
    </>
  );
}
