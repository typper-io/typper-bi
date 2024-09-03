import { RenderTools } from '@/app/app/chat/components/tools'
import { CodeView } from '@/components/chat/code'
import { Message } from '@/hooks/use-assistant/types'
import Link from 'next/link'
import { useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export interface MessageContentProps {
  assistantMessage: Message
  threadId?: string
  disableAnimation?: boolean
}

const MarkdownMessage = ({
  assistantMessage,
  disableAnimation,
}: {
  disableAnimation?: boolean
  assistantMessage: Message
}) => {
  return useMemo(() => {
    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['img']}
        className="prose min-w-full"
        components={{
          code(props) {
            const { children, className, node, ...rest } = props

            const match = /language-(\w+)/.exec(className || '')

            return match ? (
              <CodeView language={match[1]}>{children}</CodeView>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            )
          },
          a: ({ children, href }) => (
            <Link href={href!} className="text-primary">
              {children}
            </Link>
          ),
          pre: ({ children }) => <pre className="not-prose">{children}</pre>,
          p: ({ children }) => {
            if (disableAnimation) {
              return <p>{children}</p>
            }

            return <p>{children}</p>
          },
        }}
      >
        {assistantMessage.content}
      </Markdown>
    )
  }, [assistantMessage.content, disableAnimation])
}

export const MessageContent = ({
  assistantMessage,
  threadId,
  disableAnimation,
}: MessageContentProps) => {
  return (
    <div key={assistantMessage.id}>
      {assistantMessage.data ? (
        <RenderTools
          message={assistantMessage.data}
          threadId={threadId || ''}
        />
      ) : (
        <>
          {assistantMessage.content && (
            <>
              <MarkdownMessage
                disableAnimation={disableAnimation}
                assistantMessage={assistantMessage}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
