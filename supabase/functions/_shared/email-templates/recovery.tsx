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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for yangu</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Centered logo */}
        <Section style={logoSection}>
          <Img
            src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/yangu-email-logo.png"
            width="120"
            height="120"
            alt="yangu"
            style={logoImage}
          />
        </Section>

        {/* News badge */}
        <Section style={badgeRow}>
          <Text style={badge}>Recover 🔑</Text>
        </Section>

        {/* Heading */}
        <Heading style={h1}>Password Reset!</Heading>

        {/* Body text */}
        <Text style={bodyText}>
          We received a request to reset your password. Click below to choose a new one.
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link href={confirmationUrl} style={{ display: 'inline-block' }}>
            <Img
              src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-button-reset-password.png"
              width="230"
              alt="RESET PASSWORD"
              style={ctaButtonImg}
            />
          </Link>
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

export default RecoveryEmail

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

const logoSection = {
  textAlign: 'center' as const,
  padding: '40px 0 8px',
}

const logoImage = {
  display: 'block' as const,
  margin: '0 auto',
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

const ctaButtonImg = {
  display: 'block' as const,
  margin: '0 auto',
  height: 'auto',
  border: 'none',
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
