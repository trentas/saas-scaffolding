import { Background } from "@/components/background";
import { AboutHero } from "@/components/blocks/about-hero";
import { SaasAbout } from "@/components/blocks/saas-about";

export default function AboutPage() {
  return (
    <Background>
      <div className="py-28 lg:py-32 lg:pt-44">
        <AboutHero />
        <SaasAbout />
      </div>
    </Background>
  );
}
