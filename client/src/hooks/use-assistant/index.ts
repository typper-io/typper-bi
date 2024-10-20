/* eslint-disable react-hooks/rules-of-hooks */
import { customAlphabet } from 'nanoid/non-secure'
import { Dispatch, SetStateAction, useState } from 'react'

import { readDataStream } from '@/hooks/use-assistant/read-data-stream'
import { api } from '@/services/api'
import { Message } from '@/hooks/use-assistant/types'
import { useRouter } from 'next/navigation'

export const generateId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
)

export type AssistantStatus = 'in_progress' | 'awaiting_message'

export type UseAssistantHelpers = {
  /**
   * The current array of chat messages.
   */
  messages: Array<Message & { attachments?: Array<Attachment> }>

  /**
   * setState-powered method to update the messages array.
   */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>

  /**
   * The current value of the input field.
   */
  input: string

  /**
   * setState-powered method to update the input value.
   */
  setInput: React.Dispatch<React.SetStateAction<string>>

  /**
   * Form submission handler that automatically resets the input field and appends a user message.
   */
  sendMessage: (text?: string) => Promise<void>

  /**
   * The current status of the assistant. This can be used to show a loading indicator.
   */
  status: AssistantStatus

  /**
   * The error thrown during the assistant message processing, if any.
   */
  error: undefined | unknown

  /**
   * setState-powered method to update the assistant status.
   */
  setStatus: React.Dispatch<React.SetStateAction<AssistantStatus>>
}

export interface Attachment {
  /**
   * The name of the file.
   */
  filename: string
}

export type UseAssistantOptions = {
  /**
   * An optional string that represents the ID of an existing thread.
   * If not provided, a new thread will be created.
   */
  threadId: string | null

  /**
   * An optional array of files to be sent to the assistant.
   */
  files?: File[]

  /**
   * setState-powered method to update the files array.
   */
  setFiles?: Dispatch<SetStateAction<File[]>>
}

export function useAssistant({
  threadId,
  files,
  setFiles,
}: UseAssistantOptions): UseAssistantHelpers {
  const router = useRouter()

  const [messages, setMessages] = useState<
    Array<Message & { attachments?: Array<Attachment> }>
  >([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<AssistantStatus>('awaiting_message')
  const [error, setError] = useState<undefined | Error>(undefined)

  const sendMessage = async (text?: string) => {
    if ((!input && !text) || status !== 'awaiting_message') {
      return
    }

    setStatus('in_progress')

    setMessages((messages) => [
      ...messages,
      {
        id: '',
        role: 'user',
        content: text || input,
        attachments: files?.map((file) => ({
          filename: file.name,
        })),
      } as Message & { attachments?: Array<Attachment> },
    ])

    setInput('')
    setFiles?.([])

    const body = new FormData()

    body.append('text', input)

    for (const file of files || []) {
      body.append('file', file)
    }

    if (threadId) {
      body.append('threadId', threadId)
    }

    const result = await fetch(`${api.defaults.baseURL}/thread`, {
      method: 'POST',
      credentials: 'include',
      body,
    })

    if (result.body == null) {
      throw new Error('The response body is empty.')
    }

    try {
      for await (const { type, value } of readDataStream(
        result.body.getReader()
      )) {
        switch (type) {
          case 'assistant_message': {
            setMessages((messages) => [
              ...messages,
              {
                id: value.id,
                role: value.role,
                content: value.content[0].text.value,
              },
            ])
            break
          }

          case 'text': {
            // text delta - add to last message:
            setMessages((messages) => {
              const lastMessage = messages[messages.length - 1]
              return [
                ...messages.slice(0, messages.length - 1),
                {
                  id: lastMessage.id,
                  role: lastMessage.role,
                  content: lastMessage.content + value,
                },
              ]
            })

            break
          }

          case 'data_message': {
            setMessages((messages) => {
              const foundMessage = messages.find(
                (message) => message.id === value.id
              )

              if (foundMessage) {
                foundMessage.data = value.data
                return messages
              }

              return [
                ...messages,
                {
                  id: value.id ?? generateId(),
                  role: 'data',
                  content: '',
                  data: value.data,
                },
              ]
            })
            break
          }

          case 'assistant_control_data': {
            if (!threadId) {
              router.replace(`/app/chat?threadId=${value.threadId}`)
            }

            // set id of last message:
            setMessages((messages) => {
              const lastMessage = messages[messages.length - 1]
              lastMessage.id = value.messageId
              return [...messages.slice(0, messages.length - 1), lastMessage]
            })

            break
          }

          case 'error': {
            const errorObj = new Error(value)
            setError(errorObj)
            break
          }
        }
      }
    } catch (error) {
      setMessages((messages) => [
        ...messages,
        {
          id: '',
          role: 'assistant',
          content: 'error',
        },
      ])

      setError(error as Error)
    }

    setStatus('awaiting_message')
  }

  return {
    messages,
    setMessages,
    input,
    setInput,
    sendMessage,
    status,
    error,
    setStatus,
  }
}
