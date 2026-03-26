import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Img, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  LOGO_URL, SITE_NAME, main, container,
  logoSectionLeft, logoImageLeft,
  contentSection, h1Left, bodyTextLeft,
  signoff, teamLabel, divider,
} from './email-styles.ts'

interface SupportTicketAlertProps {
  name?: string
  email?: string
  category?: string
  description?: string
  ticketId?: string
}

const SupportTicketAlertEmail = ({ name, email, category, description, ticketId }: SupportTicketAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New support ticket from {name || 'a user'} — {category || 'General'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionLeft}>
          <Img src={LOGO_URL} alt={SITE_NAME} style={logoImageLeft} />
        </Section>

        <Section style={contentSection}>
          <Heading style={h1Left}>New Support Ticket</Heading>

          <Text style={bodyTextLeft}>
            A new support ticket has been submitted.
          </Text>

          <Text style={detailStyle}>
            <strong>Reference:</strong> #{ticketId ? ticketId.slice(0, 8).toUpperCase() : '—'}
          </Text>
          <Text style={detailStyle}>
            <strong>From:</strong> {name || 'Unknown'} ({email || '—'})
          </Text>
          <Text style={detailStyle}>
            <strong>Category:</strong> {category || 'General'}
          </Text>

          <Hr style={divider} />

          <Text style={bodyTextLeft}>
            <strong>Message:</strong>
          </Text>
          <Text style={messageStyle}>
            {description || '(No description provided)'}
          </Text>

          <Hr style={divider} />

          <Text style={signoff}>— {SITE_NAME} Support System</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportTicketAlertEmail,
  subject: (data: Record<string, any>) => `New support ticket: ${data.category || 'General'} — #${(data.ticketId || '').slice(0, 8).toUpperCase()}`,
  to: 'support@yangu.io',
  displayName: 'Support ticket alert (internal)',
  previewData: { name: 'Jane Doe', email: 'jane@example.com', category: 'Account Issue', description: 'I cannot access my dashboard settings.', ticketId: 'abc12345-def6-7890' },
} satisfies TemplateEntry

const detailStyle = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.5',
  margin: '0 0 6px',
}

const messageStyle = {
  fontSize: '15px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 20px',
  padding: '12px 16px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  borderLeft: '3px solid #D4731A',
}
