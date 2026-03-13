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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for yangu</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Hero banner image */}
        <Img
          src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-header-3.png"
          width="100%"
          alt="Build & Sell with yangu"
          style={heroImage}
        />

        {/* News badge */}
        <Section style={badgeRow}>
          <Text style={badge}>Access ✨</Text>
        </Section>

        {/* Heading */}
        <Heading style={h1}>Magic Link!</Heading>

        {/* Body text */}
        <Text style={bodyText}>
          Click below to log in to yangu. This link will expire shortly.
        </Text>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link href={confirmationUrl} style={{ display: 'inline-block' }}>
            <Img
              src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-button-log-in.png"
              width="230"
              alt="LOG IN"
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

export default MagicLinkEmail

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
