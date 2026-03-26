/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as lowCreditsReminder } from './low-credits-reminder.tsx'
import { template as creditsExhausted } from './credits-exhausted.tsx'
import { template as paymentFailed } from './payment-failed.tsx'
import { template as trialEnding } from './trial-ending.tsx'
import { template as subscriptionActivated } from './subscription-activated.tsx'
import { template as surfacePublished } from './surface-published.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'low-credits-reminder': lowCreditsReminder,
  'credits-exhausted': creditsExhausted,
  'payment-failed': paymentFailed,
  'trial-ending': trialEnding,
  'subscription-activated': subscriptionActivated,
  'surface-published': surfacePublished,
}
