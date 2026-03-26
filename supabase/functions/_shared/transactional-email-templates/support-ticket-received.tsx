import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Img, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  LOGO_URL, SITE_NAME, main, container,
  logoSectionLeft, logoImageLeft,
  contentSection, h1Left, greeting, bodyTextLeft,
  signoff, teamLabel, divider,
} from './email-styles.ts'

interface SupportTicketReceivedProps {
  name?: string
  category?: string
  ticketId?: string
}

const SupportTicketReceivedEmail = ({ name, category, ticketId }: SupportTicketReceivedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your support request — {SITE_NAME} Support</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionLeft}>
          <Img src={LOGO_URL} alt={SITE_NAME} style={logoImageLeft} />
        </Section>

        <Section style={contentSection}>
          <Heading style={h1Left}>Support Request Received</Heading>

          <Text style={greeting}>
            {name ? `Hi ${name},` : 'Hi there,'}
          </Text>

          <Text style={bodyTextLeft}>
            We've received your support request{category ? ` regarding "${category}"` : ''} and our team will review it shortly.
          </Text>

          {ticketId && (
            <Text style={bodyTextLeft}>
              <strong>Reference:</strong> #{ticketId.slice(0, 8).toUpperCase()}
            </Text>
          )}

          <Text style={bodyTextLeft}>
            You'll receive a response from our team via email at <strong>support@yangu.io</strong>. You can also check your support messages in your dashboard under Messages → Support.
          </Text>

          <Hr style={divider} />

          <Text style={signoff}>Best regards,</Text>
          <Text style={teamLabel}>The {SITE_NAME} Support Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportTicketReceivedEmail,
  subject: 'We received your support request',
  displayName: 'Support ticket received',
  previewData: { name: 'Jane', category: 'Account Issue', ticketId: 'abc12345-def6-7890' },
} satisfies TemplateEntry
