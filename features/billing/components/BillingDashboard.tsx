'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BillingDashboardProps {
  organizationId: string;
  currentPlan: string;
  subscriptionStatus: string;
}

export default function BillingDashboard({
  organizationId,
  currentPlan,
  subscriptionStatus,
}: BillingDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
          {subscriptionStatus}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription plan and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{currentPlan}</h3>
                <p className="text-sm text-muted-foreground">
                  Current subscription plan
                </p>
              </div>
              <Button className="w-full">
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>
              Your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Team Members</span>
                <span>3 / 10</span>
              </div>
              <div className="flex justify-between">
                <span>API Calls</span>
                <span>1,234 / 10,000</span>
              </div>
              <div className="flex justify-between">
                <span>Storage</span>
                <span>2.5 GB / 10 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
