'use client'

import * as React from 'react'
import { GoogleLogo } from '@phosphor-icons/react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const callbackUrl = useSearchParams().get('callbackUrl')
  const priceId = useSearchParams().get('priceId')

  React.useEffect(() => {
    if (priceId) {
      localStorage.setItem('priceId', priceId)
    }
  }, [priceId])

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <div className="flex flex-col w-full gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() =>
            signIn('google', {
              callbackUrl: `/api/sign-in-or-sign-up?callbackUrl=${
                callbackUrl || '/app/chat'
              }`,
            })
          }
        >
          <GoogleLogo className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
    </div>
  )
}
