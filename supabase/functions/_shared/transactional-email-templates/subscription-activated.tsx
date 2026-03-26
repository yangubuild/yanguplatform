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

interface Props { name?: string; planName?: string; dashboardUrl?: string; upgradeUrl?: string; billingCycle?: string }

const isFree = (plan: string) => plan.toLowerCase() === 'free'

const SubscriptionActivatedEmail = ({
  name,
  planName = 'Creator',
  dashboardUrl = 'https://yangu.io/dashboard',
  upgradeUrl = 'https://yangu.io/subscriptions',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{isFree(planName) ? 'Welcome to YANGU — your Free plan is active!' : `Your YANGU ${planName} plan is now active 🎉`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionCentered}>
          <Img src={LOGO_URL} width="140" height="140" alt="yangu" style={logoImageCentered} />
        </Section>
        <Section style={badgeRow}><Text style={badge}>Welcome 🎉</Text></Section>
        <Heading style={h1Centered}>You're In!</Heading>
        <Text style={bodyTextCentered}>
          {name ? `Hey ${name}, your` : 'Your'} <strong>YANGU {planName}</strong> plan is now active.{' '}
          {isFree(planName)
            ? 'You can start exploring YANGU and build your first surface. Your Free plan includes basic tools to get you started.'
            : 'You have full access to all the tools, AI features, and publishing capabilities included in your plan.'}
        </Text>
        {isFree(planName) && (
          <Section style={{ padding: '0 32px 20px' }}>
            <table cellPadding="0" cellSpacing="0" width="100%" style={{ borderCollapse: 'collapse' as const, backgroundColor: '#FFF8F0', borderRadius: '8px', border: '1px solid #F5E6D3' }}>
              <tr><td style={{ padding: '20px 24px' }}>
                <Text style={{ fontSize: '15px', fontWeight: 'bold' as const, color: '#08120D', margin: '0 0 8px' }}>🚀 Ready for more?</Text>
                <Text style={{ fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 12px' }}>
                  Upgrade to <strong>YANGU Creator</strong> to unlock AI tools, custom domains, advanced publishing, and more.
                </Text>
                <Link href={upgradeUrl} style={{ fontSize: '14px', fontWeight: 'bold' as const, color: '#D4731A', textDecoration: 'underline' }}>
                  View plans & upgrade →
                </Link>
              </td></tr>
            </table>
          </Section>
        )}
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
  subject: (data) => {
    const plan = data.planName ?? 'Creator'
    return plan.toLowerCase() === 'free'
      ? 'Welcome to YANGU — your Free plan is active!'
      : `Your YANGU ${plan} plan is active 🎉`
  },
  displayName: 'Subscription activated',
  previewData: { name: 'Builder', planName: 'Free' },
} satisfies TemplateEntry
