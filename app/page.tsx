import { HeroSection } from "@/components/blocks/hero-section";
import { FeatureSection } from "@/components/blocks/feature-section";
import { CTASection } from "@/components/blocks/cta-section";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <HeroSection 
        badge={{
          text: "Introducing GraphFlow ETL Suite",
          action: {
            text: "Learn more",
            href: "#features",
          }
        }}
        title="Transform Tabular Data into Graph Databases - Powered by AI"
        description="GraphFlow ETL Suite dramatically simplifies migrating and syncing data from relational databases to graph platforms with intelligent schema mapping, transformations, and error explanations."
        actions={[
          {
            text: "Get Started",
            href: "/connections/sources",
            variant: "glow",
          },
          {
            text: "View Demo",
            href: "/demo",
            variant: "default",
            icon: <ArrowRight className="h-4 w-4" />,
          },
        ]}
        image={{
          src: "/dashboard-preview.png", 
          alt: "GraphFlow ETL Suite Dashboard Preview"
        }}
      />

      {/* Feature Section */}
      <FeatureSection />

      {/* CTA Section */}
      <CTASection
        title="Ready to Transform Your Data?"
        description="Start your journey to powerful graph data insights today. Our platform makes the transition seamless."
        action={{
          text: "Start Free Trial",
          href: "/signup",
          variant: "glow"
        }}
        secondaryAction={{
          text: "Schedule Demo",
          href: "/demo"
        }}
      />
    </div>
  );
} 