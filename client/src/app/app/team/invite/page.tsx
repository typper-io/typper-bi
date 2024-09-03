'use client'

import { Loader2, Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/services/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export interface Member {
  id: string
  name: string
  email: string
}

export default function Team() {
  const router = useRouter()

  const [emails, setEmails] = useState<string[]>([])
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const addEmail = useCallback(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    const newEmails = email.split(',').map((e) => e.trim())

    const validNewEmails = newEmails.filter(
      (e) => emailRegex.test(e) && !emails.includes(e)
    )

    setEmails((prevEmails) => [...prevEmails, ...validNewEmails])

    setEmail('')
  }, [email, emails])

  const removeEmail = useCallback(
    (email: string) => {
      setEmails((emails) => {
        const index = emails.indexOf(email)

        if (index === -1) return emails

        return [...emails.slice(0, index), ...emails.slice(index + 1)]
      })
    },
    [setEmails]
  )

  const sendInvites = useCallback(async () => {
    try {
      if (!emails.length || loading) return

      setLoading(true)

      await api.post('/workspace/invite', { emails })

      setLoading(false)

      toast('Invites sent', {
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })

      router.push('/app/team')
    } catch {
      setLoading(false)

      toast('Cannot send invites', {
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })
    }
  }, [emails, loading, router])

  return (
    <div className="bg-accent/50 flex h-full w-full flex-col gap-8 rounded-xl p-8">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="bg-transparent w-8 h-8"
          onClick={() => router.back()}
          size="icon"
        >
          <ArrowLeft size={16} />
        </Button>
        <p className="text-3xl font-semibold leading-9">Add members</p>
      </div>
      <div className="bg-accent/50 flex h-full w-full flex-col gap-4 overflow-y-auto rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Enter one or more emails (separated by commas)"
            type="text"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                addEmail()
              }
            }}
          />
          <Button variant="secondary" onClick={addEmail}>
            Add
          </Button>
        </div>

        <div className="flex w-full flex-col">
          {emails.map((email) => (
            <div
              key={email}
              className="animate-thread flex w-full items-center justify-between gap-4 py-[1px]"
            >
              <p>{email}</p>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeEmail(email)}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full justify-end gap-4">
        <Button
          onClick={sendInvites}
          disabled={loading || !emails.length}
          className="gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Invite members
        </Button>
      </div>
    </div>
  )
}
