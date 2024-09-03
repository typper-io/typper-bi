import * as React from 'react'
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
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

interface InviteEmailProps {
  workspaceLink?: string
  workspaceName?: string
  userName?: string
}

export const InviteEmail = ({
  workspaceLink,
  workspaceName,
  userName,
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Join in {workspaceName} workspace.</Preview>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container>
          <Img
            src="https://storage.googleapis.com/typper-bi/Blue%20combination%20mark.png"
            width="80"
            height="25"
            alt="Typper"
          />

          <Hr className="border-[#E2E8F0] mt-8" />

          <Heading className="text-3xl text-[#020817] font-bold mt-8 mb-0">
            Join {workspaceName}
          </Heading>

          <Section className="mt-8">
            <Text className="text-base leading-8 text-[#020817]">
              You have been invited to join the workspace {workspaceName} by{' '}
              {userName}.
            </Text>
            <Text className="text-base leading-8 text-[#020817]">
              <Link
                href={workspaceLink}
                className="text-[#2563EB] underline-offset-1"
              >
                Join the workspace
              </Link>{' '}
              to collaborate with your colleagues even more efficiently.
            </Text>
            <Button
              href={workspaceLink}
              className="bg-[#2563EB] text-[#F8FAFC] text-center rounded-md py-2 px-4 mt-4"
            >
              Join workspace
            </Button>
            <Text className="text-base leading-8 text-[#020817] mt-4">
              Best regards,
              <br /> Typper BI Team
            </Text>
          </Section>

          <Hr className="border-[#E2E8F0] my-12" />

          <Text className="text-sm text-[#020817]">Needing help?</Text>
          <Text className="text-sm text-[#020817]">
            Contact us at:{' '}
            <Link
              href="mailto:help-bi@typper.io"
              className="text-[#2563EB] underline-offset-1"
            >
              help-bi@typper.io
            </Link>
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
