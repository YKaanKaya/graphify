"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Network, Workflow, ChevronRight, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}

function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  const CardContent = () => (
    <>
      <div className="rounded-md bg-primary/10 p-3 w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      {href && (
        <div className="mt-2 flex items-center text-primary hover:underline text-sm">
          <span>Try it now</span>
          <ChevronRight className="h-3 w-3 ml-1" />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <CardContent />
        </div>
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <CardContent />
    </div>
  );
}

export function FeatureSection() {
  return (
    <section className="py-20 bg-muted/30" id="features">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center mb-16">
          <Badge variant="outline">Key Features</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Why choose GraphFlow ETL Suite?
          </h2>
          <p className="text-muted-foreground max-w-[700px] text-lg">
            Our AI-powered ETL platform dramatically simplifies the process of migrating your tabular data to graph databases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <FeatureCard
            icon={<Database className="h-6 w-6 text-primary" />}
            title="Flexible Connectors"
            description="Connect to multiple sources including PostgreSQL, MySQL, SQL Server, Oracle, CSV and JSON files."
            href="/connections/sources"
          />
          <FeatureCard
            icon={<Network className="h-6 w-6 text-primary" />}
            title="Intelligent Schema Mapping"
            description="AI-assisted schema mapping from tabular structure to graph nodes, edges, and properties."
          />
          <FeatureCard
            icon={<Workflow className="h-6 w-6 text-primary" />}
            title="Automated Transformations"
            description="Data cleaning, type conversion, and custom transformations to prepare your data for graph storage."
          />
          <FeatureCard
            icon={<BrainCircuit className="h-6 w-6 text-primary" />}
            title="AI Error Explanations"
            description="Get simple explanations and troubleshooting tips for ETL errors with our AI-powered assistant."
          />
          <FeatureCard
            icon={<Database className="h-6 w-6 text-primary" />}
            title="Multi-Graph Support"
            description="Load to Neo4j, Amazon Neptune, TigerGraph, and more graph databases from a single interface."
          />
          <FeatureCard
            icon={<Workflow className="h-6 w-6 text-primary" />}
            title="Incremental Syncing"
            description="Efficiently update your graph with only changed data using timestamp or change flag detection."
          />
        </div>

        <div className="flex justify-center mt-16">
          <Button size="lg" className="gap-2">
            Explore All Features <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
} 