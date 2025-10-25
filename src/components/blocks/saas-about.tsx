import Link from "next/link";

import { ArrowRight, Code, Rocket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Active Users", value: "10,000+" },
  { label: "Organizations", value: "2,500+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Support", value: "24/7" }
];

const values = [
  {
    icon: Code,
    title: "Developer First",
    description: "Built by developers, for developers. Clean code, comprehensive documentation, and easy customization."
  },
  {
    icon: Rocket,
    title: "Launch Fast",
    description: "Get your SaaS up and running in days, not months. Focus on your core business logic, not infrastructure."
  },
  {
    icon: Users,
    title: "Scale with Confidence",
    description: "Architected to handle growth from startup to enterprise with multi-tenant isolation and performance optimization."
  }
];

export function SaasAbout() {
  return (
    <section className="py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for modern SaaS development
          </h2>
          <p className="text-muted-foreground text-lg">
            We understand the challenges of building a SaaS from scratch. That's why we created 
            this comprehensive scaffolding that handles all the complex parts, so you can focus 
            on what makes your product unique.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {values.map((value, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {value.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h3 className="mb-4 text-2xl font-bold">Ready to build your SaaS?</h3>
            <p className="mb-8 text-muted-foreground">
              Join thousands of developers who have already launched their SaaS using our scaffolding.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="group">
                <Link href="/auth/signup">
                  Start Building Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
