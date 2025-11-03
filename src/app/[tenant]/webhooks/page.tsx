'use client';

import { Webhook } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WebhooksPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('webhooks.title')}</h1>
          <p className="text-muted-foreground">
            {t('webhooks.subtitle')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {t('webhooks.underDevelopment')}
          </CardTitle>
          <CardDescription>
            {t('webhooks.underDevelopmentDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            {t('webhooks.underDevelopmentMessage')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

