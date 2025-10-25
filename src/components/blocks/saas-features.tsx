import { 
  BarChart3,
  Building2, 
  CreditCard, 
  Globe,
  Lock,
  Mail,
  Settings,
  Shield, 
  Users
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Multi-Tenant Architecture",
    description: "Built-in tenant isolation with subdomain routing and data separation for complete security."
  },
  {
    icon: Shield,
    title: "Authentication & Authorization",
    description: "NextAuth.js integration with Google OAuth, email/password, and role-based access control."
  },
  {
    icon: CreditCard,
    title: "Stripe Billing Integration",
    description: "Complete subscription management with Stripe, including webhooks and billing portals."
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Invite team members, manage roles, and control access to different features."
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Built-in analytics and reporting to track usage, revenue, and user engagement."
  },
  {
    icon: Settings,
    title: "Feature Flags",
    description: "Enable/disable features per tenant with a flexible configuration system."
  },
  {
    icon: Globe,
    title: "API Management",
    description: "Generate and manage API keys for integrations with rate limiting and monitoring."
  },
  {
    icon: Lock,
    title: "Security First",
    description: "Row Level Security (RLS), data encryption, and security best practices built-in."
  },
  {
    icon: Mail,
    title: "Email System",
    description: "Transactional emails, notifications, and marketing campaigns with SMTP integration."
  }
];

export function SaasFeatures() {
  return (
    <section className="py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to build a SaaS
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete scaffolding with all the essential features to launch your SaaS quickly and securely.
          </p>
        </div>
        
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
