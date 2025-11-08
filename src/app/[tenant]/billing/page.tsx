'use client';

import { AlertCircle, Wrench } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { useFeatureEnabled } from '@/lib/features/client';

export default function BillingPage() {
  const { t } = useTranslation();
  const stripeEnabled = useFeatureEnabled('stripeSupport');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('billing.title')}</h1>
          <p className="text-muted-foreground">
            {t('billing.subtitle')}
          </p>
        </div>
      </div>

      {!stripeEnabled ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('billing.enableStripeTitle')}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{t('billing.enableStripeDescription')}</p>
            <p className="text-muted-foreground">
              {t('billing.enableStripeHint')}
            </p>
          </AlertDescription>
        </Alert>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t('billing.underDevelopment')}
          </CardTitle>
          <CardDescription>
            {t('billing.underDevelopmentDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            {t('billing.underDevelopmentMessage')}
          </p>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
