/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  LOGO_URL, main, container, logoSectionLeft, logoImageLeft,
  badgeRow, badge, contentSection, greeting, bodyTextLeft,
  linkStyle, buttonSectionLeft, ctaButton, signoff, teamLabel,
  divider, footerTd, footerLink, orangeIcon,
} from './email-styles.ts'

interface Props { name?: string; creditsUrl?: string }

const CreditsExhaustedEmail = ({
  name,
  creditsUrl = 'https://yangu.io/dashboard/credits',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your YANGU credits have been exhausted — services may be paused</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionLeft}>
          <Img src={LOGO_URL} width="120" height="120" alt="yangu" style={logoImageLeft} />
        </Section>
        <Section style={badgeRow}><Text style={badge}>Urgent 🚨</Text></Section>
        <Section style={contentSection}>
          <Text style={greeting}>Hi{name ? ` ${name}` : ''},</Text>
          <Text style={bodyTextLeft}>Your <strong>YANGU</strong> account credits have been fully exhausted.</Text>
          <Text style={bodyTextLeft}>Some of your services — including AI tools, store operations, and publishing — may be paused until you add more credits.</Text>
        </Section>
        <Section style={buttonSectionLeft}>
          <Link href={creditsUrl} style={{ display: 'inline-block' }}>
            <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' as const }}>
              <tr><td align="center" style={ctaButton}>Add Funds Now</td></tr>
            </table>
          </Link>
        </Section>
        <Section style={contentSection}>
          <Text style={bodyTextLeft}>If you need help, contact <Link href="mailto:support@yangu.io" style={linkStyle}>support</Link>.</Text>
          <Text style={signoff}>Best regards,</Text>
          <Text style={teamLabel}>YANGU Team</Text>
        </Section>
        <Hr style={divider} />
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ padding: '0 32px 32px' }}>
          <tr>
            <td align="left" style={footerTd}><span style={orangeIcon}>✉️</span>&nbsp;&nbsp;<Link href="mailto:info@yangu.io" style={footerLink}>info@yangu.io</Link></td>
            <td align="right" style={footerTd}><span style={orangeIcon}>🌐</span>&nbsp;&nbsp;<Link href="https://www.yangu.io" style={footerLink}>www.yangu.io</Link></td>
          </tr>
        </table>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CreditsExhaustedEmail,
  subject: 'Your YANGU credits have been exhausted',
  displayName: 'Credits exhausted',
  previewData: { name: 'Builder' },
} satisfies TemplateEntry
