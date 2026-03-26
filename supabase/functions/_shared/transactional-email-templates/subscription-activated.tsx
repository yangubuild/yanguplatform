/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  LOGO_URL, main, container, logoSectionCentered, logoImageCentered,
  badgeRow, badge, h1Centered, bodyTextCentered,
  buttonSectionCentered, ctaButton,
  signoffTextCentered, signoffLabelCentered, teamNameCentered,
  divider, footerTd, footerLink, orangeIcon,
} from './email-styles.ts'

interface Props { name?: string; planName?: string; dashboardUrl?: string }

const SubscriptionActivatedEmail = ({
  name,
  planName = 'Creator',
  dashboardUrl = 'https://yangu.io/dashboard',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your YANGU {planName} plan is now active 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionCentered}>
          <Img src={LOGO_URL} width="140" height="140" alt="yangu" style={logoImageCentered} />
        </Section>
        <Section style={badgeRow}><Text style={badge}>Welcome 🎉</Text></Section>
        <Heading style={h1Centered}>You're In!</Heading>
        <Text style={bodyTextCentered}>
          {name ? `Hey ${name}, your` : 'Your'} <strong>YANGU {planName}</strong> plan is now active. You have full access to all the tools, AI features, and publishing capabilities included in your plan.
        </Text>
        <Section style={buttonSectionCentered}>
          <Link href={dashboardUrl} style={{ display: 'inline-block' }}>
            <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' as const, margin: '0 auto' }}>
              <tr><td align="center" style={ctaButton}>Go to Dashboard</td></tr>
            </table>
          </Link>
        </Section>
        <Text style={signoffTextCentered}>Build, connect, and grow with YANGU!</Text>
        <Text style={signoffLabelCentered}>Your internet business hub,</Text>
        <Text style={teamNameCentered}>Let's go 🚀</Text>
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
  component: SubscriptionActivatedEmail,
  subject: (data) => `Your YANGU ${data.planName ?? 'Creator'} plan is active 🎉`,
  displayName: 'Subscription activated',
  previewData: { name: 'Builder', planName: 'Creator' },
} satisfies TemplateEntry
