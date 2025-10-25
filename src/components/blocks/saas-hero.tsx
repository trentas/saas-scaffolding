import Link from "next/link";

import { ArrowRight, CheckCircle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SaasHero() {
  return (
    <section className="py-28 lg:pt-44 lg:pb-32">
      <div className="container">
        <div className="flex flex-col gap-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="from-foreground to-foreground/70 relative mb-6 bg-linear-to-br bg-clip-text py-2 text-5xl font-bold text-transparent sm:text-6xl lg:text-7xl">
              Build Your SaaS
              <br />
              <span className="text-primary">Faster Than Ever</span>
            </h1>
            <p className="text-muted-foreground mb-8 text-xl leading-snug">
              A complete multi-tenant SaaS scaffolding with authentication, billing, 
              team management, and more. Start building your next big idea today.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="group min-w-[200px] gap-2">
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
          
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="relative rounded-2xl border bg-card p-8 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground">
                  <Zap className="size-4" />
                  <span className="text-sm font-medium">Live Demo</span>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-semibold">Multi-Tenant Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Built-in tenant isolation and subdomain routing
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    NextAuth.js with Google OAuth and email/password
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Billing Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Stripe integration for subscriptions and payments
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
