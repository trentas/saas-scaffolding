'use client';

import { Wrench } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  const { t } = useTranslation();

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
    </div>
  );
}
