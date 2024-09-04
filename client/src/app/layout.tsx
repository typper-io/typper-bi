import type { Metadata } from 'next'

import './globals.css'
import { getServerSession } from 'next-auth'
import Head from 'next/head'

import { ThemeProvider } from '@/components/theme-provider'
import Provider from '@/app/context/client-provider'
import { fontSora } from '@/fonts/font-sora'
import QueryProvider from '@/app/context/query-provider'
import authOptions from '@/app/api/auth/[...nextauth]/authOptions'

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.APP_DOMAIN}`),
  title: 'Typper BI - Business Intelligence',
  description: 'Use AI to be more productive at work.',
  icons: {
    icon: [
      {
        url: '/logo.svg',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://typper.com',
    siteName: 'Typper BI',
    images: [
      {
        url: '/logo.svg',
        width: 1280,
        height: 720,
        alt: 'Typper BI',
      },
    ],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions())

  return (
    <html
      lang="en"
      suppressHydrationWarning
      suppressContentEditableWarning
      className={fontSora.className}
    >
      <Head>
        <link rel="icon" href="/logo.svg" />
      </Head>
      <body className="min-h-screen bg-screen font-sora antialiased">
        <Provider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  )
}
