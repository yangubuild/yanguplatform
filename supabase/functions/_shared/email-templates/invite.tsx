/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join yangu</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Hero banner image — same as Confirm Signup */}
        <Img
          src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-header-welcome.png"
          width="100%"
          alt="Welcome to yangu"
          style={heroImage}
        />

        {/* News badge */}
        <Section style={badgeRow}>
          <Text style={badge}>News 🔥</Text>
        </Section>

        {/* Heading */}
        <Heading style={h1}>Invite</Heading>

        {/* Body text */}
        <Text style={bodyText}>
          You've been invited to join yangu. Click below to accept and create your account.
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Button href={confirmationUrl} style={ctaButton}>
            ACCEPT INVITE
          </Button>
        </Section>

        {/* Sign-off */}
        <Text style={signoffText}>
          Build, connect, and grow wealth with yangu!
        </Text>
        <Text style={signoffLabel}>Your internet business hub,</Text>
        <Text style={teamName}>Lets go 🚀</Text>

        {/* Divider */}
        <Hr style={divider} />

        {/* Footer */}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ padding: '0 32px 32px' }}>
          <tr>
            <td align="left" style={footerTd}>
              <span style={orangeIcon}>✉️</span>&nbsp;&nbsp;<Link href="mailto:info@yangu.io" style={footerLink}>info@yangu.io</Link>
            </td>
            <td align="right" style={footerTd}>
              <span style={orangeIcon}>🌐</span>&nbsp;&nbsp;<Link href="https://www.yangu.io" style={footerLink}>www.yangu.io</Link>
            </td>
          </tr>
        </table>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

/* ── Styles ── */

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Lufga', Arial, sans-serif",
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0',
}

const heroImage = {
  display: 'block' as const,
  width: '100%',
  height: 'auto',
  borderRadius: '0',
  margin: '0 auto',
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

const h1 = {
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  textAlign: 'center' as const,
  margin: '24px 0 16px',
}

const bodyText = {
  fontSize: '16px',
  color: '#55575d',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  padding: '0 32px',
  margin: '0 0 32px',
}

const buttonSection = {
  textAlign: 'center' as const,
  padding: '0 32px 32px',
}

const buttonImg = {
  display: 'block' as const,
  margin: '0 auto',
  borderRadius: '14px',
}

const signoffText = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  padding: '0 32px',
}

const signoffLabel = {
  fontSize: '15px',
  color: '#55575d',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

const teamName = {
  fontSize: '20px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  textAlign: 'center' as const,
  margin: '0 0 40px',
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
