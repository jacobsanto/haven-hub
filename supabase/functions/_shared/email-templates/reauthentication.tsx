/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandNameStyle}>Arivia Villas</Text>
        </Section>
        <Hr style={divider} />
        <Section style={content}>
          <Heading style={h1}>Verification Code</Heading>
          <Text style={text}>
            Use the code below to confirm your identity:
          </Text>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 500 as const,
  color: gold,
  letterSpacing: '0.15em',
  margin: '0 0 24px',
}
const footer = {
  fontSize: '12px',
  color: mutedGray,
  lineHeight: '1.5',
  margin: '0',
}
