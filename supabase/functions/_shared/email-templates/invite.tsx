/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
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
    <Preview>You've been invited to join YANGU</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/yangu-logo-email.png" width="48" height="48" alt="YANGU" style={{ marginBottom: '24px' }} />
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join YANGU. Click below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Lufga', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#08120D', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 28px' }
const button = { backgroundColor: '#D4731A', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 24px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
