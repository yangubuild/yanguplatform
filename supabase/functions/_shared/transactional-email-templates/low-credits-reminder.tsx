/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'yangu'
const LOGO_URL =
  'https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/yangu-email-logo.png'
const CTA_BUTTON_URL =
  'https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-button-get-started.png'

interface LowCreditsReminderProps {
  name?: string
  creditsUrl?: string
}

const LowCreditsReminderEmail = ({
  name,
  creditsUrl = 'https://yangu.io/dashboard/credits',
}: LowCreditsReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your YANGU credits are running low — add funds to avoid interruptions</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* TYPE B: Left-aligned system alert layout */}
        <Section style={headerSection}>
          <Img
            src={LOGO_URL}
            width="120"
            height="120"
            alt="yangu"
            style={logoImage}
          />
        </Section>

        {/* Badge */}
        <Section style={badgeRow}>
          <Text style={badge}>Alert ⚠️</Text>
        </Section>

        {/* Content — left-aligned */}
        <Section style={contentSection}>
          <Text style={greeting}>
            Hi{name ? ` ${name}` : ''},
          </Text>

          <Text style={bodyText}>
            Your <strong>YANGU</strong> account credits are running low.
          </Text>

          <Text style={bodyText}>
            To avoid interruptions in your services (AI tools, store activity, publishing), please add funds to your account.
          </Text>
        </Section>

        {/* CTA Button — YANGU gradient */}
        <Section style={buttonSection}>
          <Link href={creditsUrl} style={{ display: 'inline-block' }}>
            <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' as const }}>
              <tr>
                <td
                  align="center"
                  style={ctaButton}
                >
                  Add Funds
                </td>
              </tr>
            </table>
          </Link>
        </Section>

        <Section style={contentSection}>
          <Text style={bodyText}>
            If you need help, contact{' '}
            <Link href="mailto:support@yangu.io" style={linkStyle}>support</Link>.
          </Text>

          <Text style={signoff}>
            Best regards,
          </Text>
          <Text style={teamLabel}>YANGU Team</Text>
        </Section>

        {/* Divider */}
        <Hr style={divider} />

        {/* Footer */}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ padding: '0 32px 32px' }}>
          <tr>
            <td align="left" style={footerTd}>
              <span style={orangeIcon}>✉️</span>&nbsp;&nbsp;
              <Link href="mailto:info@yangu.io" style={footerLink}>info@yangu.io</Link>
            </td>
            <td align="right" style={footerTd}>
              <span style={orangeIcon}>🌐</span>&nbsp;&nbsp;
              <Link href="https://www.yangu.io" style={footerLink}>www.yangu.io</Link>
            </td>
          </tr>
        </table>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LowCreditsReminderEmail,
  subject: 'Your YANGU credits are running low',
  displayName: 'Low credits reminder',
  previewData: { name: 'Builder' },
} satisfies TemplateEntry

/* ── TYPE B Styles — Left-aligned system alert ── */

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Lufga', Arial, sans-serif",
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0',
}

const headerSection = {
  textAlign: 'left' as const,
  padding: '28px 32px 0',
}

const logoImage = {
  display: 'block' as const,
  width: '120px',
  height: '120px',
}

const badgeRow = {
  textAlign: 'right' as const,
  padding: '16px 32px 0',
}

const badge = {
  display: 'inline-block' as const,
  fontSize: '13px',
  color: '#333333',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '4px 12px',
  margin: '0',
}

const contentSection = {
  padding: '0 32px',
}

const greeting = {
  fontSize: '16px',
  color: '#08120D',
  lineHeight: '1.6',
  margin: '16px 0 8px',
}

const bodyText = {
  fontSize: '16px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const linkStyle = {
  color: '#D4731A',
  textDecoration: 'underline',
}

const buttonSection = {
  textAlign: 'left' as const,
  padding: '8px 32px 24px',
}

const ctaButton = {
  background: 'linear-gradient(135deg, #D4731A 0%, #E8943A 100%)',
  backgroundColor: '#D4731A',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '14px 36px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}

const signoff = {
  fontSize: '15px',
  color: '#55575d',
  margin: '8px 0 4px',
}

const teamLabel = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  margin: '0 0 32px',
}

const divider = {
  borderColor: '#e5e5e5',
  borderStyle: 'dashed' as const,
  margin: '0 32px 24px',
}

const footerTd = {
  fontSize: '13px',
  color: '#888888',
}

const footerLink = {
  color: '#888888',
  textDecoration: 'none',
}

const orangeIcon = {
  color: '#D4731A',
  fontSize: '14px',
}
