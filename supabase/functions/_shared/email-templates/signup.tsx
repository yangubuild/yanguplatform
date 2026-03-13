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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to yangu — confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Hero banner image */}
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

        {/* Greeting */}
        <Heading style={h1}>Hello Builder!</Heading>

        {/* Body text */}
        <Text style={bodyText}>
          Thanks for signing up! Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={emailLink}>{recipient}</Link>
          ) to get started.
        </Text>

        {/* CTA Button as image */}
        <Section style={buttonSection}>
          <Link href={confirmationUrl} style={{ textDecoration: 'none' }}>
            <Img
              src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-button-get-started.png"
              width="260"
              height="64"
              alt="GET STARTED"
              style={buttonImg}
            />
          </Link>
        </Section>

        {/* Sign-off */}
        <Text style={signoffText}>
          Dive in, connect, and let's grow together in style!
        </Text>
        <Text style={signoffLabel}>Your business BFF,</Text>
        <Text style={teamName}>yangu team 🥰</Text>

        {/* Divider */}
        <Hr style={divider} />

        {/* Footer - table layout for left/right alignment */}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ padding: '0 32px 32px' }}>
          <tr>
            <td align="left" style={footerTd}>
              ✉️&nbsp;&nbsp;<Link href="mailto:info@yangu.io" style={footerLink}>info@yangu.io</Link>
            </td>
            <td align="right" style={footerTd}>
              🌐&nbsp;&nbsp;<Link href="https://www.yangu.io" style={footerLink}>www.yangu.io</Link>
            </td>
          </tr>
        </table>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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

const emailLink = {
  color: '#D4731A',
  textDecoration: 'underline',
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
