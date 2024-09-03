import { cookies } from 'next/headers'

import Container from '@/components/container'
import { Toaster } from '@/components/ui/sonner'
import { MobileHide } from '@/components/mobile-hide'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const selectWorkspace = async (workspaceId: string) => {
    'use server'

    cookies().set('workspace-id', workspaceId, {})
  }

  return (
    <>
      <MobileHide />
      <Container selectWorkspace={selectWorkspace}>{children}</Container>
      <Toaster />
    </>
  )
}
