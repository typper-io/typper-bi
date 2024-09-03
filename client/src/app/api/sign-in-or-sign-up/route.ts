import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'

import { api } from '@/services/api'
import authOptions from '@/app/api/auth/[...nextauth]/authOptions'

export const GET = async (req: any) => {
  const searchParams = req.nextUrl.searchParams
  const callbackUrl = searchParams.get('callbackUrl')

  const session = await getServerSession(authOptions)

  const appUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `https://${process.env.APP_DOMAIN}`

  if (!session?.user) {
    return Response.redirect(appUrl)
  }

  let finalCookies = ''

  if (cookies().get('next-auth.session-token')) {
    finalCookies += `${cookies().get('next-auth.session-token')?.name}=${
      cookies().get('next-auth.session-token')?.value
    }; `
  }

  if (cookies().get('__Secure-next-auth.session-token')) {
    finalCookies += `${
      cookies().get('__Secure-next-auth.session-token')?.name
    }=${cookies().get('__Secure-next-auth.session-token')?.value}`
  }

  try {
    const { data } = await api.post(
      '/sign-in-or-sign-up',
      {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
      },
      {
        headers: {
          Cookie: finalCookies,
        },
      }
    )

    if (data.redirectUrl) {
      return Response.redirect(appUrl + data.redirectUrl)
    }

    if (callbackUrl.includes(appUrl)) {
      return Response.redirect(callbackUrl)
    }

    return Response.redirect(appUrl + callbackUrl)
  } catch (error) {
    console.log(error)
  }
}
