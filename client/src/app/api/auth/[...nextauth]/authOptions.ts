import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const authOptions: () => AuthOptions = () => {
  const isDev = process.env.NODE_ENV === 'development'
  const domain = isDev ? 'localhost' : process.env.APP_DOMAIN

  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        httpOptions: {
          timeout: 40000,
        },
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/',
      error: '/',
      newUser: '/',
      signOut: '/',
      verifyRequest: '/',
    },
    cookies: {
      ...(!isDev && {
        sessionToken: {
          name: `__Secure-next-auth.session-token`,
          options: {
            httpOnly: true,
            sameSite: 'none',
            path: '/',
            domain,
            secure: true,
          },
        },
      }),
    },
  }
}

export default authOptions
