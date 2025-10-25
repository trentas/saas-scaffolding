import Link from "next/link";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small teams and MVPs",
    price: "$0",
    period: "/month",
    features: [
      "Up to 3 team members",
      "1 organization",
      "Basic analytics",
      "Email support",
      "Standard features"
    ],
    limitations: [
      "No custom domains",
      "Limited API calls",
      "Basic reporting"
    ],
    cta: "Get Started Free",
    href: "/auth/signup",
    popular: false
  },
  {
    name: "Professional",
    description: "Best for growing businesses",
    price: "$29",
    period: "/month",
    features: [
      "Up to 25 team members",
      "Unlimited organizations",
      "Advanced analytics",
      "Priority support",
      "All standard features",
      "Custom domains",
      "API access",
      "Advanced reporting",
      "Webhook integrations"
    ],
    limitations: [],
    cta: "Start Free Trial",
    href: "/auth/signup",
    popular: true
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "$99",
    period: "/month",
    features: [
      "Unlimited team members",
      "Unlimited organizations",
      "Custom analytics",
      "24/7 phone support",
      "All professional features",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee"
    ],
    limitations: [],
    cta: "Contact Sales",
    href: "/contact",
    popular: false
  }
];

export function SaasPricing() {
  return (
    <section className="py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Button 
                  asChild 
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
                
                <div className="space-y-3">
                  <h4 className="font-medium">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, limitationIndex) => (
                      <li key={limitationIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <X className="h-4 w-4 flex-shrink-0" />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
