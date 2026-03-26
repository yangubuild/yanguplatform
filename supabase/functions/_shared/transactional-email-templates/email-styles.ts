/// <reference types="npm:@types/react@18.3.1" />
/**
 * YANGU Email Design System — LOCKED
 *
 * DO NOT modify values below without explicit approval.
 * All transactional and system emails consume these tokens.
 */

// ── Assets ──
export const LOGO_URL =
  'https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/yangu-email-logo.png'
export const SITE_NAME = 'yangu'

// ── Spacing Tokens (px) ──
export const SPACING = {
  topPadding: 28,
  logoToHeading: 12,
  sectionGap: 20,
  ctaGap: 24,
  contentPadH: 32,
} as const

// ── Logo Sizes ──
export const LOGO_SIZE = {
  typeA: 140, // centered product emails
  typeB: 120, // left-aligned system alerts
} as const

// ── Shared Styles ──

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Lufga', Arial, sans-serif",
}

export const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0',
}

// TYPE A — centered logo
export const logoSectionCentered = {
  textAlign: 'center' as const,
  padding: `${SPACING.topPadding}px 0 0`,
}

export const logoImageCentered = {
  display: 'block' as const,
  margin: '0 auto',
  width: `${LOGO_SIZE.typeA}px`,
  height: `${LOGO_SIZE.typeA}px`,
}

// TYPE B — left-aligned logo
export const logoSectionLeft = {
  textAlign: 'left' as const,
  padding: `${SPACING.topPadding}px ${SPACING.contentPadH}px 0`,
}

export const logoImageLeft = {
  display: 'block' as const,
  width: `${LOGO_SIZE.typeB}px`,
  height: `${LOGO_SIZE.typeB}px`,
}

// Badge row (right-aligned, same for both types)
export const badgeRow = {
  textAlign: 'right' as const,
  padding: `16px ${SPACING.contentPadH}px 0`,
}

export const badge = {
  display: 'inline-block' as const,
  fontSize: '13px',
  color: '#333333',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '4px 12px',
  margin: '0',
}

// Typography
export const h1Centered = {
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  textAlign: 'center' as const,
  margin: `${SPACING.logoToHeading}px 0 16px`,
}

export const h1Left = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  margin: `${SPACING.logoToHeading}px 0 16px`,
}

export const bodyTextCentered = {
  fontSize: '16px',
  color: '#55575d',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  padding: `0 ${SPACING.contentPadH}px`,
  margin: `0 0 ${SPACING.sectionGap}px`,
}

export const bodyTextLeft = {
  fontSize: '16px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

export const contentSection = {
  padding: `0 ${SPACING.contentPadH}px`,
}

export const greeting = {
  fontSize: '16px',
  color: '#08120D',
  lineHeight: '1.6',
  margin: '16px 0 8px',
}

export const linkStyle = {
  color: '#D4731A',
  textDecoration: 'underline',
}

// CTA Button — YANGU gradient (LOCKED — do not change)
export const buttonSectionCentered = {
  textAlign: 'center' as const,
  padding: `0 ${SPACING.contentPadH}px ${SPACING.ctaGap}px`,
}

export const buttonSectionLeft = {
  textAlign: 'left' as const,
  padding: `8px ${SPACING.contentPadH}px ${SPACING.ctaGap}px`,
}

export const ctaButton = {
  background: 'linear-gradient(135deg, #D4731A 0%, #E8943A 100%)',
  backgroundColor: '#D4731A',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '14px 36px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}

// Sign-off
export const signoff = {
  fontSize: '15px',
  color: '#55575d',
  margin: '8px 0 4px',
}

export const teamLabel = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  margin: '0 0 32px',
}

export const signoffTextCentered = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  padding: `0 ${SPACING.contentPadH}px`,
}

export const signoffLabelCentered = {
  fontSize: '15px',
  color: '#55575d',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

export const teamNameCentered = {
  fontSize: '20px',
  fontWeight: 'bold' as const,
  color: '#08120D',
  textAlign: 'center' as const,
  margin: '0 0 40px',
}

// Divider & Footer
export const divider = {
  borderColor: '#e5e5e5',
  borderStyle: 'dashed' as const,
  margin: `0 ${SPACING.contentPadH}px 24px`,
}

export const footerTd = {
  fontSize: '13px',
  color: '#888888',
}

export const footerLink = {
  color: '#888888',
  textDecoration: 'none',
}

export const orangeIcon = {
  color: '#D4731A',
  fontSize: '14px',
}
