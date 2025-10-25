'use client';

import { useState } from 'react';

import { Check, CreditCard, Download } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


// Mock data - in real app, this would come from API
const currentPlan = {
  name: 'Pro',
  price: 29,
  period: 'month',
  features: [
    'Unlimited team members',
    'Priority support',
    'Unlimited organizations',
    'Advanced analytics',
  ],
  status: 'active',
  nextBillingDate: '2024-12-15',
};

const availablePlans = [
  {
    name: 'Free',
    price: 0,
    period: 'month',
    features: [
      'Up to 5 team members',
      'Basic support',
      '1 organization',
    ],
    current: false,
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    features: [
      'Unlimited team members',
      'Priority support',
      'Unlimited organizations',
      'Advanced analytics',
    ],
    current: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    period: 'month',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    current: false,
  },
];

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planName: string) => {
    setIsLoading(true);
    try {
      // Handle upgrade logic
      // eslint-disable-next-line no-console
      console.log('Upgrading to:', planName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error upgrading plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      // Handle billing portal logic
      // eslint-disable-next-line no-console
      console.log('Opening billing portal');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error opening billing portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <Badge variant={currentPlan.status === 'active' ? 'default' : 'secondary'}>
          {currentPlan.status}
        </Badge>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
              <p className="text-3xl font-bold">
                ${currentPlan.price}
                <span className="text-lg font-normal text-muted-foreground">
                  /{currentPlan.period}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Next billing date: {new Date(currentPlan.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={handleManageBilling} disabled={isLoading}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Your current usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium">Team Members</h4>
              <p className="text-2xl font-bold">3 / Unlimited</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan.name === 'Free' ? 'Upgrade for more members' : 'Unlimited members'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">API Calls</h4>
              <p className="text-2xl font-bold">1,234 / 10,000</p>
              <p className="text-sm text-muted-foreground">
                This month
              </p>
            </div>
            <div>
              <h4 className="font-medium">Storage</h4>
              <p className="text-2xl font-bold">2.5 GB / 10 GB</p>
              <p className="text-sm text-muted-foreground">
                Used this month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that's right for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card key={plan.name} className={plan.current ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.current && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {!plan.current && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={isLoading}
                    >
                      {plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
