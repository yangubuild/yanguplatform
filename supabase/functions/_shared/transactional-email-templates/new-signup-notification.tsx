import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Img, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  LOGO_URL, SITE_NAME, main, container,
  logoSectionLeft, logoImageLeft,
  contentSection, h1Left, bodyTextLeft,
  signoff, divider,
} from './email-styles.ts'

interface NewSignupNotificationProps {
  newUserEmail?: string
  signupAt?: string
  userId?: string
}

const NewSignupNotificationEmail = ({ newUserEmail, signupAt, userId }: NewSignupNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New signup: {newUserEmail || 'unknown user'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionLeft}>
          <Img src={LOGO_URL} alt={SITE_NAME} style={logoImageLeft} />
        </Section>

        <Section style={contentSection}>
          <Heading style={h1Left}>New Yangu signup</Heading>

          <Text style={bodyTextLeft}>
            A new account just signed up to {SITE_NAME}.
          </Text>

          <Text style={detailStyle}>
            <strong>Email:</strong> {newUserEmail || '—'}
          </Text>
          <Text style={detailStyle}>
            <strong>Signed up at (UTC):</strong> {signupAt || '—'}
          </Text>
          <Text style={detailStyle}>
            <strong>User ID:</strong> {userId || '—'}
          </Text>

          <Hr style={divider} />

          <Text style={bodyTextLeft}>
            Review and add them to the dashboard allowlist if approved.
          </Text>

          <Text style={signoff}>— {SITE_NAME} platform</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewSignupNotificationEmail,
  subject: (data: Record<string, any>) => `New Yangu signup: ${data.newUserEmail || 'unknown user'}`,
  to: 'info@yangu.io',
  displayName: 'New signup notification (internal)',
  previewData: {
    newUserEmail: 'jane@example.com',
    signupAt: '2026-06-25T12:34:56Z',
    userId: '00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry

const detailStyle = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.5',
  margin: '0 0 6px',
}