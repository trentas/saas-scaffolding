import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's included in the SaaS scaffolding?",
    answer: "The scaffolding includes multi-tenant architecture, authentication (NextAuth.js), billing integration (Stripe), team management, analytics dashboard, API management, email system, and security features like RLS. Everything you need to launch a production-ready SaaS."
  },
  {
    question: "Do I need to know specific technologies to use this?",
    answer: "Basic knowledge of React, Next.js, and TypeScript is helpful, but we provide comprehensive documentation and examples. The code is well-commented and follows best practices to make it easy to understand and customize."
  },
  {
    question: "Can I customize the design and branding?",
    answer: "Absolutely! The scaffolding uses shadcn/ui components with Tailwind CSS, making it easy to customize colors, fonts, layouts, and components. You can also replace the default components with your own designs."
  },
  {
    question: "How does the multi-tenant architecture work?",
    answer: "The scaffolding uses subdomain-based routing (e.g., yourcompany.yourapp.com) with Supabase Row Level Security (RLS) to ensure complete data isolation between tenants. Each tenant has their own isolated data and can customize their experience."
  },
  {
    question: "What payment methods are supported?",
    answer: "The Stripe integration supports all major payment methods including credit cards, debit cards, digital wallets (Apple Pay, Google Pay), and bank transfers. You can also set up subscription billing, one-time payments, and usage-based billing."
  },
  {
    question: "Is there a free trial or money-back guarantee?",
    answer: "Yes! We offer a 14-day free trial with no credit card required. If you're not satisfied within the first 30 days, we'll provide a full refund. We're confident you'll love the scaffolding."
  },
  {
    question: "Can I deploy this to my own infrastructure?",
    answer: "Yes, the scaffolding is designed to be deployed anywhere. We provide deployment guides for Vercel, AWS, Google Cloud, and other platforms. You can also deploy to your own servers or use any hosting provider."
  },
  {
    question: "What kind of support do you provide?",
    answer: "We provide comprehensive documentation, code examples, and community support. For paid plans, we offer priority email support and for Enterprise customers, we provide dedicated support and consultation."
  },
  {
    question: "Can I use this for multiple projects?",
    answer: "Yes! Once you purchase the scaffolding, you can use it for unlimited personal and commercial projects. There are no restrictions on the number of projects or applications you can build with it."
  },
  {
    question: "How often is the scaffolding updated?",
    answer: "We regularly update the scaffolding with new features, security patches, and improvements. All updates are included at no extra cost. We also provide migration guides for major version updates."
  }
];

export function SaasFAQ() {
  return (
    <section className="py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about our SaaS scaffolding. Can't find what you're looking for?
            <a href="/contact" className="text-primary hover:underline"> Contact us</a>.
          </p>
        </div>
        
        <div className="mt-16">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="rounded-lg border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
