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
    <Preview>You've been invited to {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href={siteUrl} style={brandLink}>
            <Text style={brandNameStyle}>{siteName}</Text>
          </Link>
        </Section>
        <Hr style={divider} />
        <Section style={content}>
          <Heading style={h1}>You've Been Invited</Heading>
          <Text style={text}>
            You've been invited to join{' '}
            <strong>{siteName}</strong>. Accept the invitation below to create
            your account and discover our luxury villa collection.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accept Invitation
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const gold = '#d4a24e'
const darkCharcoal = '#302e33'
const mutedGray = '#86838c'
const borderColor = '#edecee'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Fira Sans", "Helvetica Neue", Arial, sans-serif',
}
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const header = { textAlign: 'center' as const, paddingBottom: '16px' }
const brandLink = { textDecoration: 'none' }
const brandNameStyle = {
  fontFamily: '"Fira Serif", Georgia, serif',
  fontSize: '24px',
  fontWeight: 500 as const,
  color: darkCharcoal,
  letterSpacing: '0.02em',
  margin: '0',
}
const divider = { borderColor, margin: '24px 0' }
const content = { padding: '8px 0' }
const h1 = {
  fontFamily: '"Fira Serif", Georgia, serif',
  fontSize: '22px',
  fontWeight: 500 as const,
  color: darkCharcoal,
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: mutedGray,
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: gold,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 500 as const,
  borderRadius: '6px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = {
  fontSize: '12px',
  color: mutedGray,
  lineHeight: '1.5',
  margin: '0',
}
