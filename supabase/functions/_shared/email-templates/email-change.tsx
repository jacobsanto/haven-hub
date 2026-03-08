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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandNameStyle}>{siteName}</Text>
        </Section>
        <Hr style={divider} />
        <Section style={content}>
          <Heading style={h1}>Confirm Email Change</Heading>
          <Text style={text}>
            You requested to change your email from{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>
            Click below to confirm this change:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirm Email Change
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const aegeanNavy = '#1A3A5C'
const copperGold = '#C4956A'
const mutedGray = '#7F8C8D'
const borderColor = '#ECF0F1'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Nunito Sans", "Helvetica Neue", Arial, sans-serif',
}
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const header = { textAlign: 'center' as const, paddingBottom: '16px' }
const brandNameStyle = {
  fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
  fontSize: '24px',
  fontWeight: 600 as const,
  color: aegeanNavy,
  letterSpacing: '0.02em',
  margin: '0',
}
const divider = { borderColor, margin: '24px 0' }
const content = { padding: '8px 0' }
const h1 = {
  fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
  fontSize: '22px',
  fontWeight: 600 as const,
  color: aegeanNavy,
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: mutedGray,
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: aegeanNavy,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600 as const,
  borderRadius: '25px',
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
