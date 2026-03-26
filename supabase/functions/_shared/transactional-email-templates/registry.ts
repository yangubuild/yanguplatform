/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

// TYPE B — System Alerts (left-aligned)
import { template as lowCreditsReminder } from './low-credits-reminder.tsx'
import { template as creditsExhausted } from './credits-exhausted.tsx'
import { template as paymentFailed } from './payment-failed.tsx'
import { template as trialEnding } from './trial-ending.tsx'

// TYPE A — Product / Success (centered)
import { template as subscriptionActivated } from './subscription-activated.tsx'
import { template as surfacePublished } from './surface-published.tsx'
import { template as newOrderReceived } from './new-order-received.tsx'
import { template as paymentSuccessful } from './payment-successful.tsx'
import { template as kycApproved } from './kyc-approved.tsx'
import { template as supportTicketReceived } from './support-ticket-received.tsx'
import { template as supportTicketAlert } from './support-ticket-alert.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  // TYPE B — System Alerts
  'low-credits-reminder': lowCreditsReminder,
  'credits-exhausted': creditsExhausted,
  'payment-failed': paymentFailed,
  'trial-ending': trialEnding,
  // TYPE A — Product / Success
  'subscription-activated': subscriptionActivated,
  'surface-published': surfacePublished,
  'new-order-received': newOrderReceived,
  'payment-successful': paymentSuccessful,
  'kyc-approved': kycApproved,
  // Support
  'support-ticket-received': supportTicketReceived,
  'support-ticket-alert': supportTicketAlert,
}
