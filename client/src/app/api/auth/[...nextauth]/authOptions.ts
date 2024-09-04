import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const isDev = true
const domain = 'localhost'

const authOptions: AuthOptions = {
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
}

export default authOptions
