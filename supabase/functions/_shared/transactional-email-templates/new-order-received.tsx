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

interface Props { name?: string; orderId?: string; orderTotal?: string; dashboardUrl?: string }

const NewOrderReceivedEmail = ({
  name,
  orderId = '#YNG-001',
  orderTotal = 'KES 2,500',
  dashboardUrl = 'https://yangu.io/dashboard/orders',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🎉 New order received — {orderId}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSectionCentered}>
          <Img src={LOGO_URL} width="140" height="140" alt="yangu" style={logoImageCentered} />
        </Section>
        <Section style={badgeRow}><Text style={badge}>New Order 🛒</Text></Section>
        <Heading style={h1Centered}>You've got a new order!</Heading>
        <Text style={bodyTextCentered}>
          {name ? `Hey ${name}, a` : 'A'} new order <strong>{orderId}</strong> has been placed on your YANGU store for <strong>{orderTotal}</strong>.
        </Text>
        <Text style={bodyTextCentered}>
          Head to your dashboard to review the order details and fulfill it.
        </Text>
        <Section style={buttonSectionCentered}>
          <Link href={dashboardUrl} style={{ display: 'inline-block' }}>
            <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' as const, margin: '0 auto' }}>
              <tr><td align="center" style={ctaButton}>View Order</td></tr>
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
  component: NewOrderReceivedEmail,
  subject: (data) => `🎉 New order received — ${data.orderId ?? '#YNG-001'}`,
  displayName: 'New order received',
  previewData: { name: 'Builder', orderId: '#YNG-001', orderTotal: 'KES 2,500' },
} satisfies TemplateEntry
