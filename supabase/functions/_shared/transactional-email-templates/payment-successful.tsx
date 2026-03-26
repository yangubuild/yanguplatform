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

interface Props { name?: string; amount?: string; dashboardUrl?: string }

const PaymentSuccessfulEmail = ({
  name,
  amount = 'KES 1,500',
  dashboardUrl = 'https://yangu.io/dashboard/billing',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment of {amount} received — thank you!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionCentered}>
          <Img src={LOGO_URL} width="140" height="140" alt="yangu" style={logoImageCentered} />
        </Section>
        <Section style={badgeRow}><Text style={badge}>Payment ✅</Text></Section>
        <Heading style={h1Centered}>Payment Received!</Heading>
        <Text style={bodyTextCentered}>
          {name ? `Thank you ${name}! ` : 'Thank you! '}Your payment of <strong>{amount}</strong> has been successfully processed.
        </Text>
        <Text style={bodyTextCentered}>
          Your account has been updated. You can view your billing history and receipts from your dashboard.
        </Text>
        <Section style={buttonSectionCentered}>
          <Link href={dashboardUrl} style={{ display: 'inline-block' }}>
            <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' as const, margin: '0 auto' }}>
              <tr><td align="center" style={ctaButton}>View Billing</td></tr>
            </table>
          </Link>
        </Section>
        <Text style={signoffTextCentered}>Keep building 🚀</Text>
        <Text style={signoffLabelCentered}>Your internet business hub,</Text>
        <Text style={teamNameCentered}>YANGU Team</Text>
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
  component: PaymentSuccessfulEmail,
  subject: (data) => `Payment of ${data.amount ?? 'KES 1,500'} received ✅`,
  displayName: 'Payment successful',
  previewData: { name: 'Builder', amount: 'KES 1,500' },
} satisfies TemplateEntry
